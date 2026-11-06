// Renders the app icons as PNGs with no image dependencies: green tile, white progress pill.
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(td))
  return Buffer.concat([len, td, crc])
}

function png(size, shade) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const [r, g, b] = shade(x, y, size)
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = r
      raw[o + 1] = g
      raw[o + 2] = b
      raw[o + 3] = 255
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// Point inside a horizontal capsule from x0 to x1, centred on cy with radius r (unit coords).
const inCapsule = (x, y, x0, x1, cy, r) => {
  const dx = Math.max(x0 + r - x, 0, x - (x1 - r))
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const TOP = [34, 197, 94]
const BOTTOM = [21, 128, 61]
const WHITE = [255, 255, 255]

function shader(scale) {
  const w = 0.64 * scale
  const x0 = 0.5 - w / 2
  const x1 = 0.5 + w / 2
  const r = 0.075 * scale
  const fillEnd = x0 + w * 0.62
  const SS = 4
  return (px, py, size) => {
    let acc = [0, 0, 0]
    for (let sy = 0; sy < SS; sy++)
      for (let sx = 0; sx < SS; sx++) {
        const x = (px + (sx + 0.5) / SS) / size
        const y = (py + (sy + 0.5) / SS) / size
        let c = mix(TOP, BOTTOM, y)
        if (inCapsule(x, y, x0, x1, 0.5, r)) c = mix(c, WHITE, 0.3)
        if (inCapsule(x, y, x0, fillEnd, 0.5, r)) c = WHITE
        acc = acc.map((v, i) => v + c[i])
      }
    return acc.map((v) => Math.round(v / (SS * SS)))
  }
}

const out = new URL('../public/', import.meta.url)
writeFileSync(new URL('pwa-192.png', out), png(192, shader(1)))
writeFileSync(new URL('pwa-512.png', out), png(512, shader(1)))
writeFileSync(new URL('apple-touch-icon.png', out), png(180, shader(1)))
// Maskable icons are cropped to a circle on some platforms; keep the pill inside the safe zone.
writeFileSync(new URL('maskable-512.png', out), png(512, shader(0.8)))
console.log('icons written to public/')
