export function createLoadingCard(message = 'Loading…') {
  const c = document.createElement('div')
  c.className = 'card card--loading'
  c.innerHTML = `
    <div style="display:flex; align-items:center; gap:12px">
      <div aria-hidden class="spinner" style="width:28px; height:28px; border-radius:14px; border:4px solid rgba(0,0,0,0.06); border-top-color: var(--brand-600); animation: spin 900ms linear infinite"></div>
      <div style="flex:1">
        <div style="font-weight:600">${message}</div>
        <div class="muted" style="font-size:13px; margin-top:4px">Please wait — this usually only takes a moment.</div>
      </div>
    </div>
  `
  return c
}

export function createErrorCard(title = 'Something went wrong', message?: string) {
  const c = document.createElement('div')
  c.className = 'card card--error'
  c.innerHTML = `
    <h3>${title}</h3>
    <p class="muted">${message || 'We were unable to complete that request. Try again or contact support if the problem continues.'}</p>
  `
  return c
}

export function createEmptyCard(title = 'Nothing here yet', message?: string, ctaText?: string, ctaHref?: string) {
  const c = document.createElement('div')
  c.className = 'card card--empty'
  c.innerHTML = `
    <h3>${title}</h3>
    <p class="muted">${message || ''}</p>
  `
  if (ctaText && ctaHref) {
    const a = document.createElement('a')
    a.className = 'btn btn--primary'
    a.href = ctaHref
    a.setAttribute('data-link', '')
    a.textContent = ctaText
    const wrap = document.createElement('div')
    wrap.style.marginTop = '12px'
    wrap.appendChild(a)
    c.appendChild(wrap)
  }
  return c
}

// small animation style injected alongside components that depend on it
// The app's global CSS will pick this up; include a fallback for local use
if (typeof document !== 'undefined') {
  const id = 'ui-states-style'
  if (!document.getElementById(id)) {
    const s = document.createElement('style')
    s.id = id
    s.textContent = `@keyframes spin { to { transform: rotate(360deg) } } .card--loading { padding: 14px } .card--error { padding: 14px; border-left: 3px solid var(--color-danger, #ef4444) } .card--empty { padding: 18px; text-align: left }
    `
    document.head.appendChild(s)
  }
}

export default null
