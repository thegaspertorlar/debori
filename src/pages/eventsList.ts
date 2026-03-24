import { listPublicEvents } from '../api/mockApi'

function formatDate(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString()
}

export function renderEventsList() {
  const el = document.createElement('div')
  el.className = 'page'
  el.innerHTML = `
    <div class="page-title">
      <h1>Events</h1>
      <p class="muted">Browse upcoming and recent events.</p>
    </div>
    <div id="events-list" class="card">Loading events…</div>
  `

  const list = el.querySelector('#events-list') as HTMLElement

  // Fetch events and render asynchronously
  ;(async () => {
    list.textContent = 'Loading events…'
    const res = await listPublicEvents()
    if (!res.ok) {
      list.innerHTML = `<p class="muted">Unable to load events. ${res.message || ''}</p>`
      return
    }
    const events = res.data
    if (!events.length) {
      list.innerHTML = `<p class="muted">No events found.</p>`
      return
    }

    const ul = document.createElement('ul')
    ul.style.listStyle = 'none'
    ul.style.padding = '0'
    ul.style.margin = '0'

    events.slice(0, 50).forEach((ev) => {
      const li = document.createElement('li')
      li.className = 'card card--compact'
      li.style.marginBottom = '12px'
      li.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px">
          <div>
            <a href="#/events/${ev.id}" data-link style="font-weight:600; color:inherit; text-decoration:none">${ev.title}</a>
            <div class="muted">${ev.shortDescription || ''}</div>
          </div>
          <div class="muted" style="text-align:right">${formatDate(ev.startDate)}<div style="font-size:12px">${ev.location?.city || (ev.isOnline ? 'Online' : '')}</div></div>
        </div>
      `
      ul.appendChild(li)
    })

    list.innerHTML = ''
    list.appendChild(ul)
  })()

  return el
}
