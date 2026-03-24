import './style.css'
import { Router } from './router'
import { renderAdminDashboard } from './pages/adminDashboard'
import { renderAdmin } from './pages/admin'
import { renderEventCreate } from './pages/eventCreate'
import { renderEventEdit } from './pages/eventEdit'
import { renderEventDetail } from './pages/eventDetail'
import { logoutSession, getSession } from './session'

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
  // Account trigger: avatar + chevron, reveals a small account menu with Sign out
  const session = getSession()
  const avatarSrc = (session && session.user && session.user.avatar) || `https://picsum.photos/seed/manager/32/32`

  header.innerHTML = `
    <div class="container app-header-inner">
      <div class="header-left">
        <button class="admin-nav-toggle" aria-label="Toggle admin navigation" aria-expanded="false">☰</button>
        <a class="brand" href="#/admin/dashboard">Debori</a>
        <a class="return-public" href="#/home" aria-label="Return to public site">Return to public site</a>
      </div>
      <div class="header-actions" style="margin-left:auto">
        <div class="account" data-account>
          <button id="account-trigger" class="account-trigger" aria-haspopup="true" aria-expanded="false" aria-controls="account-menu">
            <img class="avatar avatar--sm" src="${avatarSrc}" alt="Account">
            <span class="chevron" aria-hidden="true">▾</span>
          </button>
          <div id="account-menu" class="account-menu" role="menu" aria-labelledby="account-trigger" hidden>
            <div class="account-menu__profile" role="presentation">
              <div class="account-menu__name">${(session && session.user && (session.user.name || session.user.email)) || 'Manager'}</div>
            </div>
            <div class="account-menu__actions">
              <button class="btn btn--ghost btn--sm account-signout" role="menuitem">Sign out</button>
            </div>
          </div>
        </div>
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
      <a href="#/admin/dashboard" data-link role="link">Dashboard</a>
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

  // Account menu: wire trigger, accessible keyboard behavior, outside click and Escape to close
  const account = header.querySelector('[data-account]') as HTMLElement | null
  const trigger = header.querySelector('.account-trigger') as HTMLButtonElement | null
  const menu = header.querySelector('.account-menu') as HTMLElement | null
  const signoutBtn = header.querySelector('.account-signout') as HTMLButtonElement | null

  let menuOpen = false
  let outsideListener: ((e: Event) => void) | null = null
  let keyListener: ((e: KeyboardEvent) => void) | null = null

  function openMenu() {
    if (!menu || !trigger) return
    menuOpen = true
    menu.hidden = false
    trigger.setAttribute('aria-expanded', 'true')
    // focus first actionable item
    const first = menu.querySelector<HTMLElement>('[role="menuitem"]')
    setTimeout(() => { try { first?.focus() } catch (e) {} }, 0)

    // outside click closes menu
    outsideListener = (ev: Event) => {
      const t = ev.target as Node | null
      if (!t) return
      if (account && !account.contains(t)) closeMenu()
    }
    document.addEventListener('click', outsideListener)

    // global key handling: Escape to close, Arrow navigation between menuitems
    keyListener = (ev: KeyboardEvent) => {
      if (!menuOpen) return
      if (ev.key === 'Escape') {
        ev.preventDefault()
        closeMenu()
        return
      }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault()
        const items = Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]'))
        if (!items.length) return
        const idx = items.indexOf(document.activeElement as HTMLElement)
        let next = 0
        if (ev.key === 'ArrowDown') next = (idx + 1) % items.length
        else next = (idx - 1 + items.length) % items.length
        items[next].focus()
      }
    }
    document.addEventListener('keydown', keyListener as any)
  }

  function closeMenu() {
    if (!menu || !trigger) return
    menuOpen = false
    menu.hidden = true
    trigger.setAttribute('aria-expanded', 'false')
    try { trigger.focus() } catch (e) {}
    if (outsideListener) document.removeEventListener('click', outsideListener)
    if (keyListener) document.removeEventListener('keydown', keyListener as any)
    outsideListener = null
    keyListener = null
  }

  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault()
      if (menuOpen) closeMenu(); else openMenu()
    })
    // support Enter/Space to open
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (menuOpen) closeMenu(); else openMenu()
      }
    })
  }

  if (signoutBtn) {
    signoutBtn.addEventListener('click', (e) => {
      e.preventDefault()
      closeMenu()
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
    { path: '/admin/dashboard', render: renderAdminDashboard, protected: true },
    // Admin-scoped event management routes
    { path: '/admin/events', render: renderAdmin, protected: true },
    { path: '/admin/events/create', render: renderEventCreate, protected: true },
    { path: '/admin/events/:id', render: renderEventDetail, protected: true },
    { path: '/admin/events/:id/edit', render: renderEventEdit, protected: true },
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
          const href = anchors[idx].getAttribute('href') || '#/admin/dashboard'
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
    location.hash = '/admin/dashboard'
  } else {
    // If already inside admin namespace, let router handle it
    if (location.hash.replace(/^#/, '').startsWith('/admin')) {
      router.handle(location.hash.replace(/^#/, ''))
    }
  }

  return { router }
}
