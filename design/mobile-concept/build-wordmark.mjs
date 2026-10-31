import fs from 'node:fs'

const source = fs.readFileSync(new URL('../../src/lib/brand.ts', import.meta.url), 'utf8')
const glyphs = Object.fromEntries(
  [...source.matchAll(/^  ([a-z]): '([^']+)',?$/gm)].map(([, letter, path]) => [letter, path]),
)
const letters = [...source.matchAll(/\['([a-z])', ([0-9.]+)\]/g)].map(([, letter, x]) => [letter, x])
if (letters.length !== 10 || letters.some(([letter]) => !glyphs[letter])) throw new Error('Brand outlines changed')

const paths = letters.map(([letter, x]) =>
  `<path d="${glyphs[letter]}" transform="translate(${x} 123) scale(0.064 -0.064)"/>`,
).join('')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="25 28 751 122" role="img" aria-label="myteam.fans"><g fill="#fff">${paths}</g><circle cx="506.624" cy="111" r="9.5" fill="#fec524"/></svg>`
fs.writeFileSync(new URL('./wordmark.svg', import.meta.url), svg)
