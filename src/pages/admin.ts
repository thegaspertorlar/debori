import { listAdminEvents, deleteEvent, updateEvent } from '../api/mockApi'
import { EventStatus, Event } from '../models'
import { createLoadingCard, createErrorCard, createEmptyCard } from '../uiStates'

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
  // semantic modifier + accessible attributes
  if (status === EventStatus.Draft) span.classList.add('badge--subtle')
  if (status === EventStatus.Published) span.classList.add('badge--success')
  if (status === EventStatus.Past) span.classList.add('badge--info')
  if (status === EventStatus.Cancelled) span.classList.add('badge--danger')

  // Consistent, predictable label text for badges across the product
  const labelMap: Record<string, string> = {
    [EventStatus.Draft]: 'Draft',
    [EventStatus.Published]: 'Published',
    [EventStatus.Past]: 'Past',
    [EventStatus.Cancelled]: 'Cancelled',
  }
  const label = labelMap[status] || String(status)
  span.textContent = label
  span.setAttribute('data-status', String(status).toLowerCase())
  span.setAttribute('aria-label', `Status: ${label}`)
  return span
}

export function renderAdmin() {
  const el = document.createElement('div')
  el.className = 'page'
  el.innerHTML = `
    <div class="page-title">
      <div class="row row--md justify-between">
        <div class="events-page__title">
          <h1>Events dashboard</h1>
          <p class="muted">Operational overview — drafts, published and past events. Manager-focused controls for quick action.</p>
        </div>
        <div class="events-page__actions">
          <a class="btn btn--primary" href="#/events/create" data-link>Create event</a>
        </div>
      </div>
    </div>

    <div class="admin-controls card--compact mb-4">
      <div class="row justify-between" style="align-items:center; gap:12px">
        <div>
          <div role="tablist" aria-label="Event status tabs" id="admin-tabs" class="admin-tabs"></div>
          <div class="muted" style="margin-top:6px">Manager view · quick filters</div>
        </div>
        <!-- toolbar intentionally minimal for manager-focused workflows -->
        <!-- removed: Recent, My team, and duplicate Create event actions to reduce noise -->
      </div>
    </div>

    <div id="admin-events" class="card" style="min-height:120px; padding:0">Loading events…</div>
  `

  const tabsContainer = el.querySelector('#admin-tabs') as HTMLElement
  const listContainer = el.querySelector('#admin-events') as HTMLElement

  const tabs: { key: EventStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: EventStatus.Draft, label: 'Draft' },
    { key: EventStatus.Published, label: 'Published' },
    { key: EventStatus.Past, label: 'Past' },
  ]

  let events: Event[] = []
  let active: EventStatus | 'all' = 'all'

  // Simple modal helper to provide a confirmation / info dialog
  function showModal(opts: { title: string; body: string; actions?: Array<{ label: string; className?: string; onClick?: (m: any) => void }>; }) {
    const backdrop = document.createElement('div')
    backdrop.className = 'modal-backdrop'
    // outer dialog element with accessible attributes
    const dialog = document.createElement('div')
    dialog.className = 'modal'

    // accessible title id
    const titleId = `modal-title-${String(Math.random()).slice(2, 8)}`

    dialog.innerHTML = `
      <div class="modal__inner">
        <h2 class="modal__title" id="${titleId}">${opts.title}</h2>
        <div class="modal__body">${opts.body}</div>
        <div class="modal__actions"></div>
      </div>
    `

    // set dialog accessibility attributes
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    dialog.setAttribute('aria-labelledby', titleId)
    dialog.tabIndex = -1

    backdrop.appendChild(dialog)
    document.body.appendChild(backdrop)

    const actionsContainer = dialog.querySelector('.modal__actions') as HTMLElement
    const buttons: HTMLButtonElement[] = []

    // save previously focused element so we can restore on close
    const previouslyFocused = document.activeElement as HTMLElement | null
    // prevent page scroll while modal is open
    const previousBodyOverflow = document.body.style.overflow || ''
    document.body.style.overflow = 'hidden'

    const modalInstance: any = {
      node: backdrop,
      close() {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop)
        document.body.style.overflow = previousBodyOverflow
        // restore focus
        try { if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus() } catch (e) {}
      },
      _actionButtons: buttons,
    }

    const makeBtn = (a: any) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = a.className || 'btn'
      b.textContent = a.label
      b.addEventListener('click', (ev) => {
        try {
          if (a.onClick) a.onClick(modalInstance)
        } catch (err) {
          console.error(err)
        }
      })
      return b
    }

    if (opts.actions && opts.actions.length) {
      opts.actions.forEach((a) => {
        const b = makeBtn(a)
        buttons.push(b)
        actionsContainer.appendChild(b)
      })
    } else {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'btn'
      b.textContent = 'Close'
      b.addEventListener('click', () => modalInstance.close())
      buttons.push(b)
      actionsContainer.appendChild(b)
    }

    // close on backdrop click (but not when clicking inside dialog)
    backdrop.addEventListener('click', (ev) => {
      if (ev.target === backdrop) modalInstance.close()
    })

    // keyboard handlers: ESC to close, and focus trap for Tab
    backdrop.addEventListener('keydown', (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        ev.preventDefault()
        modalInstance.close()
        return
      }

      if (ev.key === 'Tab') {
        // maintain focus inside dialog
        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"))
        if (!focusable.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault()
          last.focus()
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault()
          first.focus()
        }
      }
    })

    // small helper to toggle action buttons
    function _setDisabled(m: any, v: boolean) {
      (m._actionButtons || []).forEach((btn: HTMLButtonElement) => (btn.disabled = !!v))
    }

    // expose helper for external calls
    ;(modalInstance as any).setDisabled = (v: boolean) => _setDisabled(modalInstance, v)

    // focus first actionable element, or dialog if none
    setTimeout(() => {
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"))
      if (focusable.length) {
        focusable[0].focus()
      } else {
        dialog.focus()
      }
    }, 0)

    return modalInstance
  }

  // bridge used by inline callbacks to toggle modal action state
  function thisDisabled(modal: any, v: boolean) {
    if (!modal) return
    if (typeof modal.setDisabled === 'function') modal.setDisabled(!!v)
    else if (modal._actionButtons) modal._actionButtons.forEach((b: HTMLButtonElement) => (b.disabled = !!v))
  }

  function renderTabs() {
    tabsContainer.innerHTML = ''
    tabs.forEach((t) => {
      const btn = document.createElement('button')
      btn.className = 'btn btn--ghost'
      btn.type = 'button'
      // Compute live counts when available to help managers scan quickly
      let count = 0
      if (events && events.length) {
        if (t.key === 'all') count = events.length
        else count = events.filter((e) => e.status === (t.key as EventStatus)).length
      }
      btn.textContent = t.label + (count ? ` (${count})` : '')
      // ARIA tab roles and keyboard support
      btn.setAttribute('role', 'tab')
      btn.setAttribute('aria-controls', 'admin-events')
      btn.id = `admin-tab-${String(t.key)}`
      if (t.key === active) {
        btn.classList.add('btn--outline')
        btn.setAttribute('aria-selected', 'true')
        btn.tabIndex = 0
      } else {
        btn.setAttribute('aria-selected', 'false')
        btn.tabIndex = -1
      }

      btn.addEventListener('click', () => {
        active = t.key as any
        renderTabs()
        renderList()
      })

      // keyboard navigation: ArrowLeft/ArrowRight, Home/End, Enter/Space to activate
      btn.addEventListener('keydown', (ev: KeyboardEvent) => {
        const idx = tabs.findIndex((x) => x.key === t.key)
        if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
          ev.preventDefault()
          const next = tabs[(idx + 1) % tabs.length]
          const nextEl = tabsContainer.querySelector(`#admin-tab-${String(next.key)}`) as HTMLElement | null
          if (nextEl) nextEl.focus()
        } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
          ev.preventDefault()
          const prev = tabs[(idx - 1 + tabs.length) % tabs.length]
          const prevEl = tabsContainer.querySelector(`#admin-tab-${String(prev.key)}`) as HTMLElement | null
          if (prevEl) prevEl.focus()
        } else if (ev.key === 'Home') {
          ev.preventDefault()
          const first = tabs[0]
          const firstEl = tabsContainer.querySelector(`#admin-tab-${String(first.key)}`) as HTMLElement | null
          if (firstEl) firstEl.focus()
        } else if (ev.key === 'End') {
          ev.preventDefault()
          const last = tabs[tabs.length - 1]
          const lastEl = tabsContainer.querySelector(`#admin-tab-${String(last.key)}`) as HTMLElement | null
          if (lastEl) lastEl.focus()
        } else if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault()
          active = t.key as any
          renderTabs()
          renderList()
        }
      })

      tabsContainer.appendChild(btn)
    })
  }

  function clearList() {
    listContainer.innerHTML = ''
  }

  function renderEmpty(stateLabel: string) {
    const title = `No ${stateLabel.toLowerCase()} events`
    const message = `There are no ${stateLabel.toLowerCase()} events to show right now.`
    listContainer.innerHTML = ''
    listContainer.appendChild(createEmptyCard(title, message, 'Create event', '#/events/create'))
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
      // Admin-specific variant: more compact, task-focused layout
      card.className = 'event-card event-card--admin'
      if (card.tagName === 'A') {
        ;(card as HTMLAnchorElement).setAttribute('data-link', '')
        ;(card as HTMLAnchorElement).setAttribute('href', `#/events/${ev.id}`)
      }

      // media wrapper so admin cards can also host overlays consistently
      const mediaWrap = document.createElement('div')
      mediaWrap.className = 'event-card__media-wrap'

      const img = document.createElement('img')
      img.className = 'event-card__media'
      img.alt = ev.title || 'Event image'
      img.src = ev.heroImage || `https://picsum.photos/seed/${encodeURIComponent(ev.id)}/600/380`

      const body = document.createElement('div')
      body.className = 'event-card__body'

      // header groups date + title on the left, status badge on the right
      const head = document.createElement('div')
      head.className = 'event-card__header'

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

      head.appendChild(left)
      head.appendChild(createStatusBadge(ev.status))

      const meta = document.createElement('div')
      meta.className = 'event-card__meta'
      const addr = document.createElement('div')
      addr.className = 'event-card__location'
      addr.textContent = ev.isOnline ? 'Online' : (ev.location?.address || ev.location?.city || '')

      meta.appendChild(addr)

    const actions = document.createElement('div')
    actions.className = 'actions mt-2'

    // View action: quick access to open the event (useful for scanning)
    const view = document.createElement('a')
    view.className = 'btn btn--ghost btn--sm'
    view.href = `#/events/${ev.id}`
    view.setAttribute('data-link', '')
    view.textContent = 'View'
    // prevent the card-level click from also activating when clicking the inner control
    view.addEventListener('click', (e) => { e.stopPropagation() })
    actions.appendChild(view)

    // Edit action: available for Draft and Published (not Past)
    if (ev.status === EventStatus.Draft || ev.status === EventStatus.Published) {
      const edit = document.createElement('a')
      edit.className = 'btn btn--secondary btn--sm'
      edit.href = `#/events/${ev.id}/edit`
      edit.setAttribute('data-link', '')
      edit.textContent = 'Edit'
      edit.addEventListener('click', (e) => { e.stopPropagation() })
      actions.appendChild(edit)
    }

      // Delete action
      if (ev.status === EventStatus.Draft) {
        // Draft: allow deletion but require confirmation modal
        const del = document.createElement('button')
        del.className = 'btn btn--destructive btn--sm'
        del.type = 'button'
        del.textContent = 'Delete'
        del.addEventListener('click', async (e) => {
          e.stopPropagation()
          e.preventDefault()
          showModal({
            title: 'Delete draft? This cannot be undone',
            body: `<p>Are you sure you want to permanently delete the draft "${(ev.title || 'Untitled event').replace(/</g, '&lt;')}"?</p><p class="muted">This action cannot be recovered.</p>`,
            actions: [
              { label: 'Cancel', className: 'btn', onClick: (m) => m.close() },
              { label: 'Delete event', className: 'btn btn--destructive', async onClick(m) {
                // perform deletion
                thisDisabled(m, true)
                const res = await deleteEvent(ev.id)
                if (!res.ok) {
                  thisDisabled(m, false)
                  showModal({ title: 'Unable to delete', body: `<p class="muted">${res.message || 'We were unable to delete this draft.'}</p>` })
                  return
                }
                // remove from local state and re-render
                events = events.filter((x) => x.id !== ev.id)
                m.close()
                renderList()
              } },
            ],
          })
        })
        actions.appendChild(del)
      } else if (ev.status === EventStatus.Published) {
        // Published: show blocked delete that teaches the next step (move to Draft)
        const del = document.createElement('button')
        del.className = 'btn btn--destructive btn--sm'
        del.type = 'button'
        del.textContent = 'Delete'
        // visually indicate it's blocked but still interactive to educate the user
        del.addEventListener('click', async (e) => {
          e.stopPropagation()
          e.preventDefault()
          showModal({
            title: 'Published items cannot be deleted directly',
            body: `<p>The event "${(ev.title || 'Untitled event').replace(/</g, '&lt;')}" is currently published. To delete it, first move it back to <strong>Draft</strong>.</p><p class="muted">You can either edit the event and save as draft, or use the button below to move it to Draft now.</p>`,
            actions: [
              { label: 'Close', className: 'btn', onClick: (m) => m.close() },
              { label: 'Edit event', className: 'btn btn--secondary', onClick: (m) => { m.close(); location.hash = `#/events/${ev.id}/edit` } },
              { label: 'Move to Draft', className: 'btn btn--primary', async onClick(m) {
                thisDisabled(m, true)
                const res = await updateEvent(ev.id, { status: EventStatus.Draft })
                if (!res.ok) {
                  thisDisabled(m, false)
                  showModal({ title: 'Unable to change status', body: `<p class="muted">${res.message || 'We were unable to change the event status.'}</p>` })
                  return
                }
                // update local copy and re-render to reflect new state
                events = events.map((x) => x.id === ev.id ? (res.data as Event) : x)
                m.close()
                renderList()
              } },
            ],
          })
        })
        actions.appendChild(del)
      }

      body.appendChild(head)
        if (ev.shortDescription) {
         const desc = document.createElement('div')
         desc.className = 'muted text-sm'
         desc.textContent = ev.shortDescription
         body.appendChild(desc)
       }
      body.appendChild(meta)
      body.appendChild(actions)

      // date badge overlay for admin cards
      const badge = document.createElement('div')
      badge.className = 'event-card__date-badge'
      if (ev.startDate) {
        const d = new Date(ev.startDate)
        const month = d.toLocaleString(undefined, { month: 'short' }).toUpperCase()
        const day = d.getDate()
        badge.innerHTML = `<div class="event-card__date-badge-month">${month}</div><div class="event-card__date-badge-day">${day}</div>`
      }
      mediaWrap.appendChild(img)
      mediaWrap.appendChild(badge)
      card.appendChild(mediaWrap)
      card.appendChild(body)

      grid.appendChild(card)
    })

    listContainer.appendChild(grid)
  }

  ;(async () => {
    listContainer.innerHTML = ''
    listContainer.appendChild(createLoadingCard('Loading events'))
    const res = await listAdminEvents()
    if (!res.ok) {
      listContainer.innerHTML = ''
      listContainer.appendChild(createErrorCard('Unable to load events', res.message))
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
