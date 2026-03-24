#!/usr/bin/env node
const http = require('http')
const fs = require('fs')
const path = require('path')

function contentType(filename) {
  const ext = path.extname(filename).toLowerCase()
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
  }
  return map[ext] || 'application/octet-stream'
}

function startServer({ port = 5174, root = process.cwd() } = {}) {
  const server = http.createServer((req, res) => {
    try {
      // Normalize URL and default to index.html for SPA routing
      let urlPath = decodeURIComponent(req.url.split('?')[0])
      if (urlPath === '/' || urlPath.startsWith('/#/')) {
        urlPath = '/index.html'
      }
      const filePath = path.join(root, urlPath)
      // If path maps to a directory, serve index.html inside it
      let finalPath = filePath
      if (fs.existsSync(finalPath) && fs.statSync(finalPath).isDirectory()) finalPath = path.join(finalPath, 'index.html')
      if (!fs.existsSync(finalPath)) {
        // Fallback to index.html for client-side routing
        finalPath = path.join(root, 'index.html')
      }

      const data = fs.readFileSync(finalPath)
      res.writeHead(200, { 'Content-Type': contentType(finalPath) })
      res.end(data)
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Server error')
    }
  })

  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(port, () => {
      const url = `http://localhost:${port}`
      console.log(`Static server started at ${url}`)
      resolve({ server, url })
    })
  })
}

module.exports = startServer

if (require.main === module) {
  // CLI: start and keep running
  startServer().catch((e) => { console.error(e); process.exit(1) })
}
