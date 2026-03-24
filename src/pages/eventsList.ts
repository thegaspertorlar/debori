import { events } from '../data/seed'

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
    <div id="events-list" class="card"></div>
  `

  const list = el.querySelector('#events-list') as HTMLElement
  const ul = document.createElement('ul')
  ul.style.listStyle = 'none'
  ul.style.padding = '0'
  ul.style.margin = '0'

  events.slice(0, 20).forEach((ev) => {
    const li = document.createElement('li')
    li.className = 'card card--compact'
    li.style.marginBottom = '12px'
    li.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px">
        <div>
          <a href="#/events/${ev.id}" data-link style="font-weight:600; color:inherit; text-decoration:none">${ev.title}</a>
          <div class="muted">${ev.shortDescription}</div>
        </div>
        <div class="muted" style="text-align:right">${formatDate(ev.startDate)}<div style="font-size:12px">${ev.location?.city || ''}</div></div>
      </div>
    `
    ul.appendChild(li)
  })

  list.appendChild(ul)
  return el
}
