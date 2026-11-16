#!/usr/bin/env node
/**
 * Gives every background image in public/images/bg the same "speed" look and
 * writes it to public/images/bg/processed as <name>.webp and <name>.jpg.
 * Runs before `dev` and `build`; `npm run bg:process -- --force` redoes all.
 *
 * Pipeline, per image (options in bg-effects.config.json):
 *   1. Directional blur along the subject's motion: `zoom` averages copies
 *      scaled 1 → 1 + strength around the focal point; `pan` blurs on X only.
 *   2. The original over the blur through a soft ellipse at the focal point,
 *      so the subject stays sharp with no visible edge.
 *   3. Black and white from 0.65 R + 0.25 G + 0.10 B (blues go dark, skin and
 *      splashes stay bright), auto-contrast clipping 1%, then contrast 1.25×.
 *   4. Optionally, a bottom gradient for text: clear at 55% height, 85% black
 *      at the bottom.
 *
 * Pixel sizes (pan sigma, mask feather) are tuned for a 2400px-wide image and
 * scale with the width, so smaller sources get the same look.
 */
import { mkdir, readFile, readdir, stat } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const script = fileURLToPath(import.meta.url)
const root = path.resolve(path.dirname(script), "..")
const SOURCE = path.join(root, "public/images/bg")
const OUTPUT = path.join(SOURCE, "processed")
const CONFIG = path.join(root, "bg-effects.config.json")

const MAX_WIDTH = 2400
const IMAGE = /\.(jpe?g|png|webp|avif|tiff?)$/i
const ZOOM_COPIES = 16
/** Horizontal blur sigma for `pan` at the default strength, at 2400px. */
const PAN_SIGMA = 25
/** Feather of the subject mask, at 2400px (the spec's 90–120px). */
const MASK_FEATHER = 105
const BUILT_IN = {
  mode: "zoom",
  focal: [0.5, 0.4],
  strength: 0.12,
  bw: true,
  gradient: false,
}

const force = process.argv.includes("--force")
const mtime = async (file) => (await stat(file).catch(() => null))?.mtimeMs ?? 0
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

async function loadConfig() {
  const text = await readFile(CONFIG, "utf8").catch(() => "{}")
  const raw = JSON.parse(text)
  return {
    defaults: { ...BUILT_IN, ...raw.defaults },
    images: raw.images ?? {},
  }
}

function check(name, o) {
  const fail = (msg) => {
    throw new Error(`bg-effects.config.json, ${name}: ${msg}`)
  }
  if (o.mode !== "zoom" && o.mode !== "pan") fail(`mode must be "zoom" or "pan"`)
  const [fx, fy] = o.focal ?? []
  if (![fx, fy].every((v) => typeof v === "number" && v >= 0 && v <= 1))
    fail("focal must be [x, y] between 0 and 1")
  if (!(o.strength > 0)) fail("strength must be above 0")
}

/** Zoom blur: the mean of copies scaled 1 → 1 + strength around the focal point. */
async function zoomBlur(rgb, w, h, [fx, fy], strength) {
  const sum = new Float32Array(w * h * 3)
  for (let i = 0; i < ZOOM_COPIES; i++) {
    const scale = 1 + (strength * i) / (ZOOM_COPIES - 1)
    const sw = Math.round(w * scale)
    const sh = Math.round(h * scale)
    // keep the focal point where it was: it lands at f·sw, we want it at f·w
    const left = clamp(Math.round(fx * (sw - w)), 0, sw - w)
    const top = clamp(Math.round(fy * (sh - h)), 0, sh - h)
    const { data: copy, info } = await sharp(rgb, {
      raw: { width: w, height: h, channels: 3 },
    })
      .resize(sw, sh)
      .extract({ left, top, width: w, height: h })
      .raw()
      .toBuffer({ resolveWithObject: true })
    expectChannels("zoom copy", info, 3)
    for (let j = 0; j < sum.length; j++) sum[j] += copy[j]
  }
  for (let j = 0; j < sum.length; j++) sum[j] /= ZOOM_COPIES
  return sum
}

/** Box widths whose three passes approximate a Gaussian of `sigma`. */
function gaussBoxes(sigma) {
  const ideal = Math.sqrt((12 * sigma * sigma) / 3 + 1)
  let lower = Math.floor(ideal)
  if (lower % 2 === 0) lower--
  const lowerCount = Math.round(
    (12 * sigma * sigma - 3 * lower * lower - 12 * lower - 9) / (-4 * lower - 4)
  )
  return [0, 1, 2].map((i) => (i < lowerCount ? lower : lower + 2))
}

/** One horizontal box blur pass, edges clamped. */
function boxBlurX(src, dst, w, h, radius) {
  const norm = 1 / (2 * radius + 1)
  for (let y = 0; y < h; y++) {
    const row = y * w * 3
    for (let k = 0; k < 3; k++) {
      let acc = 0
      for (let i = -radius; i <= radius; i++)
        acc += src[row + clamp(i, 0, w - 1) * 3 + k]
      for (let x = 0; x < w; x++) {
        dst[row + x * 3 + k] = acc * norm
        acc +=
          src[row + Math.min(x + radius + 1, w - 1) * 3 + k] -
          src[row + Math.max(x - radius, 0) * 3 + k]
      }
    }
  }
}

/** Pan blur: Gaussian on X only, never vertical. */
function panBlur(rgb, w, h, sigma) {
  let a = Float32Array.from(rgb)
  let b = new Float32Array(a.length)
  for (const size of gaussBoxes(sigma)) {
    boxBlurX(a, b, w, h, (size - 1) / 2)
    ;[a, b] = [b, a]
  }
  return a
}

/** The subject mask: a soft white ellipse (80% × 30%) at the focal point, 0–255. */
async function subjectMask(w, h, [fx, fy]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" fill="#000"/>
    <ellipse cx="${fx * w}" cy="${fy * h}" rx="${0.4 * w}" ry="${0.15 * h}" fill="#fff"/>
  </svg>`
  const hard = await sharp(Buffer.from(svg)).extractChannel(0).raw().toBuffer()
  // sharp hands a blurred single channel back as sRGB unless told otherwise
  const { data, info } = await sharp(hard, {
    raw: { width: w, height: h, channels: 1 },
  })
    .blur(Math.max(1, (MASK_FEATHER * w) / MAX_WIDTH))
    .toColourspace("b-w")
    .raw()
    .toBuffer({ resolveWithObject: true })
  expectChannels("mask", info, 1)
  return data
}

function expectChannels(step, info, channels) {
  if (info.channels !== channels)
    throw new Error(`bg: ${step} has ${info.channels} channels, expected ${channels}`)
}

/** Black and white by channel mix, auto-contrast (1% clip), contrast 1.25×. */
function blackAndWhite(rgb, w, h) {
  const gray = new Float32Array(w * h)
  const histogram = new Uint32Array(256)
  for (let p = 0; p < gray.length; p++) {
    const v =
      0.65 * rgb[p * 3] + 0.25 * rgb[p * 3 + 1] + 0.1 * rgb[p * 3 + 2]
    gray[p] = v
    histogram[clamp(Math.round(v), 0, 255)]++
  }
  const clip = gray.length * 0.01
  let lo = 0
  for (let seen = 0; lo < 255 && (seen += histogram[lo]) <= clip; ) lo++
  let hi = 255
  for (let seen = 0; hi > 0 && (seen += histogram[hi]) <= clip; ) hi--
  const stretch = 255 / Math.max(1, hi - lo)
  for (let p = 0; p < gray.length; p++) {
    const v = (gray[p] - lo) * stretch
    gray[p] = (v - 128) * 1.25 + 128
  }
  return gray
}

/** Darkens toward the bottom: clear at 55% height, 85% black at the bottom. */
function bottomGradient(pixels, w, h, channels) {
  const start = Math.floor(h * 0.55)
  for (let y = start; y < h; y++) {
    const keep = 1 - (0.85 * (y - start)) / (h - 1 - start || 1)
    const row = y * w * channels
    for (let i = row; i < row + w * channels; i++) pixels[i] *= keep
  }
}

async function processImage(file, base, options) {
  const { data, info } = await sharp(path.join(SOURCE, file))
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .removeAlpha()
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true })
  expectChannels("source", info, 3)
  const { width: w, height: h } = info

  // 1. motion blur
  const blurred =
    options.mode === "pan"
      ? panBlur(
          data,
          w,
          h,
          PAN_SIGMA * (options.strength / BUILT_IN.strength) * (w / MAX_WIDTH)
        )
      : await zoomBlur(data, w, h, options.focal, options.strength)

  // 2. sharp subject over the blur
  const mask = await subjectMask(w, h, options.focal)
  const mixed = new Float32Array(w * h * 3)
  for (let p = 0; p < w * h; p++) {
    const m = mask[p] / 255
    for (let k = 0; k < 3; k++) {
      const i = p * 3 + k
      mixed[i] = blurred[i] * (1 - m) + data[i] * m
    }
  }

  // 3. black and white
  const channels = options.bw ? 1 : 3
  const pixels = options.bw ? blackAndWhite(mixed, w, h) : mixed

  // 4. text gradient
  if (options.gradient) bottomGradient(pixels, w, h, channels)

  const bytes = Buffer.alloc(pixels.length)
  for (let i = 0; i < pixels.length; i++)
    bytes[i] = clamp(Math.round(pixels[i]), 0, 255)
  const image = () => sharp(bytes, { raw: { width: w, height: h, channels } })
  await Promise.all([
    image()
      .webp({ quality: 80 })
      .toFile(path.join(OUTPUT, `${base}.webp`)),
    image()
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(OUTPUT, `${base}.jpg`)),
  ])
  return { w, h }
}

async function main() {
  const entries = await readdir(SOURCE, { withFileTypes: true }).catch(() => [])
  const files = entries.filter((e) => e.isFile() && IMAGE.test(e.name))
  if (!files.length) {
    console.log("bg: no images in public/images/bg, nothing to do")
    return
  }
  await mkdir(OUTPUT, { recursive: true })

  const config = await loadConfig()
  // a changed config or script redoes every image
  const settings = Math.max(await mtime(CONFIG), await mtime(script))
  let done = 0
  let fresh = 0
  for (const { name } of files) {
    const options = { ...config.defaults, ...config.images[name] }
    check(name, options)
    const base = name.replace(IMAGE, "")
    const outputs = ["webp", "jpg"].map((ext) =>
      path.join(OUTPUT, `${base}.${ext}`)
    )
    const newestInput = Math.max(await mtime(path.join(SOURCE, name)), settings)
    const oldestOutput = Math.min(...(await Promise.all(outputs.map(mtime))))
    if (!force && oldestOutput > newestInput) {
      fresh++
      continue
    }
    const started = Date.now()
    const { w, h } = await processImage(name, base, options)
    console.log(
      `bg: ${name} → processed/${base}.{webp,jpg} (${options.mode}, ${w}×${h}, ${Date.now() - started}ms)`
    )
    done++
  }
  console.log(`bg: ${done} processed, ${fresh} up to date`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
