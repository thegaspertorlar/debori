import { listPublicEvents } from '../api/mockApi'
import { resolveEventHeroImage } from '../eventHeroImage'
import { createLoadingCard, createErrorCard, createEmptyCard } from '../uiStates'
import { isAuthenticated } from '../session'

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
  el.className = 'page page--public events-page'
  el.innerHTML = `
    <div class="events-page__header container">
      <div class="events-page__title">
        <h1>Daxap's Events</h1>
        <p class="muted">Curated selection of upcoming and recent events — easy to browse and discover.</p>
      </div>
      <div class="events-page__actions">
        <div class="muted">Showing curated public events</div>
      </div>
    </div>
    <div class="container">
      <div id="events-list" class="events-page__list" aria-live="polite"></div>
    </div>
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
      // For guests we don't surface admin CTAs — offer login so they can sign in.
      const ctaText = isAuthenticated() ? 'View events' : 'Login'
      const ctaHref = isAuthenticated() ? '#/admin/events' : '#/login'
      list.appendChild(createEmptyCard('No upcoming events', 'There are no published events ending in the future right now. Check back later or explore other sections of the site.', ctaText, ctaHref))
      return
    }

    const gridWrap = document.createElement('div')
    // keep the grid constrained to the page container widths so cards align with page rhythm
    gridWrap.className = 'events-grid-wrap container'
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

        // media wrapper to allow overlay/gradient and precise crop control
        const mediaWrap = document.createElement('div')
        mediaWrap.className = 'event-card__media-wrap'

        const img = document.createElement('img')
        img.className = 'event-card__media'
        img.alt = ev.title || 'Event image'
        img.loading = 'lazy'
        img.src = resolveEventHeroImage(ev)
        mediaWrap.appendChild(img)

        // date badge overlay for stronger visual hierarchy
        const badge = document.createElement('div')
        badge.className = 'event-card__date-badge'
        if (ev.startDate) {
          const d = new Date(ev.startDate)
          const month = d.toLocaleString(undefined, { month: 'short' }).toUpperCase()
          const day = d.getDate()
          badge.innerHTML = `<div class="event-card__date-badge-month">${month}</div><div class="event-card__date-badge-day">${day}</div>`
        }
        mediaWrap.appendChild(badge)

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
        // provide a stable id so the card can reference it for accessible labelling
        title.id = `event-title-${ev.id}`
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

        // make the anchor announce itself as an article/card for assistive tech
        a.setAttribute('role', 'article')
        a.setAttribute('aria-labelledby', title.id)

        a.appendChild(mediaWrap)
        a.appendChild(body)

      grid.appendChild(a)
    })
    shown += slice.length
  }

    // initial render
    renderCardsAppend(pageSize)

    gridWrap.appendChild(grid)
    list.appendChild(gridWrap)

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
    // Give footer some breathing room so it reads as a composed page action
    const footerWrap = document.createElement('div')
    footerWrap.className = 'events-footer-wrap container'
    footerWrap.appendChild(footer)
    list.appendChild(footerWrap)
  })()

  return el
}
