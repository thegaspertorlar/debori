export function renderHome() {
  const el = document.createElement('div')
  el.className = 'page page--public'
  el.innerHTML = `
    <div class="page-title">
      <h1>Welcome to Debori</h1>
      <p class="muted">Manage community events with a simple, trustworthy product experience.</p>
    </div>
    <div class="card">
      <h2>Get started</h2>
      <p class="muted">Use the navigation above to browse events or sign in to manage them.</p>
    </div>
  `
  return el
}
