import { listAdminEvents, deleteEvent } from '../api/mockApi'
import { EventStatus, Event } from '../models'

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
    return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${s.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })} - ${endTime}`
  }
  const endStr = e.toLocaleString(undefined, opts)
  return `${startStr} — ${endStr}`
}

function createStatusBadge(status: EventStatus) {
  const span = document.createElement('span')
  span.className = 'badge'
  if (status === EventStatus.Draft) span.classList.add('badge--subtle')
  if (status === EventStatus.Published) span.classList.add('badge--success')
  if (status === EventStatus.Past) span.classList.add('badge--info')
  if (status === EventStatus.Cancelled) span.classList.add('badge--danger')
  span.textContent = status.charAt(0).toUpperCase() + status.slice(1)
  return span
}

export function renderAdmin() {
  const el = document.createElement('div')
  el.className = 'page'
  el.innerHTML = `
    <div class="page-title" style="display:flex; align-items:center; justify-content:space-between; gap:16px">
      <div>
        <h1>Events dashboard</h1>
        <p class="muted">Operational overview — drafts, published and past events.</p>
      </div>
      <div style="display:flex; gap:8px; align-items:center">
        <a class="btn btn--primary btn--lg" href="#/events/create" data-link>Create event</a>
      </div>
    </div>

    <div class="card card--compact" style="margin-bottom:16px">
      <div class="card-header">
        <div style="display:flex; gap:8px; align-items:center">
          <div role="tablist" aria-label="Event status tabs" id="admin-tabs"></div>
        </div>
        <div class="muted">Manager view</div>
      </div>
      <div id="admin-events" style="min-height:120px">Loading events…</div>
    </div>
  `

  const tabsContainer = el.querySelector('#admin-tabs') as HTMLElement
  const listContainer = el.querySelector('#admin-events') as HTMLElement

  const tabs: { key: EventStatus | 'all'; label: string }[] = [
    { key: EventStatus.Draft, label: 'Draft' },
    { key: EventStatus.Published, label: 'Published' },
    { key: EventStatus.Past, label: 'Past' },
  ]

  let events: Event[] = []
  let active: EventStatus | 'Draft' | 'Published' | 'Past' = EventStatus.Published

  function renderTabs() {
    tabsContainer.innerHTML = ''
    tabs.forEach((t) => {
      const btn = document.createElement('button')
      btn.className = 'btn btn--ghost'
      btn.type = 'button'
      btn.textContent = t.label
      if (t.key === active) btn.classList.add('btn--outline')
      btn.addEventListener('click', () => {
        active = t.key as any
        renderTabs()
        renderList()
      })
      tabsContainer.appendChild(btn)
    })
  }

  function clearList() {
    listContainer.innerHTML = ''
  }

  function renderEmpty(stateLabel: string) {
    listContainer.innerHTML = `<div class="card"><h3>No ${stateLabel.toLowerCase()} events</h3><p class="muted">There are no ${stateLabel.toLowerCase()} events to show right now.</p></div>`
  }

  function renderList() {
    clearList()
    const filtered = events.filter((e) => {
      if (active === EventStatus.Draft) return e.status === EventStatus.Draft
      if (active === EventStatus.Published) return e.status === EventStatus.Published
      if (active === EventStatus.Past) return e.status === EventStatus.Past
      return true
    })

    if (!filtered.length) {
      renderEmpty(active as string)
      return
    }

    const grid = document.createElement('div')
    grid.className = 'events-grid'

    filtered.forEach((ev) => {
      // For past events, render as non-clickable card (read-only)
      const card = (ev.status === EventStatus.Past) ? document.createElement('div') : document.createElement('a')
      card.className = 'event-card'
      if (card.tagName === 'A') {
        ;(card as HTMLAnchorElement).setAttribute('data-link', '')
        ;(card as HTMLAnchorElement).setAttribute('href', `#/events/${ev.id}`)
      }

      const img = document.createElement('img')
      img.className = 'event-card__media'
      img.alt = ev.title || 'Event image'
      img.src = ev.heroImage || `https://picsum.photos/seed/${encodeURIComponent(ev.id)}/600/380`

      const body = document.createElement('div')
      body.className = 'event-card__body'

      const head = document.createElement('div')
      head.style.display = 'flex'
      head.style.justifyContent = 'space-between'
      head.style.alignItems = 'center'

      const title = document.createElement('h3')
      title.className = 'event-card__title'
      title.textContent = ev.title || 'Untitled event'

      head.appendChild(title)
      head.appendChild(createStatusBadge(ev.status))

      const meta = document.createElement('div')
      meta.className = 'event-card__meta'
      const dateSpan = document.createElement('div')
      dateSpan.className = 'event-card__date'
      dateSpan.textContent = formatDateRange(ev.startDate, ev.endDate)
      const addr = document.createElement('div')
      addr.textContent = ev.isOnline ? 'Online' : (ev.location?.address || ev.location?.city || '')

      meta.appendChild(dateSpan)
      meta.appendChild(addr)

      const actions = document.createElement('div')
      actions.style.display = 'flex'
      actions.style.gap = '8px'
      actions.style.marginTop = '6px'

      // Edit action: available for Draft and Published (not Past)
      if (ev.status === EventStatus.Draft || ev.status === EventStatus.Published) {
        const edit = document.createElement('a')
        edit.className = 'btn btn--secondary btn--sm'
        edit.href = `#/events/${ev.id}/edit`
        edit.setAttribute('data-link', '')
        edit.textContent = 'Edit'
        actions.appendChild(edit)
      }

      // Delete action: only visible for Draft items
      if (ev.status === EventStatus.Draft) {
        const del = document.createElement('button')
        del.className = 'btn btn--destructive btn--sm'
        del.type = 'button'
        del.textContent = 'Delete'
        del.addEventListener('click', async (e) => {
          e.stopPropagation()
          e.preventDefault()
          if (!confirm('Delete this draft event? This cannot be undone.')) return
          del.disabled = true
          const res = await deleteEvent(ev.id)
          if (!res.ok) {
            alert(res.message || 'Unable to delete event')
            del.disabled = false
            return
          }
          // remove from local state and re-render
          events = events.filter((x) => x.id !== ev.id)
          renderList()
        })
        actions.appendChild(del)
      }

      body.appendChild(head)
      if (ev.shortDescription) {
        const desc = document.createElement('div')
        desc.className = 'muted'
        desc.style.fontSize = '13px'
        desc.textContent = ev.shortDescription
        body.appendChild(desc)
      }
      body.appendChild(meta)
      body.appendChild(actions)

      card.appendChild(img)
      card.appendChild(body)

      grid.appendChild(card)
    })

    listContainer.appendChild(grid)
  }

  ;(async () => {
    listContainer.textContent = 'Loading events…'
    const res = await listAdminEvents()
    if (!res.ok) {
      listContainer.innerHTML = `<p class="muted">Unable to load events. ${res.message || ''}</p>`
      return
    }
    events = res.data || []
    // default to Published tab if there are published events, else Draft
    if (events.some((e) => e.status === EventStatus.Published)) active = EventStatus.Published
    else if (events.some((e) => e.status === EventStatus.Draft)) active = EventStatus.Draft
    renderTabs()
    renderList()
  })()

  return el
}
