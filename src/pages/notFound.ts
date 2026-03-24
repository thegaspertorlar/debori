import { createEmptyCard } from '../uiStates'

export function renderNotFound() {
  const el = document.createElement('div')
  el.className = 'page page--public'
  el.innerHTML = `
    <div class="page-title">
      <h1>Not found</h1>
      <p class="muted">We couldn't find the page you were looking for.</p>
    </div>
    <div id="notfound-root" class="container"></div>
  `

  const root = el.querySelector('#notfound-root') as HTMLElement
  const card = createEmptyCard(
    'Page not found',
    "The link may be broken or the item no longer exists. You can return to the events list or go back home.",
    'View events',
    '#/events'
  )

  const actionsWrap = document.createElement('div')
  actionsWrap.className = 'row row--sm mt-3'
  const home = document.createElement('a')
  home.className = 'btn'
  home.href = '#/home'
  home.textContent = 'Home'
  actionsWrap.appendChild(home)

  // Place the card inside a narrow container for better composition
  const wrapper = document.createElement('div')
  wrapper.style.maxWidth = '680px'
  wrapper.appendChild(card)
  wrapper.appendChild(actionsWrap)

  root.appendChild(wrapper)

  return el
}
