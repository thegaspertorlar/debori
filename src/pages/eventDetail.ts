import { getEventById } from '../api/mockApi'
import { updateEvent } from '../api/mockApi'
import { resolveEventHeroImage } from '../eventHeroImage'
import { createLoadingCard, createErrorCard } from '../uiStates'
import { isAuthenticated } from '../session'
import { EventStatus, type Event } from '../models'

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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch] as string))
}

function statusLabel(status: EventStatus) {
  switch (status) {
    case EventStatus.Draft: return 'Draft'
    case EventStatus.Published: return 'Published'
    case EventStatus.Past: return 'Past'
    case EventStatus.Cancelled: return 'Cancelled'
    default: return String(status)
  }
}

function statusBadgeClass(status: EventStatus) {
  if (status === EventStatus.Draft) return 'badge badge--subtle'
  if (status === EventStatus.Published) return 'badge badge--success'
  if (status === EventStatus.Past) return 'badge badge--info'
  if (status === EventStatus.Cancelled) return 'badge badge--danger'
  return 'badge'
}

function formatCurrency(priceCents?: number | null, currency = 'USD') {
  if (typeof priceCents !== 'number') return 'Free'
  return (priceCents / 100).toLocaleString(undefined, { style: 'currency', currency })
}

function formatDateTime(value?: string) {
  if (!value) return 'TBA'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'TBA'
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })
}

function formatFullDateRange(start?: string, end?: string) {
  if (!start) return 'TBA'
  const s = new Date(start)
  if (Number.isNaN(s.getTime())) return 'TBA'
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }
  const startStr = s.toLocaleString(undefined, opts)
  if (!end) return startStr
  const e = new Date(end)
  if (Number.isNaN(e.getTime())) return startStr
  const sameDay = s.toDateString() === e.toDateString()
  if (sameDay) {
    const endTime = e.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${s.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })} — ${endTime}`
  }
  return `${startStr} — ${e.toLocaleString(undefined, opts)}`
}

function locationSummary(ev: Event) {
  if (ev.isOnline) return 'Online event'
  return addressLine(ev.location) || 'TBA'
}

function listHref(inAdmin: boolean) {
  return inAdmin ? '#/admin/events' : '#/events'
}

function editHref(inAdmin: boolean, id: string) {
  return inAdmin ? `#/admin/events/${id}/edit` : `#/events/${id}/edit`
}

function renderDetailStateHeader(title: string, subtitle: string, inAdmin: boolean) {
  const classes = ['page-title', 'page-title--detail']
  if (inAdmin) classes.push('page-title--detail--admin')
  return `
    <div class="${classes.join(' ')}">
      ${inAdmin ? '' : '<button type="button" class="btn btn--ghost" data-back-button aria-label="Back to events" title="Back to events">← <span>Back to events</span></button>'}
      <div>
        <h1>${escapeHtml(title)}</h1>
        <p class="muted">${escapeHtml(subtitle)}</p>
      </div>
    </div>
  `
}

function renderMetaItem(label: string, value: string) {
  return `
    <div class="event-admin-meta-item">
      <div class="muted">${escapeHtml(label)}</div>
      <div class="strong">${escapeHtml(value)}</div>
    </div>
  `
}

function renderPublicDetail(ev: Event, inAdmin: boolean) {
  const heroUrl = resolveEventHeroImage(ev)
  return `
    <div class="event-hero event-hero--public" style="background-image: url('${escapeHtml(heroUrl)}');">
      <div class="event-hero__backdrop" aria-hidden="true"></div>
      <div class="event-hero__inner">
        <div class="event-hero__back-nav">
          <button
            type="button"
            class="event-hero__back-button"
            data-back-button
            aria-label="Back to events"
            title="Back to events"
          >
            <span class="event-hero__back-button-icon" aria-hidden="true">←</span>
            <span class="event-hero__back-button-label">Back to events</span>
          </button>
        </div>
        <div class="event-hero__body">
          <div class="event-hero__content">
            <div class="event-hero__meta">
              <time class="event-hero__pill" datetime="${escapeHtml(ev.startDate || '')}">${escapeHtml(formatFullDateRange(ev.startDate, ev.endDate))}</time>
              <div class="event-hero__pill">${escapeHtml(locationSummary(ev))}</div>
            </div>
            <h1 class="event-hero__title">${escapeHtml(ev.title)}</h1>
            ${ev.shortDescription ? `<p class="event-hero__dek">${escapeHtml(ev.shortDescription)}</p>` : ''}
          </div>
          <div class="event-hero__side">
            <div class="event-hero__card">
              <div class="event-hero__card-meta">
                <div><strong>${escapeHtml(locationSummary(ev))}</strong></div>
                <div class="muted">${escapeHtml(formatFullDateRange(ev.startDate, ev.endDate))}</div>
              </div>
              <div class="event-hero__card-actions">
                <a class="btn btn--secondary" href="${listHref(inAdmin)}" data-link aria-label="Browse all events">Browse all events</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <main class="event-detail event-detail--public">
      <div class="event-detail__inner card">
        <div class="event-detail__main">
          <section class="event-summary">
            ${ev.shortDescription ? `<p class="event-summary__dek">${escapeHtml(ev.shortDescription)}</p>` : ''}
            <dl class="event-summary__meta">
              <dt class="muted">Date &amp; time</dt>
              <dd class="strong">${escapeHtml(formatFullDateRange(ev.startDate, ev.endDate))}</dd>
              <dt class="muted">Location</dt>
              <dd class="strong">${escapeHtml(locationSummary(ev))}</dd>
            </dl>
          </section>

          <section class="event-description prose">
            <h2 class="visually-hidden">Event description</h2>
            ${toProseHtml(ev.description)}
          </section>
        </div>

        <aside class="event-detail__aside card--compact">
          <div class="aside-section">
            <div class="muted">When</div>
            <div class="strong">${escapeHtml(formatFullDateRange(ev.startDate, ev.endDate))}</div>
          </div>

          <div class="aside-section">
            <div class="muted">Where</div>
            <div class="strong">${escapeHtml(locationSummary(ev))}</div>
          </div>

          ${ev.capacity ? `<div class="aside-section"><div class="muted">Capacity</div><div class="strong">${escapeHtml(String(ev.capacity))}</div></div>` : ''}
          ${typeof ev.priceCents === 'number' ? `<div class="aside-section"><div class="muted">Price</div><div class="strong">${escapeHtml(formatCurrency(ev.priceCents, ev.currency || 'USD'))}</div></div>` : ''}

          <div class="aside-note">
            <div class="muted">Planning to attend?</div>
            <p>Use the schedule and location details here to plan your visit, then explore more upcoming events.</p>
            <a class="nav-link" href="${listHref(inAdmin)}" data-link aria-label="Browse all events">Browse all events</a>
          </div>
        </aside>
      </div>
    </main>
  `
}

function renderAdminDetail(ev: Event, inAdmin: boolean) {
  const heroUrl = resolveEventHeroImage(ev)
  const canToggleStatus = ev.status === EventStatus.Draft || ev.status === EventStatus.Published
  const nextStatus = ev.status === EventStatus.Draft ? EventStatus.Published : EventStatus.Draft
  const toggleLabel = ev.status === EventStatus.Draft ? 'Publish event' : 'Move to draft'
  const toggleTone = ev.status === EventStatus.Draft ? 'btn btn--primary' : 'btn btn--secondary'
  const statusText = statusLabel(ev.status)
  return `
    <div class="event-detail event-detail--admin">
      <section class="event-admin-hero card">
        <div class="event-admin-hero__top">
          <div class="event-admin-hero__breadcrumbs">
            <a href="${listHref(inAdmin)}" data-link>Events</a>
            <span aria-hidden="true">/</span>
            <span>Event detail</span>
          </div>
          <span class="${statusBadgeClass(ev.status)}">${escapeHtml(statusText)}</span>
        </div>

        <div class="event-admin-hero__body">
          <div class="event-admin-hero__copy">
            <p class="event-admin-hero__eyebrow">Event management</p>
            <h1>${escapeHtml(ev.title)}</h1>
            ${ev.shortDescription ? `<p class="event-admin-hero__summary">${escapeHtml(ev.shortDescription)}</p>` : '<p class="event-admin-hero__summary muted">No short summary yet.</p>'}
          </div>

          <div class="event-admin-hero__visual">
            <div class="event-admin-hero__image" style="background-image: url('${escapeHtml(heroUrl)}');"></div>
            <div class="event-admin-hero__visual-copy">
              <div class="muted">${escapeHtml(formatFullDateRange(ev.startDate, ev.endDate))}</div>
              <div class="strong">${escapeHtml(locationSummary(ev))}</div>
            </div>
          </div>
        </div>

        <div class="event-admin-hero__actions">
          <a class="btn btn--primary" href="${editHref(inAdmin, ev.id)}" data-link>Edit event</a>
          ${canToggleStatus ? `<button type="button" class="${toggleTone}" data-admin-status-toggle data-next-status="${escapeHtml(nextStatus)}">${escapeHtml(toggleLabel)}</button>` : ''}
        </div>
      </section>

      <div class="event-admin-layout">
        <section class="event-admin-main">
          <article class="card event-admin-panel">
            <div class="event-admin-panel__header">
              <div>
                <p class="event-admin-panel__eyebrow">Overview</p>
                <h2>Key details</h2>
              </div>
            </div>
            <div class="event-admin-meta-grid">
              ${renderMetaItem('Status', statusText)}
              ${renderMetaItem('Date range', formatFullDateRange(ev.startDate, ev.endDate))}
              ${renderMetaItem('Location', locationSummary(ev))}
              ${renderMetaItem('Price', formatCurrency(ev.priceCents, ev.currency || 'USD'))}
              ${ev.capacity ? renderMetaItem('Capacity', String(ev.capacity)) : renderMetaItem('Capacity', 'Not set')}
              ${renderMetaItem('Updated', formatDateTime(ev.updatedAt))}
            </div>
          </article>

          <article class="card event-admin-panel">
            <div class="event-admin-panel__header">
              <div>
                <p class="event-admin-panel__eyebrow">Description</p>
                <h2>Event content</h2>
              </div>
            </div>
            <div class="prose event-admin-description">
              ${toProseHtml(ev.description || '<p class="muted">No description has been added yet.</p>')}
            </div>
          </article>
        </section>

        <aside class="card event-admin-sidebar card--compact">
          <section class="event-admin-sidebar__section">
            <p class="event-admin-sidebar__eyebrow">Quick actions</p>
            <div class="event-admin-sidebar__actions">
              <a class="btn btn--primary" href="${editHref(inAdmin, ev.id)}" data-link>Edit details</a>
              ${canToggleStatus ? `<button type="button" class="btn btn--secondary" data-admin-status-toggle data-next-status="${escapeHtml(nextStatus)}">${escapeHtml(toggleLabel)}</button>` : ''}
            </div>
          </section>

          <section class="event-admin-sidebar__section">
            <p class="event-admin-sidebar__eyebrow">Snapshot</p>
            <dl class="event-admin-sidebar__facts">
              <div>
                <dt>Schedule</dt>
                <dd>${escapeHtml(formatFullDateRange(ev.startDate, ev.endDate))}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>${escapeHtml(locationSummary(ev))}</dd>
              </div>
              <div>
                <dt>Slug</dt>
                <dd>${escapeHtml(ev.slug)}</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>${escapeHtml(ev.publishedAt ? formatDateTime(ev.publishedAt) : 'Not yet')}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  `
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
  const inAdmin = location.hash.replace(/^#/, '').startsWith('/admin')
  el.className = `page ${inAdmin ? 'page--admin-detail' : 'page--public'}`
  el.innerHTML = `
    <div id="detail-state-header">${renderDetailStateHeader(inAdmin ? 'Event details' : 'Event', inAdmin ? 'Loading event details…' : 'Loading…', inAdmin)}</div>
    <div id="event-detail"></div>
    <div id="detail-feedback" class="event-detail__feedback" aria-live="polite"></div>
  `

  const detailStateHeader = el.querySelector('#detail-state-header') as HTMLElement
  const container = el.querySelector('#event-detail') as HTMLElement
  const feedback = el.querySelector('#detail-feedback') as HTMLElement

  function renderLoadingState() {
    container.innerHTML = ''
    if (!inAdmin) {
      container.appendChild(createLoadingCard('Loading event'))
      return
    }
    const shell = document.createElement('div')
    shell.className = 'event-detail event-detail--admin'
    const state = document.createElement('div')
    state.className = 'event-admin-state'
    state.appendChild(createLoadingCard('Loading event'))
    shell.appendChild(state)
    container.appendChild(shell)
  }

  function renderErrorState(message?: string) {
    container.innerHTML = ''
    if (!inAdmin) {
      container.appendChild(createErrorCard('Unable to load event', message))
      return
    }
    detailStateHeader.innerHTML = renderDetailStateHeader('Event details', 'We could not load this event right now.', true)
    const shell = document.createElement('div')
    shell.className = 'event-detail event-detail--admin'
    const state = document.createElement('div')
    state.className = 'event-admin-state'
    state.appendChild(createErrorCard('Unable to load event', message))
    shell.appendChild(state)
    container.appendChild(shell)
  }

  function renderMissingState(message: string) {
    detailStateHeader.innerHTML = renderDetailStateHeader('Event not found', message, inAdmin)
    container.innerHTML = ''
    if (!inAdmin) {
      const eventsHref = listHref(false)
      container.innerHTML = `<div class="card"><p class="muted">${escapeHtml(message)}</p><p><a class="nav-link" href="${eventsHref}" data-link aria-label="Events">Events</a></p></div>`
      return
    }
    const shell = document.createElement('div')
    shell.className = 'event-detail event-detail--admin'
    shell.innerHTML = `<div class="event-admin-state"><div class="card"><p class="muted">${escapeHtml(message)}</p></div></div>`
    container.appendChild(shell)
  }

  renderLoadingState()

  let currentEvent: Event | null = null
  let detailFeedbackHtml = ''

  function attachBackHandler() {
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>('[data-back-button]'))
    if (!buttons.length) return
    buttons.forEach((button) => {
      if (button.dataset.backBound === 'true') return
      button.dataset.backBound = 'true'
      button.addEventListener('click', () => {
        try {
          if (history.length > 1) history.back()
          else {
            const inAdmin = location.hash.replace(/^#/, '').startsWith('/admin')
            location.hash = inAdmin ? '#/admin/events' : '#/events'
          }
        } catch (e) {
          const inAdmin = location.hash.replace(/^#/, '').startsWith('/admin')
          location.hash = inAdmin ? '#/admin/events' : '#/events'
        }
      })
    })
  }

  async function setStatus(nextStatus: EventStatus) {
    if (!currentEvent) return
    const res = await updateEvent(currentEvent.id, { status: nextStatus })
    if (!res.ok) {
      detailFeedbackHtml = `<div class="notice notice--error card--compact"><strong>Action failed.</strong> <span>${escapeHtml(res.message || 'We could not update this event right now.')}</span></div>`
      await loadEvent()
      return
    }
    detailFeedbackHtml = `<div class="notice notice--success card--compact"><strong>Updated.</strong> <span>The event status has been changed.</span></div>`
    await loadEvent()
  }

  function bindAdminActions() {
    const toggles = Array.from(el.querySelectorAll<HTMLButtonElement>('[data-admin-status-toggle]'))
    toggles.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const nextStatus = btn.getAttribute('data-next-status') as EventStatus | null
        if (!nextStatus) return
        btn.disabled = true
        try {
          await setStatus(nextStatus)
        } finally {
          btn.disabled = false
        }
      })
    })
  }

  async function loadEvent() {
    renderLoadingState()
    feedback.innerHTML = ''
    const res = await getEventById(id)
    if (!res.ok) {
      if ((res.message || '').toLowerCase().includes('not found')) {
        renderMissingState(res.message || 'We could not find that event.')
        attachBackHandler()
        return
      }
      renderErrorState(res.message)
      return
    }

    currentEvent = res.data
    if (inAdmin) {
      detailStateHeader.innerHTML = ''
      const adminContainer = document.createElement('div')
      adminContainer.innerHTML = renderAdminDetail(res.data, inAdmin)
      container.innerHTML = ''
      container.appendChild(adminContainer.firstElementChild as HTMLElement)
      feedback.innerHTML = detailFeedbackHtml
      bindAdminActions()
    } else {
      detailStateHeader.innerHTML = ''
      container.innerHTML = renderPublicDetail(res.data, inAdmin)
    }

    attachBackHandler()
  }

  // attach to initial loading UI
  attachBackHandler()

  loadEvent()

  return el
}
