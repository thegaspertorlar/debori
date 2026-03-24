import { demoCredentials } from '../data/seed'
import { authenticate } from '../api/mockApi'
import { loginSession } from '../session'

export function renderLogin() {
  const el = document.createElement('div')
  el.className = 'page page--public page--login'

  // Build content programmatically for better accessibility control
  const wrapper = document.createElement('div')
  wrapper.className = 'auth-wrapper container'

  const title = document.createElement('div')
  title.className = 'page-title'
  const h1 = document.createElement('h1')
  h1.textContent = 'Manager sign in'
  const hint = document.createElement('p')
  hint.className = 'muted'
  hint.textContent = 'Sign in to access admin controls. A demo account is provided for exploration.'
  title.appendChild(h1)
  title.appendChild(hint)

  const card = document.createElement('div')
  card.className = 'card card--compact'
  card.setAttribute('role', 'region')
  card.setAttribute('aria-labelledby', 'signin-heading')

  // credentials hint (visible, subtle)
  const creds = document.createElement('div')
  creds.className = 'login-credentials'
  creds.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
      <div>
        <div class="muted" style="font-size:13px; margin-bottom:6px;">Demo credentials</div>
        <div style="display:flex; gap:8px; align-items:center; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; font-size:13px;">
          <span class="badge">${demoCredentials.email}</span>
          <span class="badge">${demoCredentials.password}</span>
        </div>
      </div>
      <div style="min-width:120px; text-align:right;">
        <button type="button" class="btn btn--outline" id="copy-creds">Copy</button>
      </div>
    </div>`

  const form = document.createElement('form')
  form.id = 'demo-login'
  form.className = 'form'
  form.autocomplete = 'off'
  form.setAttribute('aria-describedby', 'login-error')

  const emailField = document.createElement('div')
  emailField.className = 'form-field'
  const emailLabel = document.createElement('label')
  emailLabel.className = 'form-label'
  emailLabel.htmlFor = 'email'
  emailLabel.textContent = 'Email'
  const emailInput = document.createElement('input')
  emailInput.id = 'email'
  emailInput.className = 'input'
  emailInput.name = 'email'
  emailInput.type = 'email'
  emailInput.value = demoCredentials.email
  emailInput.autofocus = true
  emailInput.required = true
  emailField.appendChild(emailLabel)
  emailField.appendChild(emailInput)

  const passField = document.createElement('div')
  passField.className = 'form-field'
  const passLabel = document.createElement('label')
  passLabel.className = 'form-label'
  passLabel.htmlFor = 'password'
  passLabel.textContent = 'Password'
  const passInput = document.createElement('input')
  passInput.id = 'password'
  passInput.className = 'input'
  passInput.name = 'password'
  passInput.type = 'password'
  passInput.value = demoCredentials.password
  passInput.required = true
  passField.appendChild(passLabel)
  passField.appendChild(passInput)

  const actions = document.createElement('div')
  actions.style.display = 'flex'
  actions.style.gap = '8px'
  actions.style.marginTop = '12px'
  const submit = document.createElement('button')
  submit.className = 'btn btn--primary'
  submit.type = 'submit'
  submit.textContent = 'Sign in'
  const guest = document.createElement('a')
  guest.href = '#/events'
  guest.className = 'btn btn--ghost'
  guest.textContent = 'Continue as guest'
  actions.appendChild(submit)
  actions.appendChild(guest)

  const errorEl = document.createElement('div')
  errorEl.id = 'login-error'
  errorEl.className = 'error-text login-error'
  errorEl.setAttribute('role', 'alert')
  errorEl.style.marginTop = '8px'
  errorEl.style.display = 'none'

  form.appendChild(emailField)
  form.appendChild(passField)
  form.appendChild(actions)
  form.appendChild(errorEl)

  card.appendChild(creds)
  card.appendChild(form)

  wrapper.appendChild(title)
  wrapper.appendChild(card)
  el.appendChild(wrapper)

  // copy credentials button
  const copyBtn = card.querySelector('#copy-creds') as HTMLButtonElement
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(`${demoCredentials.email}\t${demoCredentials.password}`)
      copyBtn.textContent = 'Copied'
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1800)
    } catch (err) {
      copyBtn.textContent = 'Copy failed'
      setTimeout(() => (copyBtn.textContent = 'Copy'), 1800)
    }
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    ;(async () => {
      const email = (form.querySelector('#email') as HTMLInputElement).value
      const password = (form.querySelector('#password') as HTMLInputElement).value
      submit.disabled = true
      const previous = submit.textContent
      submit.textContent = 'Signing in…'
      // clear previous error state
      errorEl.style.display = 'none'
      form.classList.remove('has-error')

      const res = await authenticate(email, password)

      submit.disabled = false
      submit.textContent = previous as string

      if (!res.ok) {
        errorEl.textContent = res.message || 'Sign-in failed'
        errorEl.style.display = 'block'
        // mark fields as error when password invalid
        if (res.errors && res.errors.password) {
          passField.classList.add('has-error')
          passInput.focus()
        } else {
          // focus on email if user not found
          emailField.classList.add('has-error')
          emailInput.focus()
        }
        return
      }

      // on success create a transient in-memory session and navigate to admin
      if (res.ok) {
        const ok = loginSession(res.data.user, res.data.token)
        if (ok) location.hash = '/admin'
        else {
          errorEl.textContent = 'Manager access restricted to demo account'
          errorEl.style.display = 'block'
        }
      }
    })()
  })

  return el
}
