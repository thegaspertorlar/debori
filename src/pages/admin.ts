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

  // Simple modal helper to provide a confirmation / info dialog
  function showModal(opts: { title: string; body: string; actions?: Array<{ label: string; className?: string; onClick?: (m: any) => void }>; }) {
    const backdrop = document.createElement('div')
    backdrop.className = 'modal-backdrop'
    const dialog = document.createElement('div')
    dialog.className = 'modal'

    dialog.innerHTML = `
      <div class="modal__inner">
        <h2 class="modal__title">${opts.title}</h2>
        <div class="modal__body">${opts.body}</div>
        <div class="modal__actions"></div>
      </div>
    `

    backdrop.appendChild(dialog)
    document.body.appendChild(backdrop)

    const actionsContainer = dialog.querySelector('.modal__actions') as HTMLElement
    const buttons: HTMLButtonElement[] = []

    const modalInstance: any = {
      node: backdrop,
      close() {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop)
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

    // small helper to toggle action buttons
    function _setDisabled(m: any, v: boolean) {
      (m._actionButtons || []).forEach((btn: HTMLButtonElement) => (btn.disabled = !!v))
    }

    // expose helper for external calls
    ;(modalInstance as any).setDisabled = (v: boolean) => _setDisabled(modalInstance, v)

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
