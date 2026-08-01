import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const svgPath = path.join(root, 'public', 'pwa-icon.svg')
const svgUrl = 'file:///' + svgPath.replace(/\\/g, '/')
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

for (const [size, out] of [[512, 'pwa-512x512.png'], [192, 'pwa-192x192.png']]) {
  const htmlPath = path.join(root, `icon-${size}.html`)
  const fs = await import('node:fs')
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
