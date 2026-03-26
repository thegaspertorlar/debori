import { listPublicEvents } from '../api/mockApi'
import { resolveEventHeroImage } from '../eventHeroImage'
import type { Event } from '../models'
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

function getEventLocationText(event: Event) {
  if (event.isOnline) return 'Online'
  return [
    event.location?.address,
    event.location?.city,
    event.location?.state,
    event.location?.postalCode,
    event.location?.country,
  ].filter(Boolean).join(', ')
}

function getEventSearchText(event: Event) {
  return `${event.title || ''} ${getEventLocationText(event)}`.trim().toLowerCase()
}

function createEventCard(event: Event) {
  const a = document.createElement('a')
  a.className = 'event-card'
  a.href = `#/events/${event.id}`
  a.setAttribute('data-link', '')

  const mediaWrap = document.createElement('div')
  mediaWrap.className = 'event-card__media-wrap'

  const img = document.createElement('img')
  img.className = 'event-card__media'
  img.alt = event.title || 'Event image'
  img.loading = 'lazy'
  img.src = resolveEventHeroImage(event)
  mediaWrap.appendChild(img)

  const badge = document.createElement('div')
  badge.className = 'event-card__date-badge'
  if (event.startDate) {
    const d = new Date(event.startDate)
    const month = d.toLocaleString(undefined, { month: 'short' }).toUpperCase()
    const day = d.getDate()
    badge.innerHTML = `<div class="event-card__date-badge-month">${month}</div><div class="event-card__date-badge-day">${day}</div>`
  }
  mediaWrap.appendChild(badge)

  const body = document.createElement('div')
  body.className = 'event-card__body'

  const header = document.createElement('div')
  header.className = 'event-card__header'

  const left = document.createElement('div')
  left.className = 'flex-1'

  const dateSpan = document.createElement('div')
  dateSpan.className = 'event-card__date'
  dateSpan.textContent = formatDateRange(event.startDate, event.endDate)

  const title = document.createElement('h3')
  title.id = `event-title-${event.id}`
  title.className = 'event-card__title'
  title.textContent = event.title || 'Untitled event'

  left.appendChild(dateSpan)
  left.appendChild(title)
  header.appendChild(left)
  body.appendChild(header)

  if (event.shortDescription) {
    const desc = document.createElement('div')
    desc.className = 'event-card__dek'
    desc.textContent = event.shortDescription
    body.appendChild(desc)
  }

  const meta = document.createElement('div')
  meta.className = 'event-card__meta'
  const addr = document.createElement('div')
  addr.className = 'event-card__location'
  addr.textContent = getEventLocationText(event)
  meta.appendChild(addr)
  body.appendChild(meta)

  a.setAttribute('role', 'article')
  a.setAttribute('aria-labelledby', title.id)
  a.appendChild(mediaWrap)
  a.appendChild(body)

  return a
}

function createNoResultsState(query: string, onClear: () => void) {
  const card = document.createElement('div')
  card.className = 'card card--empty events-page__state'
  card.setAttribute('role', 'status')

  const stateRow = document.createElement('div')
  stateRow.className = 'state-row'

  const iconWrap = document.createElement('div')
  iconWrap.className = 'state__icon'
  iconWrap.setAttribute('aria-hidden', 'true')
  iconWrap.innerHTML = `
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="state__svg">
      <rect x="3" y="3" width="18" height="18" rx="3" fill="rgba(15,23,42,0.03)" />
      <path d="M8 12h8" stroke="#94a3b8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M8 16h8" stroke="#94a3b8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `

  const content = document.createElement('div')
  content.className = 'state__content'

  const title = document.createElement('h3')
  title.className = 'state__title'
  title.textContent = 'No matching events'

  const message = document.createElement('p')
  message.className = 'muted state__message'
  message.textContent = `We couldn’t find any published events matching “${query}”. Try a different title or address.`

  content.appendChild(title)
  content.appendChild(message)
  stateRow.appendChild(iconWrap)
  stateRow.appendChild(content)
  card.appendChild(stateRow)
  card.classList.add('events-page__state')

  const actions = document.createElement('div')
  actions.className = 'mt-3'

  const clearButton = document.createElement('button')
  clearButton.type = 'button'
  clearButton.className = 'btn btn--primary'
  clearButton.textContent = 'Clear search'
  clearButton.addEventListener('click', onClear)

  actions.appendChild(clearButton)
  card.appendChild(actions)

  return card
}

export function renderEventsList() {
  const el = document.createElement('div')
  el.className = 'page page--public events-page'
  el.innerHTML = `
    <div class="events-page__header container">
      <div class="events-page__title">
        <h1>Events</h1>
        <p class="muted">Curated selection of upcoming and recent events — easy to browse and discover.</p>
      </div>
      <div class="events-page__actions events-page__actions--public">
        <label class="visually-hidden" for="events-search-input">Search events by title or address</label>
        <div class="events-page__search">
          <input id="events-search-input" class="input events-page__search-input" type="search" placeholder="Search by title or address" autocomplete="off" aria-controls="events-list" data-testid="events-search" />
          <button type="button" class="btn btn--ghost btn--sm events-page__search-clear" data-testid="events-search-clear" hidden disabled>Clear</button>
        </div>
        <div class="muted events-page__summary" data-testid="events-search-summary">Showing curated public events</div>
      </div>
    </div>
    <div class="container">
      <div id="events-list" class="events-page__list" data-testid="event-list" aria-live="polite"></div>
    </div>
  `

  const list = el.querySelector('#events-list') as HTMLElement
  const searchInput = el.querySelector('#events-search-input') as HTMLInputElement
  const clearButton = el.querySelector('[data-testid="events-search-clear"]') as HTMLButtonElement
  const summary = el.querySelector('[data-testid="events-search-summary"]') as HTMLElement
  // initial loading state
  list.appendChild(createLoadingCard('Loading events'))

  function syncClearButton() {
    const hasQuery = searchInput.value.trim().length > 0
    clearButton.hidden = !hasQuery
    clearButton.disabled = !hasQuery
  }

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
    const pageSize = 12
    let shown = pageSize

    function renderList() {
      const rawQuery = searchInput.value.trim()
      const query = rawQuery.toLowerCase()
      const filtered = query
        ? visible.filter((event) => getEventSearchText(event).includes(query))
        : visible
      const renderedCount = Math.min(shown, filtered.length)

      syncClearButton()
      list.innerHTML = ''

      if (!visible.length) {
        summary.textContent = 'No published events available'
        const ctaText = isAuthenticated() ? 'View events' : 'Login'
        const ctaHref = isAuthenticated() ? '#/admin/events' : '#/login'
        list.appendChild(createEmptyCard('No upcoming events', 'There are no published events ending in the future right now. Check back later or explore other sections of the site.', ctaText, ctaHref))
        return
      }

      if (query && !filtered.length) {
        summary.textContent = `No matches for “${rawQuery}”`
        list.appendChild(createNoResultsState(rawQuery, () => {
          searchInput.value = ''
          shown = pageSize
          renderList()
          searchInput.focus()
        }))
        return
      }

      summary.textContent = query
        ? `Showing ${renderedCount} of ${filtered.length} matching events`
        : `Showing ${renderedCount} of ${visible.length} published events`

      const gridWrap = document.createElement('div')
      gridWrap.className = 'events-grid-wrap container'
      const grid = document.createElement('div')
      grid.className = 'events-grid'

      filtered.slice(0, renderedCount).forEach((event) => {
        grid.appendChild(createEventCard(event))
      })

      gridWrap.appendChild(grid)
      list.appendChild(gridWrap)

      if (renderedCount < filtered.length) {
        const footer = document.createElement('div')
        footer.className = 'events-footer'

        const loadMoreBtn = document.createElement('button')
        loadMoreBtn.className = 'btn btn--primary'
        loadMoreBtn.textContent = 'Load more'
        loadMoreBtn.type = 'button'
        loadMoreBtn.addEventListener('click', () => {
          shown += pageSize
          renderList()
        })

        footer.appendChild(loadMoreBtn)

        const footerWrap = document.createElement('div')
        footerWrap.className = 'events-footer-wrap container'
        footerWrap.appendChild(footer)
        list.appendChild(footerWrap)
      }
    }

    searchInput.addEventListener('input', () => {
      shown = pageSize
      renderList()
    })

    clearButton.addEventListener('click', () => {
      searchInput.value = ''
      shown = pageSize
      renderList()
      searchInput.focus()
    })

    renderList()
  })()

  return el
}
