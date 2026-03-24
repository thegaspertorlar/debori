import { events } from '../data/seed'

export function renderEventDetail(params: Record<string, string>) {
  const id = params.id
  const ev = events.find((e) => e.id === id)
  const el = document.createElement('div')
  el.className = 'page'
  if (!ev) {
    el.innerHTML = `
      <div class="page-title"><h1>Event not found</h1></div>
      <div class="card"><p class="muted">We couldn't find that event.</p></div>
    `
    return el
  }

  el.innerHTML = `
    <div class="page-title">
      <h1>${ev.title}</h1>
      <p class="muted">${ev.shortDescription}</p>
    </div>
    <div class="card">
      <img src="${ev.heroImage || ''}" alt="" style="width:100%; max-height:280px; object-fit:cover; border-radius:8px; margin-bottom:12px" />
      <div style="display:flex; gap:12px; align-items:center; justify-content:space-between">
        <div>
          <div class="muted">When</div>
          <div style="font-weight:600">${new Date(ev.startDate || ev.createdAt).toLocaleString()}</div>
        </div>
        <div>
          <div class="muted">Where</div>
          <div style="font-weight:600">${ev.location?.address || (ev.isOnline ? 'Online' : '')}</div>
        </div>
      </div>
      <hr style="margin:12px 0" />
      <div>${ev.description}</div>
      <div style="margin-top:12px; display:flex; gap:8px">
        <a class="btn btn--primary" href="#/events">Back to events</a>
        <a class="btn btn--outline" href="#/events/${ev.id}/edit">Edit</a>
      </div>
    </div>
  `
  return el
}
