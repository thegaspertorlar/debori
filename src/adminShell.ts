import './style.css'
import { Router } from './router'
import { renderAdminDashboard } from './pages/adminDashboard'
import { renderAdmin } from './pages/admin'
import { renderEventCreate } from './pages/eventCreate'
import { renderEventEdit } from './pages/eventEdit'
import { renderEventDetail } from './pages/eventDetail'
import { getSession, logoutSession } from './session'

type AdminShell = {
  router?: Router
}

type AdminHeaderMeta = {
  section: string
  title: string
  subtitle: string
  ctaLabel: string
  ctaHref: string
}

function getAdminHeaderMeta(path: string): AdminHeaderMeta {
  if (path === '/admin/dashboard') {
    return {
      section: 'Overview',
      title: 'Admin dashboard',
      subtitle: 'Track your workspace, review event health, and jump into operational tasks quickly.',
      ctaLabel: 'Create event',
      ctaHref: '#/admin/events/create',
    }
  }

  if (path === '/admin/events') {
    return {
      section: 'Events',
      title: 'Events management',
      subtitle: 'Review drafts, published events, and follow-up work from one streamlined workspace.',
      ctaLabel: 'Create event',
      ctaHref: '#/admin/events/create',
    }
  }

  if (path === '/admin/events/create') {
    return {
      section: 'Editor',
      title: 'Create a new event',
      subtitle: 'Set up the event details, media, and scheduling information before publishing.',
      ctaLabel: 'View events',
      ctaHref: '#/admin/events',
    }
  }

  if (/^\/admin\/events\/[^/]+\/edit$/.test(path)) {
    return {
      section: 'Editor',
      title: 'Edit event',
      subtitle: 'Update event content, timing, and settings without leaving the admin workspace.',
      ctaLabel: 'View event',
      ctaHref: `#${path.replace(/\/edit$/, '')}`,
    }
  }

  if (/^\/admin\/events\/[^/]+$/.test(path)) {
    return {
      section: 'Events',
      title: 'Event details',
      subtitle: 'Check status, capacity, and quick actions for this event from a single header surface.',
      ctaLabel: 'Edit event',
      ctaHref: `#${path}/edit`,
    }
  }

  return {
    section: 'Workspace',
    title: 'Admin workspace',
    subtitle: 'Manage content and keep operational tasks moving without leaving the control center.',
    ctaLabel: 'Go to dashboard',
    ctaHref: '#/admin/dashboard',
  }
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || 'DM'
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
  const managerEmail = session?.user?.email || 'demo@debori.com'
  const initials = getInitials(managerName)

  header.innerHTML = `
    <div class="container app-header-inner">
      <div class="header-left">
        <button class="admin-nav-toggle" type="button" aria-label="Toggle admin navigation" aria-expanded="false">
          <span aria-hidden="true">☰</span>
        </button>
        <a class="brand admin-brand" href="#/admin/dashboard" aria-label="Go to admin dashboard">
          <span class="admin-brand__mark" aria-hidden="true">${initials}</span>
          <span class="admin-brand__text">
            <span class="admin-brand__name">Debori Admin</span>
            <span class="admin-brand__meta">Operations workspace</span>
          </span>
        </a>
        <div class="admin-header-context" aria-live="polite">
          <span class="admin-header-context__eyebrow">Workspace</span>
          <div class="admin-header-context__row">
            <p class="admin-header-context__title">Admin workspace</p>
            <span class="admin-header-context__status">Live</span>
          </div>
          <p class="admin-header-context__subtitle">Manage content and keep operational tasks moving without leaving the control center.</p>
        </div>
      </div>
      <div class="header-actions">
        <a class="btn btn--primary btn--sm admin-header-cta" href="#/admin/events/create" data-link>Create event</a>
        <div class="admin-user-card" aria-label="Signed in manager">
          <div class="admin-user-card__avatar" aria-hidden="true">${initials}</div>
          <div class="admin-user-card__body">
            <span class="admin-user-card__label">Signed in as</span>
            <strong class="admin-user-card__name">${managerName}</strong>
            <span class="admin-user-card__meta">${managerEmail}</span>
          </div>
        </div>
        <button class="btn btn--outline btn--sm admin-signout" type="button">Logout</button>
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

  const signoutBtn = header.querySelector('.admin-signout') as HTMLButtonElement | null
  const contextEyebrow = header.querySelector('.admin-header-context__eyebrow') as HTMLElement | null
  const contextTitle = header.querySelector('.admin-header-context__title') as HTMLElement | null
  const contextSubtitle = header.querySelector('.admin-header-context__subtitle') as HTMLElement | null
  const contextCta = header.querySelector('.admin-header-cta') as HTMLAnchorElement | null
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

  function updateHeaderContext() {
    const path = location.hash.replace(/^#/, '') || '/admin/dashboard'
    const meta = getAdminHeaderMeta(path)
    if (contextEyebrow) contextEyebrow.textContent = meta.section
    if (contextTitle) contextTitle.textContent = meta.title
    if (contextSubtitle) contextSubtitle.textContent = meta.subtitle
    if (contextCta) {
      contextCta.textContent = meta.ctaLabel
      contextCta.setAttribute('href', meta.ctaHref)
      contextCta.setAttribute('aria-label', meta.ctaLabel)
    }
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
