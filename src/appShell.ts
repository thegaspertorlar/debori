import { Router } from './router'
import { renderHome } from './pages/home'
import { renderLogin } from './pages/login'
import { renderAdmin } from './pages/admin'
import { renderEventsList } from './pages/eventsList'
import { renderEventDetail } from './pages/eventDetail'
import './style.css'

import { isAuthenticated, logoutSession, onSessionChange } from './session'

const routes = [
  { path: '/home', render: renderHome },
  { path: '/login', render: renderLogin },
  { path: '/admin', render: renderAdmin, protected: true },
  { path: '/events', render: renderEventsList },
  { path: '/events/:id', render: renderEventDetail },
  // future: /events/create, /events/:id/edit
]

export function createAppShell(container: HTMLElement) {
  // Header
  const header = document.createElement('header')
  header.className = 'app-header'
  header.innerHTML = `
    <div class="container app-header-inner">
      <a class="brand" href="#/home">Debori</a>
      <button class="nav-toggle" aria-expanded="false" aria-label="Toggle navigation">☰</button>
      <nav class="primary-nav" aria-label="Main navigation">
        <a href="#/home" data-link>Home</a>
        <a href="#/events" data-link>Events</a>
        <a href="#/login" data-link class="login-link">Login</a>
      </nav>
    </div>
  `

  // Main content
  const main = document.createElement('main')
  main.className = 'app-main container'

  container.appendChild(header)
  container.appendChild(main)

  const router = new Router(routes, main)

  // Navigation toggle (mobile)
  const toggle = header.querySelector('.nav-toggle') as HTMLButtonElement
  const nav = header.querySelector('.primary-nav') as HTMLElement
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open')
    toggle.setAttribute('aria-expanded', String(open))
  })

  // Delegate link clicks to router for SPA behavior
  header.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const link = target.closest('[data-link]') as HTMLAnchorElement | null
    if (link) {
      e.preventDefault()
      const href = link.getAttribute('href') || '#/home'
      // update hash (router listens to hashchange)
      location.hash = href.replace(/^#/, '')
      // close mobile nav
      nav.classList.remove('is-open')
      toggle.setAttribute('aria-expanded', 'false')
    }
  })

  // Update active link state on navigation
  const updateActive = () => {
    const path = location.hash.replace(/^#/, '') || '/home'
    const anchors = header.querySelectorAll('nav.primary-nav a')
    anchors.forEach((a) => {
      const href = (a as HTMLAnchorElement).getAttribute('href') || '#/home'
      const clean = href.replace(/^#/, '')
      if (path === clean || (clean !== '/home' && path.startsWith(clean))) {
        a.classList.add('active')
        a.setAttribute('aria-current', 'page')
      } else {
        a.classList.remove('active')
        a.removeAttribute('aria-current')
      }
    })
  }

  window.addEventListener('hashchange', updateActive)
  window.addEventListener('popstate', updateActive)

  // Update auth UI (login link -> admin + logout when signed in)
  function updateAuthUI() {
    const loginAnchor = header.querySelector('.login-link') as HTMLAnchorElement | null
    if (!loginAnchor) return
    if (isAuthenticated()) {
      loginAnchor.textContent = 'Manager'
      loginAnchor.setAttribute('href', '#/admin')
      // add logout if not present
      if (!header.querySelector('.logout-link')) {
        const nav = header.querySelector('.primary-nav') as HTMLElement
        const out = document.createElement('a')
        out.className = 'logout-link'
        out.href = '#/home'
        out.textContent = 'Sign out'
        out.style.marginLeft = '6px'
        out.addEventListener('click', (e) => {
          e.preventDefault()
          logoutSession()
          location.hash = '/home'
        })
        nav.appendChild(out)
      }
    } else {
      loginAnchor.textContent = 'Login'
      loginAnchor.setAttribute('href', '#/login')
      const existing = header.querySelector('.logout-link')
      if (existing) existing.remove()
    }
  }

  // react to session changes
  onSessionChange(updateAuthUI)
  updateAuthUI()

  // Initialize route (redirect root to /home)
  if (!location.hash || location.hash === '#/' || location.hash === '#') {
    location.hash = '/home'
  } else {
    router.handle(location.hash.replace(/^#/, ''))
  }
  updateActive()
}
