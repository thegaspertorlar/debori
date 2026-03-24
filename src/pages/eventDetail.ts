import { getEventById } from '../api/mockApi'
import { createLoadingCard, createErrorCard } from '../uiStates'

function formatDateRange(start?: string, end?: string) {
  if (!start) return ''
  const s = new Date(start)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }
  const startStr = s.toLocaleString(undefined, opts)
  if (!end) return startStr
  const e = new Date(end)
  const sameDay = s.toDateString() === e.toDateString()
  if (sameDay) {
    const endTime = e.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${s.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })} — ${endTime}`
  }
  const endStr = e.toLocaleString(undefined, opts)
  return `${startStr} — ${endStr}`
}

function addressLine(loc?: any) {
  if (!loc) return ''
  const parts = [loc.address, loc.city, loc.state, loc.postalCode].filter(Boolean)
  return parts.join(', ')
}

function toProseHtml(text?: string) {
  if (!text) return ''
  // Convert plain text to simple HTML paragraphs preserving line breaks.
  // If text already contains HTML tags, assume it's intended HTML and return as-is.
  if (/<[a-z][\s\S]*>/i.test(text)) return text
  const paras = text.split(/\n\n+/).map((p) => p.replace(/\n/g, '<br/>'))
  return paras.map((p) => `<p>${p}</p>`).join('\n')
}

export function renderEventDetail(params: Record<string, string>) {
  const id = params.id
  const el = document.createElement('div')
  el.className = 'page page--public'
  el.innerHTML = `
    <div class="page-title">
      <h1>Event</h1>
      <p class="muted">Loading…</p>
    </div>
    <div id="event-detail"></div>
  `

  const container = el.querySelector('#event-detail') as HTMLElement
  container.appendChild(createLoadingCard('Loading event'))

  ;(async () => {
    // show a calm loading card while we fetch
    container.innerHTML = ''
    container.appendChild(createLoadingCard('Loading event'))
    const res = await getEventById(id)
    if (!res.ok) {
      // Distinguish not-found vs other errors
      if ((res.message || '').toLowerCase().includes('not found')) {
        el.innerHTML = `
          <div class="page-title"><h1>Event not found</h1></div>
          <div class="card"><p class="muted">${res.message || 'We could not find that event.'}</p><p><a class="btn" href="#/events">Back to events</a></p></div>
        `
        return
      }
      container.innerHTML = ''
      container.appendChild(createErrorCard('Unable to load event', res.message))
      return
    }

    const ev = res.data

    // Build a more editorial event detail layout
    const heroUrl = ev.heroImage || `https://picsum.photos/seed/${encodeURIComponent(ev.id)}/1400/560`

    el.innerHTML = `
      <div class="event-hero" style="background-image: url('${heroUrl}');">
        <div class="event-hero__overlay">
          <div class="event-hero__inner">
            <div class="event-hero__meta">
              <div class="event-hero__date">${formatDateRange(ev.startDate, ev.endDate)}</div>
              <div class="event-hero__place">${ev.isOnline ? 'Online' : (ev.location?.city || addressLine(ev.location) || '')}</div>
            </div>
            <h1 class="event-hero__title">${ev.title}</h1>
            ${ev.shortDescription ? `<p class="event-hero__dek">${ev.shortDescription}</p>` : ''}
          </div>
        </div>
      </div>

      <main class="event-detail">
        <div class="event-detail__inner card">
          <div class="event-detail__content prose">${toProseHtml(ev.description)}</div>
          <aside class="event-detail__aside">
            <div class="muted">When</div>
            <div class="strong">${formatDateRange(ev.startDate, ev.endDate)}</div>
            <div style="height:12px"></div>
            <div class="muted">Where</div>
            <div class="strong">${ev.isOnline ? 'Online' : addressLine(ev.location) || 'TBA'}</div>
            ${ev.capacity ? `<div style="height:12px"></div><div class="muted">Capacity</div><div class="strong">${ev.capacity}</div>` : ''}
            ${typeof ev.priceCents === 'number' ? `<div style="height:12px"></div><div class="muted">Price</div><div class="strong">${(ev.priceCents / 100).toLocaleString(undefined, { style: 'currency', currency: ev.currency || 'USD' })}</div>` : ''}
            <div style="height:16px"></div>
            <div style="display:flex; gap:8px; flex-wrap:wrap"><a class="btn btn--primary" href="#/events">Back to events</a><a class="btn btn--outline" href="#/events/${ev.id}/edit">Edit</a></div>
          </aside>
        </div>
      </main>
    `
  })()

  return el
}
