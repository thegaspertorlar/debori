export function createLoadingCard(message = 'Loading…') {
  const c = document.createElement('div')
  c.className = 'card card--loading'
  c.setAttribute('role', 'status')
  c.setAttribute('aria-live', 'polite')
  c.innerHTML = `
    <div class="state-row">
      <div class="state__icon" aria-hidden>
        <div class="spinner spinner--lg"></div>
      </div>
      <div class="state__content">
        <h3 class="state__title">${message}</h3>
        <p class="muted state__message">Please wait — this only takes a moment.</p>
      </div>
    </div>
  `
  return c
}

export function createErrorCard(title = 'Something went wrong', message?: string) {
  const c = document.createElement('div')
  c.className = 'card card--error'
  c.setAttribute('role', 'alert')
  c.innerHTML = `
    <div class="state-row">
      <div class="state__icon" aria-hidden>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="state__svg">
          <circle cx="12" cy="12" r="10" fill="rgba(239,68,68,0.08)" />
          <path d="M12 7v6" stroke="#ef4444" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 17h.01" stroke="#ef4444" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="state__content">
        <h3 class="state__title">${title}</h3>
        <p class="muted state__message">${message || 'We were unable to complete that request. You can try again or reach out to support if the issue persists.'}</p>
        <div class="state__actions mt-3">
          <button class="btn btn--primary state__retry">Try again</button>
          <a class="btn btn--secondary" href="#/home">Home</a>
        </div>
      </div>
    </div>
  `

  // Emit a custom event so callers can attach a retry listener if they want
  const retryBtn = c.querySelector('.state__retry') as HTMLButtonElement
  retryBtn?.addEventListener('click', () => {
    const ev = new CustomEvent('state:retry', { bubbles: true })
    c.dispatchEvent(ev)
  })

  return c
}

export function createEmptyCard(title = 'Nothing here yet', message?: string, ctaText?: string, ctaHref?: string) {
  const c = document.createElement('div')
  c.className = 'card card--empty'
  c.setAttribute('role', 'status')
  c.innerHTML = `
    <div class="state-row">
      <div class="state__icon" aria-hidden>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="state__svg">
          <rect x="3" y="3" width="18" height="18" rx="3" fill="rgba(15,23,42,0.03)" />
          <path d="M8 12h8" stroke="#94a3b8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8 16h8" stroke="#94a3b8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="state__content">
        <h3 class="state__title">${title}</h3>
        <p class="muted state__message">${message || ''}</p>
      </div>
    </div>
  `
  if (ctaText && ctaHref) {
    const a = document.createElement('a')
    a.className = 'btn btn--primary'
    a.href = ctaHref
    a.setAttribute('data-link', '')
    a.textContent = ctaText
    const wrap = document.createElement('div')
    wrap.className = 'mt-3'
    wrap.appendChild(a)
    c.appendChild(wrap)
  }
  return c
}

// small animation style injected alongside components that depend on it
// The app's global CSS will pick this up; include a compact fallback for local use
if (typeof document !== 'undefined') {
  const id = 'ui-states-style'
  if (!document.getElementById(id)) {
    const s = document.createElement('style')
    s.id = id
    s.textContent = `@keyframes spin { to { transform: rotate(360deg) } } .spinner--lg { width: 38px; height: 38px; border-width: 4px } .card--loading { padding: 18px } .card--error { padding: 18px } .card--empty { padding: 18px }
    `
    document.head.appendChild(s)
  }
}

export default null
