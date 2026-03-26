import './style.css'
import { Router } from './router'
import { renderAdmin } from './pages/admin'
import { renderEventCreate } from './pages/eventCreate'
import { renderEventEdit } from './pages/eventEdit'
import { renderEventDetail } from './pages/eventDetail'
import { getSession, logoutSession } from './session'

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

  // Header (top) with branding, logout, and a mobile toggle for the sidebar
  const header = document.createElement('header')
  header.className = 'app-header app-header--admin admin-shell__header'

  const session = getSession()
  const managerName = session?.user?.name || 'Demo Manager'

  header.innerHTML = `
    <div class="container app-header-inner">
      <div class="header-left">
        <button class="admin-nav-toggle" type="button" aria-label="Toggle admin navigation" aria-expanded="false">
          <span aria-hidden="true">☰</span>
        </button>
        <a class="brand admin-brand" href="#/admin/events" aria-label="Go to events management">
          <span class="admin-brand__mark" aria-hidden="true"></span>
          <span class="admin-brand__name">Debori Admin</span>
        </a>
      </div>
      <div class="header-actions">
        <button class="btn btn--outline btn--sm admin-signout" type="button" aria-label="Log out ${managerName}">Logout</button>
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
      <a href="#/admin/events" data-link role="link">Events</a>
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

  const signoutBtn = header.querySelector('.admin-signout') as HTMLButtonElement | null
  if (signoutBtn) {
    signoutBtn.addEventListener('click', (e) => {
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
      const href = link.getAttribute('href') || '#/admin/events'
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
    { path: '/admin', render: () => { location.hash = '/admin/events'; const d = document.createElement('div'); return d }, protected: true },
    // Admin-scoped event management routes
    { path: '/admin/events', render: renderAdmin, protected: true },
    { path: '/admin/events/create', render: renderEventCreate, protected: true },
    { path: '/admin/events/:id', render: renderEventDetail, protected: true },
    { path: '/admin/events/:id/edit', render: renderEventEdit, protected: true },
  ]

  const router = new Router(routes as any, main)

  // Highlight active link in the sidebar
  function updateActive() {
    const path = location.hash.replace(/^#/, '') || '/admin/events'
    const anchors = sidebar.querySelectorAll('a')
    anchors.forEach((a) => {
      const href = (a as HTMLAnchorElement).getAttribute('href') || '#/admin/events'
      const clean = href.replace(/^#/, '')
      if (path === clean || path.startsWith(clean)) {
        a.classList.add('active')
        a.setAttribute('aria-current', 'page')
      } else {
        a.classList.remove('active')
        a.removeAttribute('aria-current')
      }
    })
  }

  function updateHeaderContext() {
    syncHeaderHeight()
  }

  window.addEventListener('hashchange', updateActive)
  window.addEventListener('popstate', updateActive)
  window.addEventListener('hashchange', updateHeaderContext)
  window.addEventListener('popstate', updateHeaderContext)
  updateActive()
  updateHeaderContext()

  // Keyboard accessibility for sidebar navigation
  // - ArrowUp / ArrowDown to move focus between links
  // - Home / End to jump to first/last
  // - Enter / Space activate the focused link
  sidebar.addEventListener('keydown', (e) => {
    const anchors = Array.from(sidebar.querySelectorAll('a')) as HTMLAnchorElement[]
    if (!anchors.length) return

    const active = document.activeElement as HTMLElement | null
    const idx = anchors.indexOf(active as HTMLAnchorElement)

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        const next = anchors[(idx + 1) % anchors.length]
        next.focus()
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        const prev = anchors[(idx - 1 + anchors.length) % anchors.length]
        prev.focus()
        break
      }
      case 'Home': {
        e.preventDefault()
        anchors[0].focus()
        break
      }
      case 'End': {
        e.preventDefault()
        anchors[anchors.length - 1].focus()
        break
      }
      case 'Enter':
      case ' ': {
        // Space/Enter should activate the link without causing a full reload
        if (idx >= 0) {
          e.preventDefault()
          const href = anchors[idx].getAttribute('href') || '#/admin/events'
          location.hash = href.replace(/^#/, '')
          shell.classList.remove('admin-shell--sidebar-open')
          const t = header.querySelector('.admin-nav-toggle') as HTMLButtonElement | null
          if (t) t.setAttribute('aria-expanded', 'false')
        }
        break
      }
    }
  })

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
    location.hash = '/admin/events'
  } else {
    // If already inside admin namespace, let router handle it
    if (location.hash.replace(/^#/, '').startsWith('/admin')) {
      router.handle(location.hash.replace(/^#/, ''))
    }
  }

  return { router }
}
