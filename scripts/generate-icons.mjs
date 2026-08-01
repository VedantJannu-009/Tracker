import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const fs = await import('node:fs')
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const jobs = [
  ['pwa-icon.svg', 512, 'pwa-512x512.png'],
  ['pwa-icon.svg', 192, 'pwa-192x192.png'],
  ['pwa-maskable.svg', 512, 'pwa-maskable-512x512.png'],
  ['pwa-maskable.svg', 192, 'pwa-maskable-192x192.png'],
  ['pwa-maskable.svg', 180, 'apple-touch-icon.png'],
]

for (const [svg, size, out] of jobs) {
  const svgPath = path.join(root, 'public', svg)
  const svgUrl = 'file:///' + svgPath.replace(/\\/g, '/')
  const htmlPath = path.join(root, `icon-${size}.html`)
  fs.writeFileSync(htmlPath, `<html><body style="margin:0"><img src="${svgUrl}" width="${size}" height="${size}" style="display:block;width:${size}px;height:${size}px"></body></html>`)
  const htmlUrl = 'file:///' + htmlPath.replace(/\\/g, '/')
  const outPath = path.join(root, 'public', out)
  if (fs.existsSync(outPath)) fs.unlinkSync(outPath)
  const res = spawnSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--window-size=${size},${size}`,
    `--screenshot=${outPath}`,
    htmlUrl,
  ], { stdio: 'pipe', encoding: 'utf8' })
  console.log(out, 'exit', res.status)
  if (res.stderr) console.log(res.stderr.slice(0, 500))
  fs.unlinkSync(htmlPath)
}
