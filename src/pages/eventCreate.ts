import { createEvent } from '../api/mockApi'
import { EventStatus } from '../models'

const MAX_HERO_IMAGE_BYTES = 10 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/svg+xml']

function combineDateAndTime(dateValue: string, timeValue: string) {
  if (!dateValue && !timeValue) return undefined
  if (!dateValue || !timeValue) return null
  const isoCandidate = `${dateValue}T${timeValue}`
  const date = new Date(isoCandidate)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

function sanitizeHtml(html: string) {
  const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'UL', 'OL', 'LI', 'A', 'P', 'BR', 'H3', 'BLOCKQUOTE'])
  const doc = document.createElement('div')
  doc.innerHTML = html || ''

  function walk(node: Node) {
    const toRemove: Node[] = []

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement
        const tag = element.tagName.toUpperCase()

        if (!allowed.has(tag)) {
          while (element.firstChild) node.insertBefore(element.firstChild, element)
          toRemove.push(element)
          return
        }

        if (tag === 'A') {
          const href = element.getAttribute('href') || ''
          if (!/^https?:\/\//i.test(href) && !/^mailto:/i.test(href)) {
            element.removeAttribute('href')
          } else {
            element.setAttribute('rel', 'noopener noreferrer')
            element.setAttribute('target', '_blank')
          }
          Array.from(element.attributes).forEach((attribute) => {
            if (attribute.name !== 'href' && attribute.name !== 'rel' && attribute.name !== 'target') {
              element.removeAttribute(attribute.name)
            }
          })
        } else {
          Array.from(element.attributes).forEach((attribute) => element.removeAttribute(attribute.name))
        }

        walk(element)
        return
      }

      if (child.nodeType !== Node.TEXT_NODE) toRemove.push(child)
    })

    toRemove.forEach((entry) => entry.parentNode?.removeChild(entry))
  }

  walk(doc)
  return doc.innerHTML.trim()
}

function stripHtml(html: string) {
  const doc = document.createElement('div')
  doc.innerHTML = html || ''
  return (doc.textContent || doc.innerText || '').replace(/\s+/g, ' ').trim()
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

function formatPreviewSchedule(startDate: string, startTime: string, endDate: string, endTime: string) {
  if (!startDate && !startTime && !endDate && !endTime) return 'Schedule will appear here'
  if (!startDate || !startTime) return 'Add a start date and time'

  const start = new Date(`${startDate}T${startTime}`)
  if (Number.isNaN(start.getTime())) return 'Add a valid schedule'

  const startLabel = start.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })

  if (!endDate || !endTime) return startLabel

  const end = new Date(`${endDate}T${endTime}`)
  if (Number.isNaN(end.getTime())) return startLabel

  if (start.toDateString() === end.toDateString()) {
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • ${start.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })} – ${end.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' })}`
  }

  return `${startLabel} – ${end.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  })}`
}

function formatPriceLabel(ticketType: 'free' | 'paid', amount: string) {
  if (ticketType === 'free') return 'Free event'
  const numeric = Number.parseFloat(amount)
  if (!Number.isFinite(numeric) || numeric <= 0) return 'Paid event'
  return `From ${numeric.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}`
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read selected file'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
}

export function renderEventCreate() {
  const el = document.createElement('div')
  el.className = 'page page--event-create'

  el.innerHTML = `
    <div class="create-event-shell">
      <form id="event-form" novalidate>
        <div id="form-error" class="error-text create-event-form-error" role="alert" style="display:none"></div>

        <div class="create-event-layout">
          <div class="create-event-main stack stack--lg">
            <section class="card create-event-card">
              <div class="create-event-card__header">
                <div>
                  <span class="meta--caps">Media</span>
                  <h2>Event cover image</h2>
                </div>
                <p class="muted">Upload an SVG cover so the artwork stays crisp and reliable across public and admin event views.</p>
              </div>

              <div class="create-event-upload" id="hero-upload-zone" tabindex="0" role="button" aria-label="Upload event cover image">
                <input id="heroFile" type="file" accept="image/svg+xml,.svg" style="display:none" />
                <div class="create-event-upload__icon" aria-hidden="true">🖼️</div>
                <div class="create-event-upload__content">
                  <div class="create-event-upload__title">Drop an SVG here or click to upload</div>
                  <p class="muted">SVG only • up to 10 MB</p>
                </div>
                <button type="button" class="btn btn--secondary btn--sm" id="choose-file">Choose file</button>
              </div>

              <div id="hero-preview" class="create-event-upload-preview" aria-live="polite"></div>
              <div id="err-heroImage" class="error-text" aria-live="polite"></div>
            </section>

            <section class="card create-event-card">
              <div class="create-event-card__header">
                <div>
                  <span class="meta--caps">Essentials</span>
                  <h2>Core details</h2>
                </div>
                <p class="muted">Give attendees the name, place, and timing they need at a glance.</p>
              </div>

              <div class="create-event-grid create-event-grid--two">
                <div class="form-field create-event-field create-event-field--full">
                  <label class="form-label" for="title">Event name</label>
                  <input id="title" name="title" class="input create-event-input" placeholder="ex. Product Leadership Summit 2026" maxlength="150" />
                  <div id="err-title" class="error-text" aria-live="polite"></div>
                </div>

                <div class="form-field create-event-field create-event-field--full">
                  <label class="form-label" for="address">Address</label>
                  <input id="address" name="address" class="input create-event-input" placeholder="Street address, venue, city" />
                  <div id="err-location" class="error-text" aria-live="polite"></div>
                </div>

                <div class="form-field create-event-field">
                  <label class="form-label" for="start-date">Start date</label>
                  <input id="start-date" type="date" class="input create-event-input" />
                </div>

                <div class="form-field create-event-field">
                  <label class="form-label" for="start-time">Start time</label>
                  <input id="start-time" type="time" class="input create-event-input" />
                  <div id="err-startDate" class="error-text" aria-live="polite"></div>
                </div>

                <div class="form-field create-event-field">
                  <label class="form-label" for="end-date">End date</label>
                  <input id="end-date" type="date" class="input create-event-input" />
                </div>

                <div class="form-field create-event-field">
                  <label class="form-label" for="end-time">End time</label>
                  <input id="end-time" type="time" class="input create-event-input" />
                  <div id="err-endDate" class="error-text" aria-live="polite"></div>
                </div>
              </div>
            </section>

            <section class="card create-event-card">
              <div class="create-event-card__header">
                <div>
                  <span class="meta--caps">Story</span>
                  <h2>Event description</h2>
                </div>
                <p class="muted">Use rich text to explain what attendees can expect.</p>
              </div>

              <div class="stack stack--sm">
                <div id="desc-toolbar" class="create-event-toolbar" role="toolbar" aria-label="Description formatting">
                  <button type="button" class="btn btn--ghost btn--sm" data-cmd="bold" title="Bold"><strong>B</strong></button>
                  <button type="button" class="btn btn--ghost btn--sm" data-cmd="italic" title="Italic"><em>I</em></button>
                  <button type="button" class="btn btn--ghost btn--sm" data-cmd="underline" title="Underline"><span style="text-decoration:underline">U</span></button>
                  <button type="button" class="btn btn--ghost btn--sm" data-cmd="insertUnorderedList" title="Bulleted list">• List</button>
                  <button type="button" class="btn btn--ghost btn--sm" data-cmd="insertOrderedList" title="Numbered list">1. List</button>
                  <button type="button" class="btn btn--ghost btn--sm" id="add-link" title="Add link">Link</button>
                </div>
                <div id="descriptionEditor" class="textarea create-event-editor" contenteditable="true" role="textbox" aria-multiline="true" placeholder="Tell people why this event matters, what the agenda looks like, and what they should know before arriving."></div>
                <textarea id="description" name="description" style="display:none"></textarea>
                <div id="err-description" class="error-text" aria-live="polite"></div>
              </div>
            </section>

            <section class="card create-event-card">
              <div class="create-event-card__header">
                <div>
                  <span class="meta--caps">Ticketing</span>
                  <h2>Paid or free</h2>
                </div>
                <p class="muted">Choose how attendees should think about registration.</p>
              </div>

              <div class="create-event-pricing" role="radiogroup" aria-label="Event pricing">
                <label class="create-event-choice">
                  <input type="radio" name="ticketType" value="free" checked />
                  <span class="create-event-choice__body">
                    <strong>Free event</strong>
                    <span class="muted">No ticket cost will be shown on the listing.</span>
                  </span>
                </label>

                <label class="create-event-choice">
                  <input type="radio" name="ticketType" value="paid" />
                  <span class="create-event-choice__body">
                    <strong>Paid event</strong>
                    <span class="muted">Show a starting ticket price on the event page.</span>
                  </span>
                </label>
              </div>

              <div id="ticket-price-wrap" class="create-event-price-wrap" hidden>
                <div class="form-field create-event-field">
                  <label class="form-label" for="ticket-price">Ticket price (USD)</label>
                  <div class="create-event-price-input">
                    <span>$</span>
                    <input id="ticket-price" inputmode="decimal" class="input create-event-input" placeholder="25.00" />
                  </div>
                  <div id="err-priceCents" class="error-text" aria-live="polite"></div>
                </div>
              </div>
            </section>

            <div class="create-event-actions actions actions--right">
              <button type="button" id="save-draft" class="btn btn--secondary btn--sm">Save as draft</button>
              <button type="button" id="publish" class="btn btn--primary btn--lg">Publish event</button>
            </div>
          </div>

          <aside class="create-event-sidebar">
            <section class="card create-event-preview-card">
              <div class="create-event-preview-card__header">
                <div>
                  <span class="meta--caps">Live preview</span>
                  <h2>How your event will feel</h2>
                </div>
              </div>

              <div class="create-event-preview-media" id="preview-media">
                <div class="create-event-preview-media__placeholder">Your cover image preview appears here</div>
                <img id="preview-image" alt="Event cover preview" style="display:none" />
              </div>

              <div class="stack stack--md">
                <div>
                  <div class="create-event-preview-pill" id="preview-price">Free event</div>
                  <h3 id="preview-title">Untitled event</h3>
                  <p id="preview-description" class="muted create-event-preview-copy">Start with a strong name and a clear description to make your event stand out.</p>
                </div>

                <div class="create-event-preview-meta">
                  <div class="create-event-preview-meta__item">
                    <span>When</span>
                    <strong id="preview-schedule">Schedule will appear here</strong>
                  </div>
                  <div class="create-event-preview-meta__item">
                    <span>Where</span>
                    <strong id="preview-location">Add your venue address</strong>
                  </div>
                </div>
              </div>
            </section>

            <section class="card create-event-tip-card">
              <span class="meta--caps">Tips</span>
              <ul class="create-event-tip-list">
                <li>Use a clear venue name or full address so guests can trust the details.</li>
                <li>Keep the first 1–2 lines of your description punchy — that copy is often what people remember.</li>
                <li>For paid events, list the lowest visible ticket price to set expectations.</li>
              </ul>
            </section>
          </aside>
        </div>
      </form>
    </div>
  `

  const formError = el.querySelector('#form-error') as HTMLElement
  const titleInput = el.querySelector('#title') as HTMLInputElement
  const addressInput = el.querySelector('#address') as HTMLInputElement
  const startDateInput = el.querySelector('#start-date') as HTMLInputElement
  const startTimeInput = el.querySelector('#start-time') as HTMLInputElement
  const endDateInput = el.querySelector('#end-date') as HTMLInputElement
  const endTimeInput = el.querySelector('#end-time') as HTMLInputElement
  const descriptionEditor = el.querySelector('#descriptionEditor') as HTMLElement
  const descriptionInput = el.querySelector('#description') as HTMLTextAreaElement
  const descToolbar = el.querySelector('#desc-toolbar') as HTMLElement
  const addLinkButton = el.querySelector('#add-link') as HTMLButtonElement
  const heroFileInput = el.querySelector('#heroFile') as HTMLInputElement
  const chooseFileButton = el.querySelector('#choose-file') as HTMLButtonElement
  const uploadZone = el.querySelector('#hero-upload-zone') as HTMLElement
  const heroPreview = el.querySelector('#hero-preview') as HTMLElement
  const ticketTypeInputs = Array.from(el.querySelectorAll('input[name="ticketType"]')) as HTMLInputElement[]
  const ticketPriceWrap = el.querySelector('#ticket-price-wrap') as HTMLElement
  const ticketPriceInput = el.querySelector('#ticket-price') as HTMLInputElement
  const previewImage = el.querySelector('#preview-image') as HTMLImageElement
  const previewMedia = el.querySelector('#preview-media') as HTMLElement
  const previewTitle = el.querySelector('#preview-title') as HTMLElement
  const previewDescription = el.querySelector('#preview-description') as HTMLElement
  const previewSchedule = el.querySelector('#preview-schedule') as HTMLElement
  const previewLocation = el.querySelector('#preview-location') as HTMLElement
  const previewPrice = el.querySelector('#preview-price') as HTMLElement
  const saveDraftButton = el.querySelector('#save-draft') as HTMLButtonElement
  const publishButton = el.querySelector('#publish') as HTMLButtonElement

  const errMap: Record<string, HTMLElement> = {
    title: el.querySelector('#err-title') as HTMLElement,
    description: el.querySelector('#err-description') as HTMLElement,
    heroImage: el.querySelector('#err-heroImage') as HTMLElement,
    startDate: el.querySelector('#err-startDate') as HTMLElement,
    endDate: el.querySelector('#err-endDate') as HTMLElement,
    location: el.querySelector('#err-location') as HTMLElement,
    priceCents: el.querySelector('#err-priceCents') as HTMLElement,
  }

  function selectedTicketType(): 'free' | 'paid' {
    return (ticketTypeInputs.find((input) => input.checked)?.value as 'free' | 'paid') || 'free'
  }

  function clearErrors() {
    formError.style.display = 'none'
    formError.textContent = ''
    Object.values(errMap).forEach((node) => {
      node.textContent = ''
    })
  }

  function updateHiddenDescription() {
    descriptionInput.value = sanitizeHtml(descriptionEditor.innerHTML)
  }

  function updateToolbarState() {
    const buttons = Array.from(descToolbar.querySelectorAll('button[data-cmd]')) as HTMLButtonElement[]
    buttons.forEach((button) => {
      const cmd = button.getAttribute('data-cmd') || ''
      try {
        button.setAttribute('aria-pressed', document.queryCommandState(cmd) ? 'true' : 'false')
      } catch {
        button.setAttribute('aria-pressed', 'false')
      }
    })
  }

  function setPreviewImage(source?: string) {
    if (!source) {
      previewImage.style.display = 'none'
      previewImage.removeAttribute('src')
      previewMedia.classList.remove('has-image')
      return
    }

    previewImage.src = source
    previewImage.style.display = 'block'
    previewMedia.classList.add('has-image')
  }

  function renderHeroFilePreview(file?: File) {
    heroPreview.innerHTML = ''

    if (!file) {
      setPreviewImage()
      return
    }

    const wrapper = document.createElement('div')
    wrapper.className = 'create-event-upload-preview__card'

    const img = document.createElement('img')
    img.alt = file.name

    const meta = document.createElement('div')
    meta.className = 'create-event-upload-preview__meta'

    const title = document.createElement('strong')
    title.textContent = file.name

    const detail = document.createElement('span')
    detail.className = 'muted'
    detail.textContent = `${Math.max(1, Math.round(file.size / 1024))} KB ready to publish`

    const removeButton = document.createElement('button')
    removeButton.type = 'button'
    removeButton.className = 'btn btn--ghost btn--sm'
    removeButton.textContent = 'Remove image'
    removeButton.addEventListener('click', () => {
      heroFileInput.value = ''
      heroPreview.innerHTML = ''
      setPreviewImage()
      errMap.heroImage.textContent = ''
    })

    meta.appendChild(title)
    meta.appendChild(detail)
    meta.appendChild(removeButton)
    wrapper.appendChild(img)
    wrapper.appendChild(meta)
    heroPreview.appendChild(wrapper)

    const reader = new FileReader()
    reader.onload = () => {
      const source = String(reader.result || '')
      img.src = source
      setPreviewImage(source)
    }
    reader.readAsDataURL(file)
  }

  function syncPreview() {
    updateHiddenDescription()

    const safeDescription = stripHtml(descriptionInput.value)

    previewTitle.textContent = titleInput.value.trim() || 'Untitled event'
    previewDescription.textContent = safeDescription
      ? truncate(safeDescription, 180)
      : 'Start with a strong name and a clear description to make your event stand out.'
    previewSchedule.textContent = formatPreviewSchedule(
      startDateInput.value,
      startTimeInput.value,
      endDateInput.value,
      endTimeInput.value,
    )
    previewLocation.textContent = addressInput.value.trim() || 'Add your venue address'
    previewPrice.textContent = formatPriceLabel(selectedTicketType(), ticketPriceInput.value.trim())
  }

  function focusFirstError(errors: Record<string, string[]>) {
    const order = ['heroImage', 'title', 'location', 'startDate', 'endDate', 'description', 'priceCents']
    const focusMap: Record<string, HTMLElement | null> = {
      heroImage: uploadZone,
      title: titleInput,
      location: addressInput,
      startDate: startDateInput,
      endDate: endDateInput,
      description: descriptionEditor,
      priceCents: ticketPriceInput,
    }

    for (const key of order) {
      if (errors[key]?.length) {
        focusMap[key]?.focus()
        return
      }
    }
  }

  function validateImageFile(file?: File) {
    if (!file) return undefined
    const isSvgFile = ACCEPTED_IMAGE_TYPES.includes(file.type) || /\.svg$/i.test(file.name)
    if (!isSvgFile) return 'Please upload an SVG image.'
    if (file.size > MAX_HERO_IMAGE_BYTES) return 'Cover image must be 10 MB or smaller.'
    return undefined
  }

  function syncPricingUI() {
    const isPaid = selectedTicketType() === 'paid'
    ticketPriceWrap.hidden = !isPaid
    previewPrice.classList.toggle('is-paid', isPaid)
    if (!isPaid) {
      ticketPriceInput.value = ''
      errMap.priceCents.textContent = ''
    }
    syncPreview()
  }

  descToolbar.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement).closest('button') as HTMLButtonElement | null
    if (!button) return
    const cmd = button.getAttribute('data-cmd')
    if (!cmd) return
    document.execCommand(cmd, false)
    updateHiddenDescription()
    updateToolbarState()
    descriptionEditor.focus()
    syncPreview()
  })

  document.addEventListener('selectionchange', () => {
    if (document.activeElement === descriptionEditor) updateToolbarState()
  })

  addLinkButton.addEventListener('click', () => {
    const raw = window.prompt('Enter a URL (https://...)') || ''
    const safeUrl = raw.trim()
    if (!safeUrl) return
    if (!/^https?:\/\//i.test(safeUrl) && !/^mailto:/i.test(safeUrl)) {
      window.alert('Please enter a valid URL starting with http://, https://, or mailto:.')
      return
    }
    document.execCommand('createLink', false, safeUrl)
    updateHiddenDescription()
    updateToolbarState()
    descriptionEditor.focus()
    syncPreview()
  })

  descriptionEditor.addEventListener('input', syncPreview)
  descriptionEditor.addEventListener('focus', updateToolbarState)

  ;[titleInput, addressInput, startDateInput, startTimeInput, endDateInput, endTimeInput, ticketPriceInput].forEach((input) => {
    input.addEventListener('input', syncPreview)
  })

  ticketTypeInputs.forEach((input) => {
    input.addEventListener('change', syncPricingUI)
  })

  chooseFileButton.addEventListener('click', () => heroFileInput.click())
  uploadZone.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (target.closest('button')) return
    heroFileInput.click()
  })
  uploadZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      heroFileInput.click()
    }
  })

  ;['dragenter', 'dragover'].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault()
      uploadZone.classList.add('is-dragover')
    })
  })
  ;['dragleave', 'dragend', 'drop'].forEach((eventName) => {
    uploadZone.addEventListener(eventName, (event) => {
      event.preventDefault()
      uploadZone.classList.remove('is-dragover')
    })
  })

  uploadZone.addEventListener('drop', (event) => {
    const droppedFiles = event instanceof DragEvent ? event.dataTransfer?.files : undefined
    const file = droppedFiles?.[0]
    if (!file) return

    const validationError = validateImageFile(file)
    if (validationError) {
      errMap.heroImage.textContent = validationError
      heroFileInput.value = ''
      heroPreview.innerHTML = ''
      setPreviewImage()
      return
    }

    const transfer = new DataTransfer()
    transfer.items.add(file)
    heroFileInput.files = transfer.files
    errMap.heroImage.textContent = ''
    renderHeroFilePreview(file)
  })

  heroFileInput.addEventListener('change', () => {
    const file = heroFileInput.files?.[0]
    const validationError = validateImageFile(file)

    if (validationError) {
      errMap.heroImage.textContent = validationError
      heroFileInput.value = ''
      heroPreview.innerHTML = ''
      setPreviewImage()
      return
    }

    errMap.heroImage.textContent = ''
    renderHeroFilePreview(file)
  })

  async function submit(status: EventStatus) {
    clearErrors()
    syncPreview()

    const startIso = combineDateAndTime(startDateInput.value, startTimeInput.value)
    const endIso = combineDateAndTime(endDateInput.value, endTimeInput.value)
    const description = descriptionInput.value.trim()
    const descriptionPlain = stripHtml(description)
    const ticketType = selectedTicketType()
    const ticketPrice = ticketPriceInput.value.trim()
    const file = heroFileInput.files?.[0]

    const clientErrors: Record<string, string[]> = {}
    const addError = (key: string, message: string) => {
      clientErrors[key] = clientErrors[key] || []
      clientErrors[key].push(message)
    }

    if (!titleInput.value.trim()) addError('title', 'Event name is required.')
    else if (titleInput.value.trim().length > 150) addError('title', 'Event name must be 150 characters or fewer.')

    if (!addressInput.value.trim()) addError('location', 'Address is required.')

    if (status === EventStatus.Published) {
      if (!startDateInput.value || !startTimeInput.value || !startIso) addError('startDate', 'Start date and start time are required.')
      if (!endDateInput.value || !endTimeInput.value || !endIso) addError('endDate', 'End date and end time are required.')
      if (!descriptionPlain) addError('description', 'Event description is required when publishing.')
    } else {
      if ((startDateInput.value || startTimeInput.value) && !startIso) addError('startDate', 'Add both a valid start date and start time.')
      if ((endDateInput.value || endTimeInput.value) && !endIso) addError('endDate', 'Add both a valid end date and end time.')
    }

    if (startIso && endIso && Date.parse(endIso) <= Date.parse(startIso)) {
      addError('endDate', 'End time must be after the start time.')
    }

    if (ticketType === 'paid') {
      const amount = Number.parseFloat(ticketPrice)
      if (!ticketPrice) addError('priceCents', 'Add a ticket price for paid events.')
      else if (!Number.isFinite(amount) || amount <= 0) addError('priceCents', 'Ticket price must be greater than 0.')
    }

    const imageError = validateImageFile(file)
    if (imageError) addError('heroImage', imageError)

    if (Object.keys(clientErrors).length) {
      Object.entries(clientErrors).forEach(([key, messages]) => {
        const node = errMap[key]
        if (node) node.textContent = messages.join(' ')
      })
      focusFirstError(clientErrors)
      return
    }

    const allButtons = Array.from(el.querySelectorAll('button')) as HTMLButtonElement[]
    allButtons.forEach((button) => {
      button.disabled = true
    })

    try {
      const payload: any = {
        title: titleInput.value.trim(),
        shortDescription: truncate(descriptionPlain, 140),
        description,
        status,
        startDate: startIso || undefined,
        endDate: endIso || undefined,
        location: { address: addressInput.value.trim() },
        priceCents: ticketType === 'paid' ? Math.round(Number.parseFloat(ticketPrice) * 100) : 0,
        currency: 'USD',
      }

      if (file) payload.heroImage = await readFileAsDataUrl(file)

      const response = await createEvent(payload)
      if (!response.ok) {
        if (response.errors) {
          Object.entries(response.errors).forEach(([key, messages]) => {
            const node = errMap[key]
            if (node) node.textContent = messages.join(' ')
          })
          focusFirstError(response.errors)
        } else {
          formError.textContent = response.message || 'We were unable to create the event. Please try again.'
          formError.style.display = 'block'
        }
        return
      }

      location.hash = '/admin/events'
    } catch {
      formError.textContent = 'An unexpected error occurred. Please try again.'
      formError.style.display = 'block'
    } finally {
      saveDraftButton.disabled = false
      publishButton.disabled = false
      saveDraftButton.textContent = 'Save as draft'
      publishButton.textContent = 'Publish event'
      allButtons.forEach((button) => {
        button.disabled = false
      })
    }
  }

  saveDraftButton.addEventListener('click', async () => {
    saveDraftButton.textContent = 'Saving…'
    saveDraftButton.disabled = true
    publishButton.disabled = true
    await submit(EventStatus.Draft)
  })

  publishButton.addEventListener('click', async () => {
    publishButton.textContent = 'Publishing…'
    saveDraftButton.disabled = true
    publishButton.disabled = true
    await submit(EventStatus.Published)
  })

  syncPricingUI()
  syncPreview()
  updateToolbarState()

  return el
}
