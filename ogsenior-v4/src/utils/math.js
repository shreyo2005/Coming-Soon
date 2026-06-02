export const lerp = (a, b, t) => a + (b - a) * t
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
export const smooth = t => t * t * (3 - 2 * t) // smoothstep
export const easeOut3 = t => 1 - Math.pow(1 - t, 3)
