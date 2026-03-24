import { getEventById } from '../api/mockApi'
import { createLoadingCard, createErrorCard } from '../uiStates'
import { isAuthenticated } from '../session'

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
      <button type="button" class="btn btn--ghost" id="back-btn" aria-label="Go back" title="Go back">←</button>
      <h1>Event</h1>
      <p class="muted">Loading…</p>
    </div>
    <div id="event-detail"></div>
  `

  const container = el.querySelector('#event-detail') as HTMLElement
  container.appendChild(createLoadingCard('Loading event'))

  function attachBackHandler() {
    const b = el.querySelector('#back-btn') as HTMLButtonElement | null
    if (!b) return
    b.addEventListener('click', () => {
      try {
        if (history.length > 1) history.back()
        else location.hash = '#/events'
      } catch (e) { location.hash = '#/events' }
    })
  }

  // attach to initial loading UI
  attachBackHandler()

  ;(async () => {
    // show a calm loading card while we fetch
    container.innerHTML = ''
    container.appendChild(createLoadingCard('Loading event'))
    const res = await getEventById(id)
    if (!res.ok) {
      // Distinguish not-found vs other errors
      if ((res.message || '').toLowerCase().includes('not found')) {
        el.innerHTML = `
          <div class="page-title"><button type="button" class="btn btn--ghost" id="back-btn" aria-label="Go back" title="Go back">←</button><h1>Event not found</h1></div>
          <div class="card"><p class="muted">${res.message || 'We could not find that event.'}</p><p><a class="btn" href="#/events">Back to events</a></p></div>
        `
        attachBackHandler()
        return
      }
      container.innerHTML = ''
      container.appendChild(createErrorCard('Unable to load event', res.message))
      return
    }

    const ev = res.data

    // Build a more editorial event detail layout
    const heroUrl = ev.heroImage || `https://picsum.photos/seed/${encodeURIComponent(ev.id)}/1400/560`

    const showAdminControls = isAuthenticated()

    el.innerHTML = `
      <div class="event-hero" style="background-image: url('${heroUrl}');">
        <!-- subtle gradient & vignette for readable but not heavy overlay -->
        <div class="event-hero__backdrop" aria-hidden="true"></div>
        <div class="event-hero__inner">
          <button type="button" class="btn btn--ghost" id="back-btn" aria-label="Go back" title="Go back" style="margin-bottom:12px;">←</button>
          <div class="event-hero__content">
            <div class="event-hero__meta">
              <time class="event-hero__pill" datetime="${ev.startDate}">${formatDateRange(ev.startDate, ev.endDate)}</time>
              <div class="event-hero__pill">${ev.isOnline ? 'Online' : (ev.location?.city || addressLine(ev.location) || 'TBA')}</div>
            </div>
            <h1 class="event-hero__title">${ev.title}</h1>
            ${ev.shortDescription ? `<p class="event-hero__dek">${ev.shortDescription}</p>` : ''}
          </div>
          <div class="event-hero__side">
            <div class="event-hero__card">
              <div class="event-hero__card-meta">
                <div><strong>${ev.isOnline ? 'Online' : addressLine(ev.location) || 'TBA'}</strong></div>
                <div class="muted">${formatDateRange(ev.startDate, ev.endDate)}</div>
              </div>
               <div class="event-hero__card-actions">
                 <a class="btn btn--primary" href="#/events">Back to events</a>
                 ${showAdminControls ? `<a class="btn btn--outline" href="#/events/${ev.id}/edit">Edit</a>` : ``}
               </div>
            </div>
          </div>
        </div>
      </div>

      <main class="event-detail">
        <div class="event-detail__inner card">
          <div class="event-detail__main">
            <section class="event-summary">
              ${ev.shortDescription ? `<p class="event-summary__dek">${ev.shortDescription}</p>` : ''}
              <div class="event-summary__meta">
                <div class="muted">Date & time</div>
                <div class="strong">${formatDateRange(ev.startDate, ev.endDate)}</div>
                <div class="spacer--sm"></div>
                <div class="muted">Location</div>
                <div class="strong">${ev.isOnline ? 'Online' : addressLine(ev.location) || 'TBA'}</div>
              </div>
            </section>

            <section class="event-description prose">
              <h2 class="visually-hidden">Event description</h2>
              ${toProseHtml(ev.description)}
            </section>

            
          </div>

          <aside class="event-detail__aside card--compact">
            <div class="aside-section">
              <div class="muted">When</div>
              <div class="strong">${formatDateRange(ev.startDate, ev.endDate)}</div>
            </div>

            <div class="aside-section">
              <div class="muted">Where</div>
              <div class="strong">${ev.isOnline ? 'Online' : addressLine(ev.location) || 'TBA'}</div>
            </div>

            ${ev.capacity ? `<div class="aside-section"><div class="muted">Capacity</div><div class="strong">${ev.capacity}</div></div>` : ''}

            ${typeof ev.priceCents === 'number' ? `<div class="aside-section"><div class="muted">Price</div><div class="strong">${(ev.priceCents / 100).toLocaleString(undefined, { style: 'currency', currency: ev.currency || 'USD' })}</div></div>` : ''}

            <div class="aside-actions">
              <a class="btn btn--primary" href="#/events">Back to events</a>
              ${showAdminControls ? `<a class="btn btn--outline" href="#/events/${ev.id}/edit">Edit</a>` : ``}
            </div>
          </aside>
        </div>
      </main>
    `

    // attach back handler for the rendered detail view
    attachBackHandler()
  })()

  return el
}
