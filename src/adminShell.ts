import './style.css'
import { Router } from './router'
import { renderAdmin } from './pages/admin'
import { renderEventsList } from './pages/eventsList'
import { logoutSession } from './session'

type AdminShell = {
  router?: Router
}

// Admin shell: top header + left sidebar + content outlet.
// The admin shell fully replaces the public header/navigation so
// admin screens never show public-site chrome.
export function createAdminShell(container: HTMLElement) {
  container.innerHTML = ''

  const shell = document.createElement('div')
  shell.className = 'admin-shell page page--admin'

  // Header (top) with branding and a mobile toggle for the sidebar
  const header = document.createElement('header')
  header.className = 'app-header app-header--admin admin-shell__header'
  header.innerHTML = `
    <div class="container app-header-inner">
      <div class="header-left">
        <button class="admin-nav-toggle" aria-label="Toggle admin navigation" aria-expanded="false">☰</button>
        <a class="brand" href="#/admin/dashboard">Debori</a>
        <a class="return-public" href="#/home" aria-label="Return to public site">Return to public site</a>
      </div>
      <div class="header-actions" style="margin-left:auto">
        <a class="logout-link btn btn--outline btn--sm" href="#/home">Sign out</a>
      </div>
    </div>
  `

  // Body contains sidebar and main workspace
  const body = document.createElement('div')
  body.className = 'admin-shell__body'

  const sidebar = document.createElement('aside')
  sidebar.className = 'admin-shell__sidebar'
  sidebar.setAttribute('aria-label', 'Admin sidebar')
  sidebar.innerHTML = `
    <nav class="admin-sidebar-nav" aria-label="Admin navigation">
      <a href="#/admin/dashboard" data-link>Dashboard</a>
      <a href="#/admin/events" data-link>Events</a>
    </nav>
  `

  const main = document.createElement('main')
  main.className = 'admin-shell__main container admin-main'
  main.setAttribute('role', 'main')

  body.appendChild(sidebar)
  body.appendChild(main)

  shell.appendChild(header)
  shell.appendChild(body)
  container.appendChild(shell)

  // Wire sign out
  const out = header.querySelector('.logout-link') as HTMLElement | null
  if (out) {
    out.addEventListener('click', (e) => {
      e.preventDefault()
      logoutSession()
      location.hash = '/home'
    })
  }

  // Mobile sidebar toggle
  const toggle = header.querySelector('.admin-nav-toggle') as HTMLButtonElement | null
  if (toggle) {
    toggle.addEventListener('click', () => {
      const open = shell.classList.toggle('admin-shell--sidebar-open')
      toggle.setAttribute('aria-expanded', String(open))
    })
  }

  // Close sidebar when clicking outside on mobile
  shell.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    // Delegate SPA links inside admin shell
    const link = target.closest('[data-link]') as HTMLAnchorElement | null
    if (link) {
      e.preventDefault()
      const href = link.getAttribute('href') || '#/admin/dashboard'
      location.hash = href.replace(/^#/, '')
      // close mobile sidebar when navigating
      shell.classList.remove('admin-shell--sidebar-open')
      const t = header.querySelector('.admin-nav-toggle') as HTMLButtonElement | null
      if (t) t.setAttribute('aria-expanded', 'false')
      return
    }
  })

  // Admin routes are always protected. The router will redirect to
  // /login for unauthenticated users.
  const routes = [
    { path: '/admin', render: () => { location.hash = '/admin/dashboard'; const d = document.createElement('div'); return d }, protected: true },
    { path: '/admin/dashboard', render: renderAdmin, protected: true },
    { path: '/admin/events', render: renderEventsList, protected: true },
  ]

  const router = new Router(routes as any, main)

  // Highlight active link in the sidebar
  function updateActive() {
    const path = location.hash.replace(/^#/, '') || '/admin/dashboard'
    const anchors = sidebar.querySelectorAll('a')
    anchors.forEach((a) => {
      const href = (a as HTMLAnchorElement).getAttribute('href') || '#/admin/dashboard'
      const clean = href.replace(/^#/, '')
      if (path === clean || (clean !== '/admin/dashboard' && path.startsWith(clean))) {
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
  updateActive()

  // Keep header height CSS variable in sync (used by other layout pieces)
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

  // Initialize route inside admin shell
  if (!location.hash || location.hash === '#/' || location.hash === '#') {
    location.hash = '/admin/dashboard'
  } else {
    // If already inside admin namespace, let router handle it
    if (location.hash.replace(/^#/, '').startsWith('/admin')) {
      router.handle(location.hash.replace(/^#/, ''))
    }
  }

  return { router }
}
