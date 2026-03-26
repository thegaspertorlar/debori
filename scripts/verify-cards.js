#!/usr/bin/env node
/*
 Lightweight visual/regression checks for event card presentation.
 Usage: npm run verify:cards

 This script starts a small static server, launches a headless browser via Playwright,
 navigates to /#/events and /#/admin at desktop and mobile sizes, and checks that
 .event-card elements exist and have expected computed styles (e.g. display:flex, border-radius).
 It exits with code 0 on success, non-zero on failure.
 */

const fs = require('fs')
const path = require('path')
const startServer = require('./serve-static');

function resolveStaticRoot() {
  const distRoot = path.join(process.cwd(), 'dist')
  return fs.existsSync(path.join(distRoot, 'index.html')) ? distRoot : process.cwd()
}

function resolveChromiumExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
    '/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome',
    '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell'
  ].filter(Boolean)

  return candidates.find((candidate) => fs.existsSync(candidate))
}

(async () => {
  const { chromium } = require('playwright')
  const port = process.env.PORT || 5174
  const { server, url } = await startServer({ port: Number(port), root: resolveStaticRoot() })

  const routes = ['/#/events', '/#/admin']
  const viewports = {
    desktop: { width: 1280, height: 800 },
    mobile: { width: 375, height: 812 }
  }

  let browser
  try {
    const executablePath = resolveChromiumExecutable()
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) })
    const results = []

    for (const [bpName, vp] of Object.entries(viewports)) {
      for (const route of routes) {
        const page = await browser.newPage({ viewport: vp })
        const target = url + route
        console.log(`Checking ${route} @ ${bpName} (${vp.width}x${vp.height})`)
        await page.goto(target, { waitUntil: 'networkidle' })

        // Wait for either event-grid or admin container to render
        try {
          await page.waitForSelector('.event-card, .events-grid, #admin-events', { timeout: 5000 })
        } catch (e) {
          console.error(`No card/grid rendered for ${route} @ ${bpName}`)
          results.push({ route, bpName, ok: false, reason: 'no-grid' })
          await page.close()
          continue
        }

        // Ensure there is at least one .event-card
        const cardCount = await page.$$eval('.event-card', els => els.length)
        if (!cardCount) {
          console.error(`No .event-card elements found for ${route} @ ${bpName}`)
          results.push({ route, bpName, ok: false, reason: 'no-cards' })
          await page.close()
          continue
        }

        // Check computed style of the first card
        const first = await page.$('.event-card')
        const computed = await first.evaluate((el) => {
          const s = window.getComputedStyle(el)
          return {
            display: s.display,
            borderRadius: s.borderRadius,
            boxShadow: s.boxShadow,
            backgroundColor: s.backgroundColor
          }
        })

        // Check presence of expected structural classes inside the card
        const hasMedia = await page.$eval('.event-card', (el) => !!el.querySelector('.event-card__media'))
        const hasBody = await page.$eval('.event-card', (el) => !!el.querySelector('.event-card__body'))

        // Heuristics to detect fallback-to-plain-HTML (no CSS applied):
        // - display should be 'flex' (cards rely on flex layout)
        // - borderRadius should NOT be '0px'
        // - .event-card__media and .event-card__body should exist
        const ok = (computed.display === 'flex' || computed.display === 'inline-flex')
          && (computed.borderRadius && computed.borderRadius !== '0px')
          && hasMedia && hasBody

        if (!ok) {
          console.error(`Presentation mismatch for ${route} @ ${bpName}:`, computed, { hasMedia, hasBody })
        } else {
          console.log(`OK: ${route} @ ${bpName} — ${cardCount} cards, display=${computed.display}, borderRadius=${computed.borderRadius}`)
        }

        results.push({ route, bpName, ok, computed, cardCount, hasMedia, hasBody })
        await page.close()
      }
    }

    const failed = results.filter(r => !r.ok)
    if (failed.length) {
      console.error('\nVerification failed for some routes:')
      failed.forEach(f => console.error(` - ${f.route} @ ${f.bpName} (${f.reason || 'presentation'})`))
      await browser.close()
      server.close()
      process.exit(2)
    }

    console.log('\nAll checks passed: event card presentation appears normal for tested routes and breakpoints.')
    await browser.close()
    server.close()
    process.exit(0)
  } catch (err) {
    console.error('Error during verification:', err)
    if (browser) await browser.close()
    server && server.close()
    process.exit(3)
  }

})()
