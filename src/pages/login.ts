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
  title.className = 'page-title page-title--welcome'
  const h1 = document.createElement('h1')
  // Provide a warm, product-focused welcome state rather than an internal manager label
  h1.id = 'signin-heading'
  h1.textContent = 'Welcome to DEBORI!'
  const hint = document.createElement('p')
  hint.className = 'muted page-title__sub'
  hint.textContent = 'Sign in to continue to your workspace. A demo account is provided for exploration.'
  title.appendChild(h1)
  title.appendChild(hint)

  const card = document.createElement('div')
  card.className = 'card card--compact'
  card.setAttribute('role', 'region')
  card.setAttribute('aria-labelledby', 'signin-heading')

  // Use clear form sections to enforce consistent vertical rhythm
  const cardInner = document.createElement('div')
  cardInner.className = 'card__inner'

  // credentials hint (visible, subtle) — keep demo credentials plainly visible and labelled
  const creds = document.createElement('div')
  creds.className = 'login-credentials form-section'
  creds.innerHTML = `
    <div class="form-section__title muted text-sm">Demo account — use these credentials to sign in</div>
    <div class="row row--sm" style="flex-direction:column; gap:6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; font-size:13px; margin-top:6px;">
      <div><span class="muted" style="margin-right:8px; font-size:13px;">Email</span><span class="badge" aria-label="demo email">${demoCredentials.email}</span></div>
      <div><span class="muted" style="margin-right:8px; font-size:13px;">Password</span><span class="badge" aria-label="demo password">${demoCredentials.password}</span></div>
    </div>`

  const form = document.createElement('form')
  form.id = 'demo-login'
  form.className = 'form'
  form.autocomplete = 'off'
  form.setAttribute('aria-describedby', 'login-error')

  // Email field: single-line outlined input with right-aligned
  // non-interactive status icon slot. We keep a programmatic label
  // for accessibility but visually hide it so the control appears as
  // a single-line input with placeholder text.
  const emailField = document.createElement('div')
  emailField.className = 'form-field'
  const emailLabel = document.createElement('label')
  emailLabel.className = 'form-label visually-hidden'
  emailLabel.htmlFor = 'email'
  emailLabel.textContent = 'Email'

  const emailWrap = document.createElement('div')
  emailWrap.className = 'input-with-actions'

  const emailInput = document.createElement('input')
  emailInput.id = 'email'
  emailInput.className = 'input'
  emailInput.name = 'email'
  emailInput.type = 'email'
  emailInput.placeholder = 'Email'
  // keep demo value prefilled for the demo account; placeholder still present when empty
  emailInput.value = demoCredentials.email
  emailInput.autofocus = true
  emailInput.required = true
  emailInput.setAttribute('aria-label', 'Email')

  // Status icon slot on the right (non-interactive). This keeps a fixed
  // action area so the input does not shift between states.
  const emailStatus = document.createElement('span')
  emailStatus.className = 'input-action input-action--status'
  emailStatus.setAttribute('aria-hidden', 'true')
  emailStatus.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon icon--neutral" aria-hidden="true">
      <path d="M12 2v20M2 12h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`

  // Assemble email field: hidden label (for screen readers), input wrapper,
  // and the fixed action area for status.
  emailWrap.appendChild(emailInput)
  const emailActionsWrap = document.createElement('div')
  emailActionsWrap.className = 'input-actions'
  emailActionsWrap.appendChild(emailStatus)
  emailWrap.appendChild(emailActionsWrap)

  emailField.appendChild(emailLabel)
  emailField.appendChild(emailWrap)

  // Update the email status icon depending on state: error, filled, or neutral
  function updateEmailStatus() {
    if (!emailStatus) return
    if (emailField.classList.contains('has-error')) {
      emailStatus.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon icon--error" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>
          <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>`
      emailStatus.classList.add('is-error')
      emailStatus.classList.remove('is-success')
    } else if (emailInput.value && emailInput.value.length > 0) {
      emailStatus.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon icon--success" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      emailStatus.classList.remove('is-error')
      emailStatus.classList.add('is-success')
    } else {
      emailStatus.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon icon--neutral" aria-hidden="true">
          <path d="M12 2v20M2 12h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      emailStatus.classList.remove('is-error')
      emailStatus.classList.remove('is-success')
    }
  }

  emailInput.addEventListener('input', updateEmailStatus)
  const emailObs = new MutationObserver(updateEmailStatus)
  emailObs.observe(emailField, { attributes: true, attributeFilter: ['class'] })
  updateEmailStatus()

  const passField = document.createElement('div')
  passField.className = 'form-field'
  const passLabel = document.createElement('label')
  passLabel.className = 'form-label'
  passLabel.htmlFor = 'password'
  passLabel.textContent = 'Password'

  // Build an input-with-actions control so the password input visually
  // matches the email field while providing two stable right-side
  // affordances: a non-interactive status/utility icon and an eye toggle
  // button to show/hide the password. The action area has fixed width so
  // icon alignment remains stable across states.
  const inputWrap = document.createElement('div')
  inputWrap.className = 'input-with-actions'

  const passInput = document.createElement('input')
  passInput.id = 'password'
  passInput.className = 'input'
  passInput.name = 'password'
  passInput.type = 'password'
  passInput.value = demoCredentials.password
  passInput.required = true
  passInput.setAttribute('aria-label', 'Password')

  // Non-interactive status icon (reflects neutral/valid/error states)
  const statusIcon = document.createElement('span')
  statusIcon.className = 'input-action input-action--status'
  statusIcon.setAttribute('aria-hidden', 'true')
  statusIcon.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon icon--neutral" aria-hidden="true">
      <path d="M12 2v20M2 12h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`

  // Show/hide toggle button (keyboard accessible)
  const toggleBtn = document.createElement('button')
  toggleBtn.type = 'button'
  toggleBtn.className = 'input-action input-action--toggle'
  toggleBtn.setAttribute('aria-pressed', 'false')
  toggleBtn.setAttribute('aria-label', 'Show password')
  toggleBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon icon--eye" aria-hidden="true">
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
    </svg>`

  // Assemble wrapper: label, input wrapper (input + actions)
  inputWrap.appendChild(passInput)
  const actionsWrap = document.createElement('div')
  actionsWrap.className = 'input-actions'
  actionsWrap.appendChild(statusIcon)
  actionsWrap.appendChild(toggleBtn)
  inputWrap.appendChild(actionsWrap)

  passField.appendChild(passLabel)
  passField.appendChild(inputWrap)

  // Toggle behavior: swap input type and update accessible attributes/icons
  function setVisible(visible: boolean) {
    passInput.type = visible ? 'text' : 'password'
    toggleBtn.setAttribute('aria-pressed', visible ? 'true' : 'false')
    toggleBtn.setAttribute('aria-label', visible ? 'Hide password' : 'Show password')
    // Replace eye icon to reflect state while preserving layout
    toggleBtn.innerHTML = visible ? `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon icon--eye-open" aria-hidden="true">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 7l-10 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>` : `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon icon--eye-closed" aria-hidden="true">
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 3l18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
  }

  toggleBtn.addEventListener('click', () => {
    setVisible(toggleBtn.getAttribute('aria-pressed') === 'true' ? false : true)
    // Keep focus on the input after toggling for smoother keyboard flow
    passInput.focus()
  })

  // Keyboard: allow Enter/Space to toggle when toggleBtn is focused (native button covers this)

  // Update status icon based on field state: error, non-empty (success), or neutral
  function updateStatus() {
    const svg = statusIcon.querySelector('svg') as SVGElement
    if (passField.classList.contains('has-error')) {
      statusIcon.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon icon--error" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>
          <path d="M9.5 9.5l5 5M14.5 9.5l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>`
      statusIcon.classList.add('is-error')
      statusIcon.classList.remove('is-success')
    } else if (passInput.value && passInput.value.length > 0) {
      statusIcon.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon icon--success" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      statusIcon.classList.remove('is-error')
      statusIcon.classList.add('is-success')
    } else {
      // neutral
      statusIcon.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="icon icon--neutral" aria-hidden="true">
          <path d="M12 2v20M2 12h20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      statusIcon.classList.remove('is-error')
      statusIcon.classList.remove('is-success')
    }
  }

  // Keep status in sync when input changes or field classes change
  passInput.addEventListener('input', updateStatus)
  // when errors are applied externally (e.g. after auth), update status
  const obs = new MutationObserver(updateStatus)
  obs.observe(passField, { attributes: true, attributeFilter: ['class'] })

  // initialize
  updateStatus()

  const actions = document.createElement('div')
  actions.className = 'actions'
  const submit = document.createElement('button')
  submit.className = 'btn btn--primary'
  submit.type = 'submit'
  // Use a stable label for the primary authentication CTA and keep an
  // accessible label in sync. The visual label is wrapped so we can
  // prepend a spinner during the submitting state without disturbing
  // other elements.
  submit.innerHTML = `<span class="btn__label">Login</span>`
  submit.setAttribute('aria-label', 'Login')
  actions.appendChild(submit)

  const errorEl = document.createElement('div')
  errorEl.id = 'login-error'
  errorEl.className = 'error-text login-error'
  errorEl.setAttribute('role', 'alert')
  errorEl.classList.add('mt-2')
  errorEl.style.display = 'none'

  // Structure form into logical sections for consistent vertical rhythm
  const credsSection = creds
  credsSection.classList.add('form-section')

  const fieldsSection = document.createElement('div')
  fieldsSection.className = 'form-section'
  fieldsSection.appendChild(emailField)
  fieldsSection.appendChild(passField)

  form.appendChild(fieldsSection)
  form.appendChild(actions)
  form.appendChild(errorEl)

  cardInner.appendChild(credsSection)
  cardInner.appendChild(form)
  card.appendChild(cardInner)

  wrapper.appendChild(title)
  wrapper.appendChild(card)
  el.appendChild(wrapper)



  form.addEventListener('submit', (e) => {
    e.preventDefault()
    ;(async () => {
      const email = (form.querySelector('#email') as HTMLInputElement).value
      const password = (form.querySelector('#password') as HTMLInputElement).value
      // entering submitting state: visually show spinner and a clear
      // submitting label while keeping the button structure intact
      submit.disabled = true
      const label = submit.querySelector('.btn__label') as HTMLElement
      const previous = label ? label.textContent : submit.textContent
      // add modest loading affordance
      submit.classList.add('is-submitting')
      const spinner = document.createElement('span')
      spinner.className = 'spinner spinner--sm btn__spinner'
      spinner.setAttribute('aria-hidden', 'true')
      if (label) label.textContent = 'Logging in…'
      // ensure spinner is visible before the label
      submit.prepend(spinner)
      // clear previous error state
      errorEl.style.display = 'none'
      form.classList.remove('has-error')

      const res = await authenticate(email, password)

      // exit submitting state
      submit.disabled = false
      submit.classList.remove('is-submitting')
      const btnSpinner = submit.querySelector('.btn__spinner')
      if (btnSpinner) btnSpinner.remove()
      const labelEnd = submit.querySelector('.btn__label') as HTMLElement
      if (labelEnd) labelEnd.textContent = previous as string

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
        if (ok) location.hash = '/admin/dashboard'
        else {
          errorEl.textContent = 'Manager access restricted to demo account'
          errorEl.style.display = 'block'
        }
      }
    })()
  })

  return el
}
