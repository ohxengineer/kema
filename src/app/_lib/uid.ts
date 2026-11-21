let counter = 0;

/**
 * A unique id for things created in the browser (objectives, key results).
 * Not crypto.randomUUID: browsers only offer it on secure pages (https or
 * localhost), so it's missing when the app is opened over the network.
 */
export function uid() {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
