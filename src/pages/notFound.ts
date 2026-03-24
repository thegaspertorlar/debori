export function renderNotFound() {
  const el = document.createElement('div')
  el.className = 'page page--public'
  el.innerHTML = `
    <div class="page-title">
      <h1>Not found</h1>
      <p class="muted">We couldn't find the page you were looking for.</p>
    </div>
    <div class="card">
      <h3>Page not found</h3>
      <p class="muted">The link may be broken or the item no longer exists. Try returning to the events list or the home page.</p>
      <div style="margin-top:12px; display:flex; gap:8px">
        <a class="btn btn--primary" href="#/events">View events</a>
        <a class="btn" href="#/home">Home</a>
      </div>
    </div>
  `
  return el
}
