import fs from 'node:fs'
import vm from 'node:vm'

const url = new URL('./index.html', import.meta.url)
const svgUrl = new URL('./wordmark.svg', import.meta.url)
let html = fs.readFileSync(url, 'utf8')
const svgData = `data:image/svg+xml;base64,${fs.readFileSync(svgUrl).toString('base64')}`
html = html.replace(/src="(?:wordmark\.svg|data:image\/svg\+xml;base64,[^"]+)"/, `src="${svgData}"`)
for (const name of ['den','gs','no','okc','phx']) {
  const file = new URL(`./assets/${name}.png`, import.meta.url)
  html = html.replaceAll(`assets/${name}.png`, `data:image/png;base64,${fs.readFileSync(file).toString('base64')}`)
}

const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1]
if (!script) throw new Error('Prototype script missing')
const app = { innerHTML: '' }
const viewport = { scrollTop: 0 }
const document = {
  getElementById: id => id === 'app' ? app : viewport,
  querySelectorAll: () => [],
  addEventListener: () => {},
}
vm.runInNewContext(script, { document })
if (!app.innerHTML.includes('Recent results')) throw new Error('Initial screen did not render')
html = html.replace(/<!--FALLBACK_START-->[\s\S]*?<!--FALLBACK_END-->/,
  `<!--FALLBACK_START-->${app.innerHTML}<!--FALLBACK_END-->`)
fs.writeFileSync(url, html)
