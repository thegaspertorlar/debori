import { Router } from './router'
import { renderHome } from './pages/home'
import { renderLogin } from './pages/login'
import { renderEventsList } from './pages/eventsList'
import { renderEventDetail } from './pages/eventDetail'
import { renderEventCreate } from './pages/eventCreate'
import { renderEventEdit } from './pages/eventEdit'
import './style.css'

import { isAuthenticated, logoutSession, onSessionChange } from './session'
import { createAdminShell } from './adminShell'

const routes = [
  { path: '/home', render: renderHome },
  { path: '/login', render: renderLogin },
  // Admin routes are handled by a dedicated admin shell mounted at /admin/*
  { path: '/events', render: renderEventsList },
  { path: '/events/create', render: renderEventCreate, protected: true },
  { path: '/events/:id/edit', render: renderEventEdit, protected: true },
  { path: '/events/:id', render: renderEventDetail },
]

export function createAppShell(container: HTMLElement) {
  // The app can mount either the public shell or the admin shell.
  // Admin shell lives under the /admin/* namespace and provides a
  // completely separate layout and router so admin pages never render
  // the public header/navigation.

  // Track which shell is active: 'public' or 'admin'
  let activeShell: 'public' | 'admin' | null = null
  let publicRouter: Router | null = null
  let adminInstance: any = null

  function mountPublic() {
    if (activeShell === 'public') return
    activeShell = 'public'
    // clear any existing DOM
    container.innerHTML = ''

    // Header
    const header = document.createElement('header')
    header.className = 'app-header'
    header.innerHTML = `
      <div class="container app-header-inner">
        <div class="header-left">
          <a class="brand" href="#/home">Debori</a>
        </div>

        <button class="nav-toggle" aria-expanded="false" aria-label="Toggle navigation">☰</button>

        <nav class="primary-nav" aria-label="Main navigation">
          <div class="nav-links">
            <a href="#/home" data-link>Home</a>
            <a href="#/events" data-link>Events</a>
          </div>
          <div class="nav-auth">
          <a href="#/login" data-link class="login-link btn btn--outline btn--sm">Login</a>
          </div>
        </nav>
      </div>
    `

    // Main content
    const main = document.createElement('main')
    main.className = 'app-main container'

    container.appendChild(header)
    container.appendChild(main)

    publicRouter = new Router(routes, main)

    // Navigation toggle (mobile)
    const toggle = header.querySelector('.nav-toggle') as HTMLButtonElement
    const nav = header.querySelector('.primary-nav') as HTMLElement
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open')
      toggle.setAttribute('aria-expanded', String(open))
      syncHeaderHeight()
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
        syncHeaderHeight()
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

    // Update auth UI in public shell. Keep primary nav focused on public
    // links even when a manager is signed in so the public site feels like
    // a separate subdomain.
    function updateAuthUI() {
      const loginAnchor = header.querySelector('.login-link') as HTMLAnchorElement | null
      const navAuth = header.querySelector('.nav-auth') as HTMLElement | null
      if (!loginAnchor || !navAuth) return

      if (isAuthenticated()) {
        loginAnchor.textContent = 'Manager'
        loginAnchor.setAttribute('href', '#/admin/events')
        loginAnchor.classList.remove('btn--outline')
        loginAnchor.classList.add('btn--primary')

        if (!header.querySelector('.logout-link')) {
          const out = document.createElement('a')
          out.className = 'logout-link btn btn--outline btn--sm'
          out.href = '#/home'
          out.textContent = 'Sign out'
          out.addEventListener('click', (e) => {
            e.preventDefault()
            logoutSession()
            location.hash = '/home'
          })
          navAuth.appendChild(out)
        }
      } else {
        loginAnchor.textContent = 'Login'
        loginAnchor.setAttribute('href', '#/login')
        loginAnchor.classList.remove('btn--primary')
        loginAnchor.classList.add('btn--outline')
        const existing = header.querySelector('.logout-link')
        if (existing) existing.remove()
      }
      syncHeaderHeight()
    }

    onSessionChange(updateAuthUI)
    updateAuthUI()

    function syncHeaderHeight() {
      const rect = header.getBoundingClientRect()
      if (rect && rect.height) {
        const value = `${Math.ceil(rect.height)}px`
        document.documentElement.style.setProperty('--app-header-height', value)
        header.style.setProperty('--app-header-height', value)
      }
    }

    const ro = new ResizeObserver(() => syncHeaderHeight())
    ro.observe(header)
    window.addEventListener('resize', syncHeaderHeight)
    setTimeout(syncHeaderHeight, 0)

    // Initialize route (redirect root to /home) if nothing is set
    if (!location.hash || location.hash === '#/' || location.hash === '#') {
      location.hash = '/home'
    } else {
      publicRouter!.handle(location.hash.replace(/^#/, ''))
    }
    updateActive()
  }

  // Shell switcher: mount admin shell when path starts with /admin, otherwise mount public.
  function ensureCorrectShell() {
    const path = location.hash.replace(/^#/, '') || '/home'
    if (path.startsWith('/admin')) {
      if (activeShell !== 'admin') {
        adminInstance = createAdminShell(container)
        activeShell = 'admin'
      }
    } else {
      if (activeShell !== 'public') {
        mountPublic()
      }
    }
  }

  // Watch for top-level hash changes to mount the right shell. Individual
  // routers inside each shell will handle route-level guarding and rendering.
  window.addEventListener('hashchange', () => {
    ensureCorrectShell()
  })

  // Initial mount
  ensureCorrectShell()
}
