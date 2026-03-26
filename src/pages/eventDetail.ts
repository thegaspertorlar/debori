import { getEventById, updateEvent } from '../api/mockApi'
import { resolveEventHeroImage } from '../eventHeroImage'
import { createLoadingCard, createErrorCard } from '../uiStates'
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

function renderMetaItem(label: string, value: string, hint?: string) {
  return `
    <div class="event-admin-meta-item">
      <div class="muted">${escapeHtml(label)}</div>
      <div class="strong">${escapeHtml(value)}</div>
      ${hint ? `<div class="event-admin-meta-hint">${escapeHtml(hint)}</div>` : ''}
    </div>
  `
}

function previewHref(id: string) {
  return `#/events/${id}`
}

function formatDateOnly(value?: string) {
  if (!value) return 'TBA'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'TBA'
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatTimeOnly(value?: string) {
  if (!value) return 'TBA'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'TBA'
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })
}

function eventPhaseSummary(ev: Event) {
  if (ev.status === EventStatus.Cancelled) {
    return {
      label: 'Cancelled',
      detail: 'This listing is paused and should be reviewed before sharing again.',
    }
  }

  const now = new Date()
  const start = ev.startDate ? new Date(ev.startDate) : null
  const end = ev.endDate ? new Date(ev.endDate) : null

  if (!start || Number.isNaN(start.getTime())) {
    return {
      label: 'Schedule TBD',
      detail: 'Add a confirmed start time to complete the attendee-facing schedule.',
    }
  }

  if (end && !Number.isNaN(end.getTime()) && end.getTime() < now.getTime()) {
    return {
      label: 'Completed',
      detail: `Ended ${formatDateOnly(ev.endDate)}`,
    }
  }

  if (start.toDateString() === now.toDateString()) {
    return {
      label: 'Happening today',
      detail: `Live window ${formatTimeOnly(ev.startDate)} — ${formatTimeOnly(ev.endDate)}`,
    }
  }

  if (start.getTime() > now.getTime()) {
    return {
      label: 'Upcoming',
      detail: `Starts ${formatDateTime(ev.startDate)}`,
    }
  }

  return {
    label: 'In progress',
    detail: `Currently running until ${formatTimeOnly(ev.endDate)}`,
  }
}

function audienceSummary(ev: Event) {
  if (!ev.capacity) return ev.isOnline ? 'Flexible online attendance' : 'Capacity not set yet'
  if (ev.capacity <= 25) return 'Small-format session'
  if (ev.capacity <= 120) return 'Limited-capacity event'
  if (ev.capacity <= 500) return 'Mid-size audience'
  return 'Large-scale attendance'
}

function formatEventDay(value?: string) {
  if (!value) return 'Date to be announced'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date to be announced'
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTimeWindow(start?: string, end?: string) {
  if (!start) return 'Time to be announced'
  const s = new Date(start)
  if (Number.isNaN(s.getTime())) return 'Time to be announced'
  const startTime = s.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })
  if (!end) return startTime
  const e = new Date(end)
  if (Number.isNaN(e.getTime())) return startTime
  return `${startTime} — ${e.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })}`
}

function formatDuration(start?: string, end?: string) {
  if (!start || !end) return 'Schedule shared on the page'
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 'Schedule shared on the page'
  const totalMinutes = Math.max(0, Math.round((e.getTime() - s.getTime()) / 60000))
  if (!totalMinutes) return 'Schedule shared on the page'
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours && minutes) return `${hours}h ${minutes}m`
  if (hours) return `${hours}h`
  return `${minutes}m`
}

function publicPriceHeadline(priceCents?: number | null, currency = 'USD') {
  if (typeof priceCents !== 'number') return 'Pricing details soon'
  if (priceCents <= 0) return 'Free to attend'
  return formatCurrency(priceCents, currency)
}

function publicPriceDetail(priceCents?: number | null) {
  if (typeof priceCents !== 'number') return 'Check back for final ticket information from the organizer.'
  if (priceCents <= 0) return 'No ticket cost listed for this event.'
  return 'Per attendee ticket pricing is listed for this event.'
}

function publicCapacityHeadline(ev: Event) {
  if (!ev.capacity) return ev.isOnline ? 'Flexible attendance' : 'Capacity to be confirmed'
  return `${ev.capacity} guest${ev.capacity === 1 ? '' : 's'} max`
}

function publicCapacityDetail(ev: Event) {
  if (!ev.capacity) return ev.isOnline ? 'Online access makes attendance more flexible.' : 'The organizer has not shared a guest limit yet.'
  return `${audienceSummary(ev)} with room for up to ${ev.capacity} attendees.`
}

function renderPublicHeroStat(label: string, value: string, detail: string) {
  return `
    <div class="event-hero__stat-card">
      <span class="event-hero__stat-label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <span class="event-hero__stat-detail">${escapeHtml(detail)}</span>
    </div>
  `
}

function renderPublicInfoTile(label: string, value: string, detail: string) {
  return `
    <div class="event-public-info-tile">
      <span class="event-public-info-tile__label">${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(detail)}</p>
    </div>
  `
}

function renderPublicSidebarFact(label: string, value: string) {
  return `
    <div class="event-sidebar-card__fact">
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(value)}</dd>
    </div>
  `
}

function renderPublicTipItem(text: string) {
  return `
    <li class="event-sidebar-card__tip-item">
      <span class="event-sidebar-card__tip-bullet" aria-hidden="true"></span>
      <span>${escapeHtml(text)}</span>
    </li>
  `
}

function publishingSummary(ev: Event) {
  if (ev.status === EventStatus.Draft) return 'Not visible on the public events feed yet.'
  if (ev.status === EventStatus.Published) return 'Visible to attendees and linked from the events directory.'
  if (ev.status === EventStatus.Past) return 'Kept for historical reference and recap.'
  if (ev.status === EventStatus.Cancelled) return 'Removed from active promotion while details are resolved.'
  return 'Status needs review.'
}

function renderInfoCard(title: string, value: string, detail: string, tone: 'brand' | 'neutral' = 'neutral') {
  return `
    <div class="event-admin-info-card event-admin-info-card--${tone}">
      <div class="event-admin-info-card__label">${escapeHtml(title)}</div>
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(detail)}</span>
    </div>
  `
}

function renderReadinessItem(label: string, ok: boolean, detail: string) {
  return `
    <li class="event-admin-checklist__item ${ok ? 'is-ready' : 'is-pending'}">
      <span class="event-admin-checklist__icon" aria-hidden="true">${ok ? '✓' : '!'}</span>
      <div>
        <strong>${escapeHtml(label)}</strong>
        <p>${escapeHtml(detail)}</p>
      </div>
    </li>
  `
}

function renderPublicDetail(ev: Event, inAdmin: boolean) {
  const heroUrl = resolveEventHeroImage(ev)
  const phase = eventPhaseSummary(ev)
  const scheduleText = formatFullDateRange(ev.startDate, ev.endDate)
  const locationText = locationSummary(ev)
  const priceHeadline = publicPriceHeadline(ev.priceCents, ev.currency || 'USD')
  const capacityHeadline = publicCapacityHeadline(ev)
  const timeWindow = formatTimeWindow(ev.startDate, ev.endDate)
  const duration = formatDuration(ev.startDate, ev.endDate)
  const eventMode = ev.isOnline ? 'Online experience' : 'In-person gathering'
  const locationDetail = ev.isOnline
    ? 'Join remotely from wherever you are most comfortable.'
    : (addressLine(ev.location) || 'Venue details will be shared on this page.')
  const tips = [
    ev.isOnline
      ? 'Join a few minutes early so you can settle in and check your setup.'
      : 'Plan to arrive a little early so check-in and seating feel easy.',
    typeof ev.priceCents !== 'number'
      ? 'Ticket details may still be getting finalized by the organizer.'
      : ev.priceCents <= 0
        ? 'This event is listed as free, making it easy to invite a friend.'
        : `Tickets are listed at ${formatCurrency(ev.priceCents, ev.currency || 'USD')} per attendee.`,
    ev.capacity
      ? `Capacity is set for up to ${ev.capacity} guests, so planning ahead is a smart move.`
      : ev.isOnline
        ? 'Attendance is flexible, which is great for a relaxed online drop-in experience.'
        : 'Capacity has not been shared yet, so keep an eye on updates from the organizer.',
  ]
  const heroTags = ev.tags?.length
    ? `<div class="event-hero__tag-row">${ev.tags.map((tag) => `<span class="event-hero__tag">${escapeHtml(tag)}</span>`).join('')}</div>`
    : ''
  const detailTags = ev.tags?.length
    ? `
      <div class="event-public-tag-block">
        <span class="event-public-tag-block__label">Discoverability</span>
        <div class="event-public-tag-block__row">${ev.tags.map((tag) => `<span class="event-public-tag">${escapeHtml(tag)}</span>`).join('')}</div>
      </div>
    `
    : ''

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
              <span class="event-hero__pill event-hero__pill--status">${escapeHtml(phase.label)}</span>
              <time class="event-hero__pill" datetime="${escapeHtml(ev.startDate || '')}">${escapeHtml(formatEventDay(ev.startDate))}</time>
              <div class="event-hero__pill">${escapeHtml(eventMode)}</div>
            </div>
            <h1 class="event-hero__title">${escapeHtml(ev.title)}</h1>
            ${ev.shortDescription ? `<p class="event-hero__dek">${escapeHtml(ev.shortDescription)}</p>` : ''}
            <div class="event-hero__stats-grid">
              ${renderPublicHeroStat('Starts', formatEventDay(ev.startDate), timeWindow)}
              ${renderPublicHeroStat('Location', locationText, locationDetail)}
              ${renderPublicHeroStat('Tickets', priceHeadline, publicPriceDetail(ev.priceCents))}
              ${renderPublicHeroStat('Attendance', capacityHeadline, publicCapacityDetail(ev))}
            </div>
            ${heroTags}
          </div>
          <div class="event-hero__side">
            <div class="event-hero__card">
              <div class="event-hero__card-top">
                <div>
                  <span class="event-hero__card-kicker">Plan your visit</span>
                  <strong class="event-hero__card-title">Everything you need at a glance</strong>
                </div>
                <span class="${statusBadgeClass(ev.status)}">${escapeHtml(statusLabel(ev.status))}</span>
              </div>
              <div class="event-hero__card-stack">
                <div class="event-hero__card-item">
                  <span class="event-hero__card-item-label">When</span>
                  <strong>${escapeHtml(scheduleText)}</strong>
                </div>
                <div class="event-hero__card-item">
                  <span class="event-hero__card-item-label">Where</span>
                  <strong>${escapeHtml(locationText)}</strong>
                </div>
                <div class="event-hero__card-item event-hero__card-item--split">
                  <div>
                    <span class="event-hero__card-item-label">Price</span>
                    <strong>${escapeHtml(priceHeadline)}</strong>
                  </div>
                  <div>
                    <span class="event-hero__card-item-label">Duration</span>
                    <strong>${escapeHtml(duration)}</strong>
                  </div>
                </div>
              </div>
              <p class="event-hero__card-note">${escapeHtml(tips[0])}</p>
              <div class="event-hero__card-actions">
                <a class="btn btn--primary" href="${listHref(inAdmin)}" data-link aria-label="Browse all events">Browse all events</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <main class="event-detail event-detail--public">
      <div class="event-detail__inner">
        <div class="event-detail__main">
          <section class="event-public-section event-public-section--story" id="event-details">
            <div class="event-public-section__header">
              <div>
                <p class="event-public-section__eyebrow">About this event</p>
                <h2>Friendly details, without the clutter</h2>
                <p class="event-public-section__sub">Get the full picture quickly, then dive deeper into the event story and planning notes.</p>
              </div>
            </div>
            <div class="prose event-public-story__prose">
              ${toProseHtml(ev.description)}
            </div>
            ${detailTags}
          </section>

          <section class="event-public-section">
            <div class="event-public-section__header">
              <div>
                <p class="event-public-section__eyebrow">Plan ahead</p>
                <h2>Everything that matters before you go</h2>
                <p class="event-public-section__sub">A clear, modern summary so attendees can make quick decisions with confidence.</p>
              </div>
            </div>
            <div class="event-public-info-grid">
              ${renderPublicInfoTile('Date & time', scheduleText, `${formatEventDay(ev.startDate)} · ${timeWindow}`)}
              ${renderPublicInfoTile('Location', locationText, locationDetail)}
              ${renderPublicInfoTile('Tickets', priceHeadline, publicPriceDetail(ev.priceCents))}
              ${renderPublicInfoTile('Attendance', capacityHeadline, publicCapacityDetail(ev))}
            </div>
          </section>
        </div>

        <aside class="event-detail__aside">
          <section class="event-sidebar-card event-sidebar-card--primary">
            <div class="event-sidebar-card__header">
              <p class="event-public-section__eyebrow">Quick facts</p>
              <h3>Event snapshot</h3>
            </div>
            <dl class="event-sidebar-card__facts">
              ${renderPublicSidebarFact('Status', statusLabel(ev.status))}
              ${renderPublicSidebarFact('Day', formatEventDay(ev.startDate))}
              ${renderPublicSidebarFact('Time', timeWindow)}
              ${renderPublicSidebarFact('Location', locationText)}
              ${renderPublicSidebarFact('Price', priceHeadline)}
              ${renderPublicSidebarFact('Capacity', capacityHeadline)}
            </dl>
          </section>

          <section class="event-sidebar-card">
            <div class="event-sidebar-card__header">
              <p class="event-public-section__eyebrow">Helpful tips</p>
              <h3>Make the most of it</h3>
            </div>
            <ul class="event-sidebar-card__tips">
              ${tips.map(renderPublicTipItem).join('')}
            </ul>
          </section>

          <section class="event-sidebar-card event-sidebar-card--accent">
            <div class="event-sidebar-card__header">
              <p class="event-public-section__eyebrow">Keep exploring</p>
              <h3>More events are one click away</h3>
            </div>
            <p class="event-sidebar-card__copy">If this one is not the perfect fit, the full events list makes it easy to discover what is coming up next.</p>
            <a class="btn btn--secondary" href="${listHref(inAdmin)}" data-link aria-label="Browse all events">Browse all events</a>
          </section>
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
  const phase = eventPhaseSummary(ev)
  const locationText = locationSummary(ev)
  const scheduleText = formatFullDateRange(ev.startDate, ev.endDate)
  const priceText = formatCurrency(ev.priceCents, ev.currency || 'USD')
  const capacityText = ev.capacity ? `${ev.capacity} guests max` : 'Capacity open'
  const publishedText = ev.publishedAt ? formatDateTime(ev.publishedAt) : 'Not yet published'
  const tags = ev.tags?.length
    ? ev.tags.map((tag) => `<span class="event-admin-tag">${escapeHtml(tag)}</span>`).join('')
    : '<span class="event-admin-tag event-admin-tag--muted">No tags added</span>'
  const checklist = [
    renderReadinessItem('Scheduling is set', Boolean(ev.startDate), ev.startDate ? scheduleText : 'Choose a start and end time for this event.'),
    renderReadinessItem('Venue details are present', Boolean(ev.isOnline || addressLine(ev.location)), ev.isOnline ? 'Marked as an online event.' : (addressLine(ev.location) || 'Add a venue or mark the event as online.')),
    renderReadinessItem('Event copy is filled out', Boolean(ev.description && ev.description.trim()), ev.description ? 'Attendees have a full description to read.' : 'Add richer event details for attendees.'),
    renderReadinessItem('Cover image is ready', Boolean(ev.heroImage), ev.heroImage ? 'Hero media is available for listings and previews.' : 'Add a cover image to improve presentation.'),
    renderReadinessItem('Publishing state is intentional', ev.status !== EventStatus.Cancelled, publishingSummary(ev)),
  ].join('')

  return `
    <div class="event-detail event-detail--admin">
      <section class="event-admin-hero card">
        <div class="event-admin-hero__backdrop" aria-hidden="true"></div>
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
            <p class="event-admin-hero__eyebrow">Admin workspace</p>
            <h1>${escapeHtml(ev.title)}</h1>
            ${ev.shortDescription ? `<p class="event-admin-hero__summary">${escapeHtml(ev.shortDescription)}</p>` : '<p class="event-admin-hero__summary muted">No short summary yet.</p>'}

            <div class="event-admin-hero__meta-row">
              <div class="event-admin-hero__meta-pill">
                <span>Schedule</span>
                <strong>${escapeHtml(scheduleText)}</strong>
              </div>
              <div class="event-admin-hero__meta-pill">
                <span>Location</span>
                <strong>${escapeHtml(locationText)}</strong>
              </div>
              <div class="event-admin-hero__meta-pill">
                <span>Pricing</span>
                <strong>${escapeHtml(priceText)}</strong>
              </div>
            </div>

            <div class="event-admin-hero__stats">
              <div class="event-admin-hero__stat">
                <span class="event-admin-hero__stat-label">Lifecycle</span>
                <strong>${escapeHtml(phase.label)}</strong>
                <p>${escapeHtml(phase.detail)}</p>
              </div>
              <div class="event-admin-hero__stat">
                <span class="event-admin-hero__stat-label">Audience</span>
                <strong>${escapeHtml(capacityText)}</strong>
                <p>${escapeHtml(audienceSummary(ev))}</p>
              </div>
              <div class="event-admin-hero__stat">
                <span class="event-admin-hero__stat-label">Visibility</span>
                <strong>${escapeHtml(statusText)}</strong>
                <p>${escapeHtml(publishingSummary(ev))}</p>
              </div>
            </div>
          </div>

          <div class="event-admin-hero__visual">
            <div class="event-admin-hero__image-card">
              <div class="event-admin-hero__image" style="background-image: url('${escapeHtml(heroUrl)}');"></div>
              <div class="event-admin-hero__image-overlay">
                <span class="event-admin-hero__image-label">Cover preview</span>
                <strong>${escapeHtml(ev.title)}</strong>
                <span>${escapeHtml(locationText)}</span>
              </div>
            </div>
            <div class="event-admin-hero__visual-copy">
              <div class="event-admin-hero__visual-copy-top">
                <div>
                  <div class="muted">Public preview</div>
                  <div class="strong">${escapeHtml(publishedText)}</div>
                </div>
                <a class="btn btn--secondary btn--sm" href="${previewHref(ev.id)}" data-link>Preview public page</a>
              </div>
              <div class="event-admin-tag-row">${tags}</div>
            </div>
          </div>
        </div>

        <div class="event-admin-hero__actions">
          <a class="btn btn--primary" href="${editHref(inAdmin, ev.id)}" data-link>Edit event</a>
          <a class="btn btn--secondary" href="${previewHref(ev.id)}" data-link>Preview event</a>
          ${canToggleStatus ? `<button type="button" class="${toggleTone}" data-admin-status-toggle data-next-status="${escapeHtml(nextStatus)}">${escapeHtml(toggleLabel)}</button>` : ''}
        </div>
      </section>

      <div class="event-admin-layout">
        <section class="event-admin-main">
          <article class="card event-admin-panel">
            <div class="event-admin-panel__header">
              <div>
                <p class="event-admin-panel__eyebrow">Overview</p>
                <h2>Publishing snapshot</h2>
                <p class="event-admin-panel__sub">A quick operational read on what attendees will see and what your team can still refine.</p>
              </div>
            </div>
            <div class="event-admin-meta-grid">
              ${renderMetaItem('Status', statusText, publishingSummary(ev))}
              ${renderMetaItem('Date range', scheduleText, phase.detail)}
              ${renderMetaItem('Location', locationText, ev.isOnline ? 'Attendees join remotely.' : 'Venue details appear on the public page.')}
              ${renderMetaItem('Price', priceText, typeof ev.priceCents === 'number' ? 'Ticketing is configured for this listing.' : 'No paid ticket is configured.')}
              ${renderMetaItem('Capacity', ev.capacity ? String(ev.capacity) : 'Not set', audienceSummary(ev))}
              ${renderMetaItem('Updated', formatDateTime(ev.updatedAt), 'Latest change reflected in admin.')}
            </div>
          </article>

          <article class="card event-admin-panel">
            <div class="event-admin-panel__header">
              <div>
                <p class="event-admin-panel__eyebrow">Planning</p>
                <h2>Operations at a glance</h2>
                <p class="event-admin-panel__sub">Keep the essentials visible for internal reviews, launch prep, and day-of coordination.</p>
              </div>
            </div>
            <div class="event-admin-content-grid">
              ${renderInfoCard('Schedule window', scheduleText, ev.startDate ? `Starts on ${formatDateOnly(ev.startDate)}` : 'No date selected yet.', 'brand')}
              ${renderInfoCard('Venue & access', locationText, ev.isOnline ? 'Remote-friendly setup.' : 'On-site attendance and logistics.', 'neutral')}
              ${renderInfoCard('Audience settings', capacityText, audienceSummary(ev), 'neutral')}
              ${renderInfoCard('Publishing history', publishedText, ev.createdAt ? `Created ${formatDateOnly(ev.createdAt)}` : 'Creation date unavailable.', 'neutral')}
            </div>
            <div class="event-admin-tags-block">
              <div class="event-admin-info-card__label">Discovery tags</div>
              <div class="event-admin-tag-row">${tags}</div>
            </div>
          </article>

          <article class="card event-admin-panel">
            <div class="event-admin-panel__header">
              <div>
                <p class="event-admin-panel__eyebrow">Description</p>
                <h2>Event story</h2>
                <p class="event-admin-panel__sub">Review the narrative attendees will read on the event page and in promotional surfaces.</p>
              </div>
            </div>
            <div class="prose event-admin-description">
              ${toProseHtml(ev.description || '<p class="muted">No description has been added yet.</p>')}
            </div>
          </article>
        </section>

        <aside class="card event-admin-sidebar card--compact">
          <section class="event-admin-sidebar__section event-admin-sidebar__section--accent">
            <p class="event-admin-sidebar__eyebrow">Quick actions</p>
            <h3 class="event-admin-sidebar__title">Keep this event moving</h3>
            <p class="event-admin-sidebar__copy">Jump into edits, preview the attendee experience, or change visibility without leaving the detail view.</p>
            <div class="event-admin-sidebar__actions">
              <a class="btn btn--primary" href="${editHref(inAdmin, ev.id)}" data-link>Edit details</a>
              <a class="btn btn--secondary" href="${previewHref(ev.id)}" data-link>Preview public page</a>
              ${canToggleStatus ? `<button type="button" class="btn btn--secondary" data-admin-status-toggle data-next-status="${escapeHtml(nextStatus)}">${escapeHtml(toggleLabel)}</button>` : ''}
            </div>
          </section>

          <section class="event-admin-sidebar__section">
            <p class="event-admin-sidebar__eyebrow">Readiness</p>
            <ul class="event-admin-checklist">
              ${checklist}
            </ul>
          </section>

          <section class="event-admin-sidebar__section">
            <p class="event-admin-sidebar__eyebrow">Publishing trail</p>
            <dl class="event-admin-sidebar__facts">
              <div>
                <dt>Slug</dt>
                <dd>${escapeHtml(ev.slug)}</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>${escapeHtml(publishedText)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>${escapeHtml(formatDateTime(ev.createdAt))}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>${escapeHtml(formatDateTime(ev.updatedAt))}</dd>
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
