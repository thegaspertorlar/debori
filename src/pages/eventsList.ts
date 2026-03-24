import { listPublicEvents } from '../api/mockApi'
import { createLoadingCard, createErrorCard, createEmptyCard } from '../uiStates'

function formatDateRange(start?: string, end?: string) {
  if (!start) return ''
  const s = new Date(start)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }
  const startStr = s.toLocaleString(undefined, opts)
  if (!end) return startStr
  const e = new Date(end)
  // If same day, show "Mar 24, 6:00–8:00 PM" style
  const sameDay = s.toDateString() === e.toDateString()
  if (sameDay) {
    const endTime = e.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${s.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })} - ${endTime}`
  }
  const endStr = e.toLocaleString(undefined, opts)
  return `${startStr} — ${endStr}`
}

export function renderEventsList() {
  const el = document.createElement('div')
  el.className = 'page'
  el.innerHTML = `
    <div class="page-title">
      <h1>Events</h1>
      <p class="muted">Browse upcoming and recent events.</p>
    </div>
    <div id="events-list"></div>
  `

  const list = el.querySelector('#events-list') as HTMLElement
  // initial loading state
  list.appendChild(createLoadingCard('Loading events'))

  // Fetch events and render asynchronously as a responsive grid with pagination
  ;(async () => {
    // replace with loading card while awaiting
    list.innerHTML = ''
    list.appendChild(createLoadingCard('Loading events'))
    const res = await listPublicEvents()
    if (!res.ok) {
      list.innerHTML = ''
      list.appendChild(createErrorCard('Unable to load events', res.message))
      return
    }
    const events = res.data || []

    // Server returns only published events with future endDate; copy and sort client-side
    const visible = events.slice()
      .sort((a, b) => {
        const aKey = a.startDate ? Date.parse(a.startDate) : Date.parse(a.createdAt)
        const bKey = b.startDate ? Date.parse(b.startDate) : Date.parse(b.createdAt)
        return (aKey || 0) - (bKey || 0)
      })

    list.innerHTML = ''

    if (!visible.length) {
      list.innerHTML = ''
      list.appendChild(createEmptyCard('No upcoming events', 'There are no published events ending in the future right now. Check back later or explore other sections of the site.', 'View admin', '#/admin'))
      return
    }

    const grid = document.createElement('div')
    grid.className = 'events-grid'

    // Pagination state
    const pageSize = 12
    let shown = 0

    function renderCardsAppend(count: number) {
      const slice = visible.slice(shown, shown + count)
      slice.forEach((ev) => {
        const a = document.createElement('a')
        a.className = 'event-card'
        a.href = `#/events/${ev.id}`
        a.setAttribute('data-link', '')

        const img = document.createElement('img')
        img.className = 'event-card__media'
        img.alt = ev.title || 'Event image'
        img.src = ev.heroImage || `https://picsum.photos/seed/${encodeURIComponent(ev.id)}/600/380`

        const body = document.createElement('div')
        body.className = 'event-card__body'

        // header with date + title for stronger hierarchy
        const header = document.createElement('div')
        header.className = 'event-card__header'

        const left = document.createElement('div')
        left.className = 'flex-1'

        const dateSpan = document.createElement('div')
        dateSpan.className = 'event-card__date'
        dateSpan.textContent = formatDateRange(ev.startDate, ev.endDate)

        const title = document.createElement('h3')
        title.className = 'event-card__title'
        title.textContent = ev.title || 'Untitled event'

        left.appendChild(dateSpan)
        left.appendChild(title)

        header.appendChild(left)

        body.appendChild(header)

        if (ev.shortDescription) {
          const desc = document.createElement('div')
          desc.className = 'event-card__dek'
          desc.textContent = ev.shortDescription
          body.appendChild(desc)
        }

        const meta = document.createElement('div')
        meta.className = 'event-card__meta'
        const addr = document.createElement('div')
        addr.className = 'event-card__location'
        addr.textContent = ev.isOnline ? 'Online' : (ev.location?.address || ev.location?.city || '')

        meta.appendChild(addr)
        body.appendChild(meta)

        a.appendChild(img)
        a.appendChild(body)

        grid.appendChild(a)
      })
      shown += slice.length
    }

    // initial render
    renderCardsAppend(pageSize)

    list.appendChild(grid)

    const footer = document.createElement('div')
    footer.className = 'events-footer'
    const loadMoreBtn = document.createElement('button')
    loadMoreBtn.className = 'btn btn--primary'
    loadMoreBtn.textContent = 'Load more'
    loadMoreBtn.type = 'button'
    loadMoreBtn.addEventListener('click', () => {
      renderCardsAppend(pageSize)
      if (shown >= visible.length) loadMoreBtn.disabled = true
    })
    if (shown >= visible.length) loadMoreBtn.disabled = true
    footer.appendChild(loadMoreBtn)
    list.appendChild(footer)
  })()

  return el
}
