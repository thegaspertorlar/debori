import { createEmptyCard } from '../uiStates'

export function renderAdminDashboard() {
  const el = document.createElement('div')
  el.className = 'page'

  el.innerHTML = `
    <div class="page-title">
      <div class="row row--md justify-between">
        <div class="events-page__title">
          <h1>Dashboard</h1>
          <p class="muted">This is the admin dashboard landing page. Dashboard content and widgets are not yet implemented.</p>
        </div>
      </div>
    </div>

    <div id="admin-dashboard-placeholder" class="card" style="min-height:160px; display:flex; align-items:center; justify-content:center;">
      <!-- Intentionally empty placeholder state for future widgets -->
    </div>
  `

  const placeholder = el.querySelector('#admin-dashboard-placeholder') as HTMLElement
  // Use the shared empty-state UI to provide a clear affordance and CTA
  placeholder.appendChild(createEmptyCard('Dashboard coming soon', 'Dashboard widgets and analytics will appear here once implemented.'))

  return el
}
