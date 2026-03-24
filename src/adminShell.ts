import './style.css'
import { Router } from './router'
import { renderAdmin } from './pages/admin'
import { renderEventsList } from './pages/eventsList'
import { logoutSession } from './session'

type AdminShell = {
  router?: Router
}

// Create a distinct admin shell that lives at /admin/* and renders
// a dedicated admin header + workspace. This shell intentionally
// does not render the public site header or navigation so the UX
// behaves like a subdomain while remaining frontend-only.

export function createAdminShell(container: HTMLElement) {
  container.innerHTML = ''

  const header = document.createElement('header')
  header.className = 'app-header app-header--admin admin-shell__header'
  header.innerHTML = `
    <div class="container app-header-inner">
      <div class="header-left">
        <a class="brand" href="#/home">Debori</a>
        <a class="return-public" href="#/home" aria-label="Return to public site">Return to public site</a>
      </div>
      <nav class="admin-nav" aria-label="Admin navigation">
        <a href="#/admin/dashboard" data-link>Dashboard</a>
        <a href="#/admin/events" data-link>Events</a>
      </nav>
      <div class="nav-auth">
        <a class="logout-link btn btn--outline btn--sm" href="#/home">Sign out</a>
      </div>
    </div>
  `

  const main = document.createElement('main')
  main.className = 'admin-main container'

  container.appendChild(header)
  container.appendChild(main)

  // Wire sign out
  const out = header.querySelector('.logout-link') as HTMLElement | null
  if (out) {
    out.addEventListener('click', (e) => {
      e.preventDefault()
      logoutSession()
      // After sign out return to public home
      location.hash = '/home'
    })
  }

  // Admin routes are always protected. The router will redirect to
  // /login for unauthenticated users.
  const routes = [
    { path: '/admin', render: () => { location.hash = '/admin/dashboard'; const d = document.createElement('div'); return d }, protected: true },
    { path: '/admin/dashboard', render: renderAdmin, protected: true },
    { path: '/admin/events', render: renderEventsList, protected: true },
  ]

  const router = new Router(routes as any, main)

  return { router }
}
