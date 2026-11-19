/**
 * Generates the flat brand artwork the seed points at: category icons + covers, service covers + galleries, home banners.
 * Two colours only (brand blue on a light tint; white on brand blue for banners) so the app keeps its 60-30-10 balance.
 * Output: public/seed/{categories,services,banners}/*.png (React Native <Image> cannot render remote SVG, so PNG).
 *
 *   node scripts/seed/make-artwork.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { CATEGORY_ART, BANNERS } from './art-data.mjs'

const BLUE = '#1162BC'
const BLUE_DEEP = '#0D4D96'
const TINT = '#E8F1FB'
const TINT_ALT = '#DCE9F8'

const root = new URL('../../public/seed/', import.meta.url).pathname
const data = JSON.parse(fs.readFileSync(new URL('../../lib/data/services.json', import.meta.url), 'utf8'))
fs.rmSync(root, { recursive: true, force: true })
for (const d of ['categories', 'services', 'banners']) {
  fs.mkdirSync(path.join(root, d), { recursive: true })
}

const glyph = (inner, x, y, size, stroke, sw = 1.5) =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`
const esc = (t) => t.replace(/&/g, '&amp;')
const png = (svg, file) => sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(file)

let n = 0
for (const c of data.categories) {
  const art = CATEGORY_ART[c.id]
  await png(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="64" fill="${TINT}"/>${glyph(art.glyph, 64, 64, 128, BLUE, 1.6)}</svg>`, path.join(root, 'categories', `${c.id}-icon.png`))
  await png(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><rect width="900" height="560" fill="${TINT}"/>${glyph(art.glyph, 330, 130, 240, BLUE, 1.4)}</svg>`, path.join(root, 'categories', `${c.id}-cover.png`))
  n += 2
  for (const s of c.services) {
    for (let v = 0; v < 3; v += 1) {
      const bg = v === 1 ? TINT_ALT : TINT
      const size = v === 2 ? 180 : 240
      await png(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="640"><rect width="900" height="640" fill="${bg}"/>${glyph(art.glyph, 450 - size / 2, 320 - size / 2, size, BLUE, 1.4)}</svg>`, path.join(root, 'services', `${s.id}-${v}.png`))
      n += 1
    }
  }
}

for (const [i, b] of BANNERS.entries()) {
  const art = CATEGORY_ART[b.category]
  const bg = i % 2 === 0 ? BLUE : BLUE_DEEP
  const f = 'Helvetica, Arial, sans-serif'
  await png(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="500"><rect width="1200" height="500" fill="${bg}"/>${glyph(art.glyph, 800, 110, 280, '#fff', 1.3)}
<text x="64" y="150" font-family="${f}" font-size="28" font-weight="700" fill="#fff" opacity="0.8" letter-spacing="3">${esc(b.kicker)}</text>
<text x="64" y="236" font-family="${f}" font-size="64" font-weight="800" fill="#fff">${esc(b.line1)}</text>
<text x="64" y="312" font-family="${f}" font-size="64" font-weight="800" fill="#fff">${esc(b.line2)}</text>
<rect x="64" y="370" width="220" height="64" rx="32" fill="#fff"/>
<text x="174" y="412" text-anchor="middle" font-family="${f}" font-size="26" font-weight="700" fill="${bg}">${esc(b.cta)}</text></svg>`, path.join(root, 'banners', `${b.file}.png`))
  n += 1
}
process.stdout.write(`Generated ${n} images in public/seed\n`)
