import { authenticate } from '../api/mockApi'
import { demoCredentials } from '../data/seed'
import { loginSession } from '../session'

function statusIcon(state: 'neutral' | 'success' | 'error') {
  if (state === 'success') {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
  }

  if (state === 'error') {
    return `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
        <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`
  }

  return `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`
}

function eyeIcon(visible: boolean) {
  return visible
    ? `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 7l-10 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    : `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/>
      </svg>`
}

export function renderLogin() {
  const el = document.createElement('div')
  el.className = 'page page--public page--login'

  const wrapper = document.createElement('div')
  wrapper.className = 'auth-shell container'

  const panel = document.createElement('section')
  panel.className = 'auth-panel auth-panel--single'

  const card = document.createElement('section')
  card.className = 'card card--compact auth-card'
  card.setAttribute('role', 'region')
  card.setAttribute('aria-labelledby', 'signin-heading')
  card.innerHTML = `
    <div class="auth-card__topline">
      <span class="auth-card__live-dot" aria-hidden="true"></span>
      <span>Sign in</span>
    </div>
    <h2 id="signin-heading" class="auth-card__title">Welcome back</h2>
    <p class="auth-card__sub">Login credentials are enough to enter the workspace.</p>
  `

  const creds = document.createElement('div')
  creds.className = 'login-credentials'
  creds.innerHTML = `
    <div class="login-credentials__top">
      <div>
        <div class="form-section__title">Demo credentials</div>
        <p class="login-credentials__copy">Use these details or tap the button to fill the form instantly.</p>
      </div>
      <button type="button" class="btn btn--secondary btn--sm auth-fill-btn">Use credentials</button>
    </div>
    <div class="login-credentials__grid" aria-label="Demo credentials">
      <div class="login-credential-row">
        <span class="login-credential-row__label">Email</span>
        <span class="login-credential-row__value">${demoCredentials.email}</span>
      </div>
      <div class="login-credential-row">
        <span class="login-credential-row__label">Password</span>
        <span class="login-credential-row__value">${demoCredentials.password}</span>
      </div>
    </div>
  `

  const form = document.createElement('form')
  form.id = 'demo-login'
  form.className = 'form auth-form'
  form.autocomplete = 'on'
  form.noValidate = true
  form.setAttribute('aria-describedby', 'login-error')

  const fieldsSection = document.createElement('div')
  fieldsSection.className = 'form-section auth-form__fields'

  const emailField = document.createElement('div')
  emailField.className = 'form-field'
  emailField.innerHTML = `
    <label class="form-label" for="email">Email address</label>
    <div class="input-with-actions auth-input-wrap">
      <input id="email" class="input" name="email" type="email" placeholder="name@company.com" value="${demoCredentials.email}" autocomplete="username" required aria-label="Email address" />
      <div class="input-actions">
        <span class="input-action input-action--status" aria-hidden="true">${statusIcon('success')}</span>
      </div>
    </div>
    <p class="helper-text auth-field-hint">Recommended: use the prefilled demo account for the smoothest preview.</p>
  `

  const passField = document.createElement('div')
  passField.className = 'form-field'
  passField.innerHTML = `
    <label class="form-label" for="password">Password</label>
    <div class="input-with-actions auth-input-wrap">
      <input id="password" class="input" name="password" type="password" value="${demoCredentials.password}" autocomplete="current-password" required aria-label="Password" />
      <div class="input-actions">
        <span class="input-action input-action--status" aria-hidden="true">${statusIcon('success')}</span>
        <button type="button" class="input-action input-action--toggle" aria-pressed="false" aria-label="Show password">${eyeIcon(false)}</button>
      </div>
    </div>
    <div class="auth-form__meta">
      <label class="auth-check">
        <input type="checkbox" id="remember-demo" checked />
        <span>Keep this local demo session active</span>
      </label>
      <span class="auth-form__meta-note">No external sync</span>
    </div>
  `

  const actions = document.createElement('div')
  actions.className = 'actions auth-actions'
  actions.innerHTML = `
    <button class="btn btn--primary" type="submit" aria-label="Enter workspace">
      <span class="btn__label">Enter workspace</span>
    </button>
  `

  const trust = document.createElement('div')
  trust.className = 'auth-trust'
  trust.innerHTML = `
    <span class="auth-trust__item">Local demo only</span>
    <span class="auth-trust__item">No setup needed</span>
    <span class="auth-trust__item">Instant manager access</span>
  `

  const footer = document.createElement('div')
  footer.className = 'auth-form__footer'
  footer.innerHTML = `
    <p class="auth-form__footer-note">Fresh design, same working login flow.</p>
  `

  const errorEl = document.createElement('div')
  errorEl.id = 'login-error'
  errorEl.className = 'error-text login-error'
  errorEl.setAttribute('role', 'alert')
  errorEl.style.display = 'none'

  fieldsSection.appendChild(emailField)
  fieldsSection.appendChild(passField)
  form.appendChild(fieldsSection)
  form.appendChild(actions)
  form.appendChild(trust)
  form.appendChild(errorEl)
  form.appendChild(footer)

  card.appendChild(creds)
  card.appendChild(form)

  panel.appendChild(card)
  wrapper.appendChild(panel)
  el.appendChild(wrapper)

  const emailInput = emailField.querySelector('#email') as HTMLInputElement
  const passInput = passField.querySelector('#password') as HTMLInputElement
  const emailStatus = emailField.querySelector('.input-action--status') as HTMLSpanElement
  const passStatus = passField.querySelector('.input-action--status') as HTMLSpanElement
  const toggleBtn = passField.querySelector('.input-action--toggle') as HTMLButtonElement
  const submit = actions.querySelector('.btn--primary') as HTMLButtonElement
  const fillBtn = creds.querySelector('.auth-fill-btn') as HTMLButtonElement

  emailInput.autofocus = true

  function clearErrorState() {
    errorEl.style.display = 'none'
    errorEl.textContent = ''
    emailField.classList.remove('has-error')
    passField.classList.remove('has-error')
  }

  function setFieldStatus(field: HTMLElement, statusEl: HTMLElement, hasValue: boolean) {
    if (field.classList.contains('has-error')) {
      statusEl.innerHTML = statusIcon('error')
      statusEl.classList.add('is-error')
      statusEl.classList.remove('is-success')
      return
    }

    statusEl.innerHTML = statusIcon(hasValue ? 'success' : 'neutral')
    statusEl.classList.toggle('is-success', hasValue)
    statusEl.classList.remove('is-error')
  }

  function updateFieldStatuses() {
    setFieldStatus(emailField, emailStatus, Boolean(emailInput.value.trim()))
    setFieldStatus(passField, passStatus, Boolean(passInput.value.trim()))
  }

  function applyDemoCredentials() {
    emailInput.value = demoCredentials.email
    passInput.value = demoCredentials.password
    clearErrorState()
    updateFieldStatuses()
    emailInput.focus()
    emailInput.select()
  }

  function setPasswordVisibility(visible: boolean) {
    passInput.type = visible ? 'text' : 'password'
    toggleBtn.setAttribute('aria-pressed', visible ? 'true' : 'false')
    toggleBtn.setAttribute('aria-label', visible ? 'Hide password' : 'Show password')
    toggleBtn.innerHTML = eyeIcon(visible)
  }

  const fieldObserver = new MutationObserver(updateFieldStatuses)
  fieldObserver.observe(emailField, { attributes: true, attributeFilter: ['class'] })
  fieldObserver.observe(passField, { attributes: true, attributeFilter: ['class'] })

  emailInput.addEventListener('input', () => {
    emailField.classList.remove('has-error')
    if (errorEl.style.display === 'block') errorEl.style.display = 'none'
    updateFieldStatuses()
  })

  passInput.addEventListener('input', () => {
    passField.classList.remove('has-error')
    if (errorEl.style.display === 'block') errorEl.style.display = 'none'
    updateFieldStatuses()
  })

  toggleBtn.addEventListener('click', () => {
    setPasswordVisibility(toggleBtn.getAttribute('aria-pressed') !== 'true')
    passInput.focus()
  })

  fillBtn.addEventListener('click', applyDemoCredentials)

  updateFieldStatuses()

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    ;(async () => {
      clearErrorState()
      updateFieldStatuses()

      const email = emailInput.value.trim()
      const password = passInput.value

      submit.disabled = true
      submit.classList.add('is-submitting')

      const label = submit.querySelector('.btn__label') as HTMLElement
      const previous = label.textContent || 'Enter workspace'
      const spinner = document.createElement('span')
      spinner.className = 'spinner spinner--sm btn__spinner'
      spinner.setAttribute('aria-hidden', 'true')
      label.textContent = 'Signing you in…'
      submit.prepend(spinner)

      const res = await authenticate(email, password)

      submit.disabled = false
      submit.classList.remove('is-submitting')
      submit.querySelector('.btn__spinner')?.remove()
      label.textContent = previous

      if (!res.ok) {
        errorEl.textContent = res.message || 'Sign-in failed'
        errorEl.style.display = 'block'

        if (res.errors?.password) {
          passField.classList.add('has-error')
          passInput.focus()
        } else {
          emailField.classList.add('has-error')
          emailInput.focus()
        }

        updateFieldStatuses()
        return
      }

      const ok = loginSession(res.data.user, res.data.token)
      if (ok) {
        location.hash = '/admin/events'
        return
      }

      errorEl.textContent = 'Manager access is restricted to the demo workspace account.'
      errorEl.style.display = 'block'
    })()
  })

  return el
}
