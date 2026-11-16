"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import type { BgSource } from "@/app/_components/bg-image";
import { cn } from "@/app/_lib/utils";

/**
 * The swap between slides: the next photo burns through the current one
 * from a point, along a noisy front with a glowing edge.
 *
 *   dur      ms the swap takes
 *   hold     ms each photo stays before the next swap
 *   origin   where the front starts: "random", "center" or [x, y] (0–1)
 *   nscale   noise frequency of the front
 *   nweight  how much the front follows the noise (0) vs the distance (1)
 *   glowI    glow intensity of the edge
 *   glowW    width of the edge, in front units (0–1)
 *   charA    how dark the current photo chars just ahead of the edge
 *   leakI    light leak washing from the origin while the swap runs
 *   c1, c2   edge colours: c1 the rim, c2 the hot core
 */
export const swapEffect = {
  dur: 2000,
  hold: 5200,
  origin: "random" as "random" | "center" | [number, number],
  nscale: 3,
  nweight: 0.75,
  glowI: 3,
  glowW: 0.16,
  charA: 1,
  leakI: 0.55,
  c1: "#f43f5f",
  c2: "#ffd1da",
};

const vertex = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const fragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform vec4 uFromFit;
uniform vec4 uToFit;
uniform float uProgress;
uniform vec2 uOrigin;
uniform float uAspect;
uniform float uSeed;
uniform float uNScale;
uniform float uNWeight;
uniform float uGlowI;
uniform float uGlowW;
uniform float uCharA;
uniform float uLeakI;
uniform vec3 uC1;
uniform vec3 uC2;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
  return v;
}
vec3 photo(sampler2D t, vec4 fit) { return texture2D(t, fit.zw + vUv * fit.xy).rgb; }

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  vec2 o = vec2(uOrigin.x * uAspect, uOrigin.y);
  // distance over the farthest corner, so the front always clears the frame
  float far = max(max(distance(o, vec2(0.0)), distance(o, vec2(uAspect, 0.0))),
                  max(distance(o, vec2(0.0, 1.0)), distance(o, vec2(uAspect, 1.0))));
  float d = distance(p, o) / far;
  float n = clamp((fbm(p * uNScale + uSeed) - 0.15) / 0.7, 0.0, 1.0);
  float f = mix(d, n, uNWeight);

  // k: < -1 untouched, -1..0 charring ahead of the edge, 0..1 the burning
  // edge, > 1 the next photo
  float front = uProgress * (1.0 + 2.0 * uGlowW) - uGlowW;
  float k = (front - f) / uGlowW;

  float ch = clamp(k + 1.0, 0.0, 1.0);
  vec3 col = photo(uFrom, uFromFit) * (1.0 - 0.9 * uCharA * ch * ch);
  col = mix(col, photo(uTo, uToFit), smoothstep(0.35, 1.0, k));

  float edge = smoothstep(-0.05, 0.25, k) * (1.0 - smoothstep(0.25, 1.0, k));
  col += mix(uC1, uC2, smoothstep(0.55, 1.0, edge)) * edge * uGlowI * 0.33;

  float leak = uLeakI * sin(3.14159265 * uProgress) * (1.0 - smoothstep(0.0, 0.9, d));
  col += mix(uC1, uC2, 0.35) * leak * 0.5;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const rgb = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];

const ease = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

type Photo = { texture: WebGLTexture; width: number; height: number };

/**
 * Background slides that swap with `swapEffect`, covering their positioned
 * parent. `children` is the first slide as a plain image (BgImage), so it
 * shows straight from the HTML; the canvas fades in over it once WebGL has
 * it. Reduced motion, or no WebGL, keeps that first image.
 */
export function BgSlideshow({
  slides,
  children,
  className,
}: {
  slides: BgSource[];
  children: ReactNode;
  className?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = el.getContext("webgl", { alpha: false, antialias: false });
    if (!gl || gl.isContextLost()) return;

    const shader = (type: number, source: string) => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (gl.getShaderParameter(s, gl.COMPILE_STATUS)) return s;
      console.warn("BgSlideshow:", gl.getShaderInfoLog(s));
      return null;
    };
    const vs = shader(gl.VERTEX_SHADER, vertex);
    const fs = shader(gl.FRAGMENT_SHADER, fragment);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return; // the first photo stays, static
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const fx = swapEffect;
    gl.uniform1i(u("uFrom"), 0);
    gl.uniform1i(u("uTo"), 1);
    gl.uniform1f(u("uNScale"), fx.nscale);
    gl.uniform1f(u("uNWeight"), fx.nweight);
    gl.uniform1f(u("uGlowI"), fx.glowI);
    gl.uniform1f(u("uGlowW"), fx.glowW);
    gl.uniform1f(u("uCharA"), fx.charA);
    gl.uniform1f(u("uLeakI"), fx.leakI);
    gl.uniform3fv(u("uC1"), rgb(fx.c1));
    gl.uniform3fv(u("uC2"), rgb(fx.c2));
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // photos load one ahead of the one showing
    const photos: (Photo | null)[] = slides.map(() => null);
    const loading = new Map<number, Promise<void>>();
    const load = (i: number) => {
      if (!loading.has(i))
        loading.set(
          i,
          new Promise<void>((resolve) => {
            const img = new Image();
            img.decoding = "async";
            img.onload = () => {
              const texture = gl.createTexture()!;
              gl.bindTexture(gl.TEXTURE_2D, texture);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
              photos[i] = { texture, width: img.naturalWidth, height: img.naturalHeight };
              resolve();
            };
            // WebP everywhere now, but keep the JPG as a way out
            img.onerror = () => {
              if (img.src.endsWith(".webp")) img.src = slides[i].jpg;
              else resolve();
            };
            img.src = slides[i].webp;
          }),
        );
      return loading.get(i)!;
    };

    // object-fit: cover around the focal point, in flipped texture space
    const fit = (i: number): [number, number, number, number] => {
      const photo = photos[i]!;
      const [fx0, fy0] = slides[i].focal;
      const view = el.width / el.height;
      const image = photo.width / photo.height;
      if (image > view) {
        const sx = view / image;
        return [sx, 1, (1 - sx) * fx0, 0];
      }
      const sy = image / view;
      return [1, sy, 0, (1 - sy) * (1 - fy0)];
    };

    let current = 0;
    let next = 1;
    let progress = 0;
    let origin: [number, number] = [0.5, 0.5];
    let seed = 0;

    const draw = () => {
      if (!photos[current]) return;
      const to = photos[next] ? next : current;
      gl.viewport(0, 0, el.width, el.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, photos[current]!.texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, photos[to]!.texture);
      gl.uniform4fv(u("uFromFit"), fit(current));
      gl.uniform4fv(u("uToFit"), fit(to));
      gl.uniform1f(u("uProgress"), to === current ? 0 : progress);
      gl.uniform2fv(u("uOrigin"), origin);
      gl.uniform1f(u("uAspect"), el.width / el.height);
      gl.uniform1f(u("uSeed"), seed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };

    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      const { width, height } = el.getBoundingClientRect();
      el.width = Math.max(1, Math.round(width * scale));
      el.height = Math.max(1, Math.round(height * scale));
      draw();
    };
    const sizes = new ResizeObserver(resize);
    sizes.observe(el);

    // paused while off screen or in a background tab; a swap due meanwhile
    // waits for the slide to come back
    let visible = true;
    let due = false;
    let timer = 0;
    let frame = 0;
    let stopped = false;

    const swap = async () => {
      due = false;
      await load(next);
      if (stopped) return;
      origin =
        fx.origin === "random"
          ? [0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7]
          : fx.origin === "center"
            ? [0.5, 0.5]
            : [fx.origin[0], 1 - fx.origin[1]];
      seed = Math.random() * 100;
      const start = performance.now();
      // timed with performance.now(), not the frame's timestamp, which can
      // start slightly before `start`
      const tick = () => {
        const t = (performance.now() - start) / fx.dur;
        progress = ease(Math.min(1, Math.max(0, t)));
        draw();
        if (progress < 1) frame = requestAnimationFrame(tick);
        else {
          current = next;
          next = (next + 1) % slides.length;
          progress = 0;
          void load(next);
          wait();
        }
      };
      frame = requestAnimationFrame(tick);
    };
    const wait = () => {
      timer = window.setTimeout(() => {
        if (visible && !document.hidden) void swap();
        else due = true;
      }, fx.hold);
    };
    const resume = () => {
      if (due && visible && !document.hidden) void swap();
    };

    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      resume();
    });
    seen.observe(el);
    document.addEventListener("visibilitychange", resume);

    void load(current).then(() => {
      if (stopped || !photos[current]) return;
      resize();
      setLive(true);
      void load(next);
      wait();
    });

    return () => {
      stopped = true;
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      sizes.disconnect();
      seen.disconnect();
      document.removeEventListener("visibilitychange", resume);
      // free what this run made, but keep the context: the canvas may mount
      // again (Strict Mode does in dev) and a lost context can't come back
      photos.forEach((photo) => photo && gl.deleteTexture(photo.texture));
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      setLive(false);
    };
  }, [slides]);

  return (
    <>
      {children}
      <canvas
        ref={canvas}
        aria-hidden
        className={cn(
          "absolute inset-0 size-full transition-opacity duration-500",
          live ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </>
  );
}
