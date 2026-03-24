import { demoCredentials } from '../data/seed'
import { authenticate } from '../api/mockApi'

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
    ;(async () => {
      const email = (form.querySelector('#email') as HTMLInputElement).value
      const password = (form.querySelector('#password') as HTMLInputElement).value
      const submit = form.querySelector('button[type=submit]') as HTMLButtonElement
      submit.disabled = true
      submit.textContent = 'Signing in…'
      const res = await authenticate(email, password)
      submit.disabled = false
      submit.textContent = 'Sign in'
      if (!res.ok) {
        const err = document.createElement('div')
        err.className = 'muted'
        err.style.color = '#a33'
        err.style.marginTop = '8px'
        err.textContent = res.message || 'Sign-in failed'
        const existing = el.querySelector('.login-error')
        if (existing) existing.remove()
        err.classList.add('login-error')
        form.appendChild(err)
        return
      }
      // on success navigate to admin
      location.hash = '/admin'
    })()
  })

  return el
}
