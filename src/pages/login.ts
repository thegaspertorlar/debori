import { demoCredentials } from '../data/seed'

export function renderLogin() {
  const el = document.createElement('div')
  el.className = 'page'
  el.innerHTML = `
    <div class="page-title">
      <h1>Sign in</h1>
      <p class="muted">Use the demo credentials to sign in for admin flows.</p>
    </div>
    <div class="card">
      <form id="demo-login" class="form" autocomplete="off">
        <div class="form-field">
          <label class="form-label" for="email">Email</label>
          <input id="email" class="input" name="email" value="${demoCredentials.email}" />
        </div>
        <div class="form-field">
          <label class="form-label" for="password">Password</label>
          <input id="password" class="input" name="password" type="password" value="${demoCredentials.password}" />
        </div>
        <div style="margin-top:12px; display:flex; gap:8px;">
          <button class="btn btn--primary" type="submit">Sign in</button>
          <a href="#/events" class="btn btn--ghost">Continue as guest</a>
        </div>
      </form>
    </div>
  `

  const form = el.querySelector('#demo-login') as HTMLFormElement
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    // Simple demo: navigate to admin on "successful" sign-in
    location.hash = '/admin'
  })

  return el
}
