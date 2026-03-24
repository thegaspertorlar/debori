export function renderAdmin() {
  const el = document.createElement('div')
  el.className = 'page'
  el.innerHTML = `
    <div class="page-title">
      <h1>Admin</h1>
      <p class="muted">Administrative console — prototype view.</p>
    </div>
    <div class="card">
      <h3>Actions</h3>
      <div style="display:flex; gap:8px; flex-wrap:wrap">
        <a class="btn btn--primary" href="#/events">View Events</a>
        <a class="btn btn--secondary" href="#/events/create">Create Event</a>
      </div>
    </div>
  `
  return el
}
