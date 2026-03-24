import { createEvent } from '../api/mockApi'
import { EventStatus } from '../models'

function formatIsoFromLocal(value: string | null) {
  if (!value) return undefined
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

export function renderEventCreate() {
  const el = document.createElement('div')
  el.className = 'page'

  el.innerHTML = `
    <div class="page-title">
      <h1>New event</h1>
      <p class="muted">Create an event quickly. You can save as draft and publish when ready.</p>
    </div>

    <div class="card">
      <form id="event-form" novalidate>
        <div style="display:flex; flex-direction:column; gap:16px">
          <div class="form-field">
            <label class="form-label" for="title">Title</label>
            <input id="title" name="title" class="input" placeholder="Event title" />
            <div id="err-title" class="error-text" aria-live="polite"></div>
          </div>

          <div class="form-field">
            <label class="form-label" for="description">Description</label>
            <textarea id="description" name="description" class="textarea" placeholder="Short description and details"></textarea>
            <div id="err-description" class="error-text" aria-live="polite"></div>
          </div>

          <div class="form-field">
            <label class="form-label">Cover image</label>
            <div style="display:flex; gap:8px; align-items:center;">
              <input id="heroUrl" class="input" placeholder="Image URL (jpg/png)" />
              <label style="display:inline-flex; align-items:center; gap:8px;">
                <input id="heroFile" type="file" accept="image/jpeg,image/png" style="display:none" />
                <button type="button" class="btn btn--secondary btn--sm" id="choose-file">Upload</button>
              </label>
            </div>
            <div id="hero-preview" style="margin-top:8px"></div>
            <div id="err-heroImage" class="error-text" aria-live="polite"></div>
          </div>

          <div style="display:flex; gap:12px; flex-direction:column">
            <div class="form-field">
              <label class="form-label">Start date & time</label>
              <input id="start" type="datetime-local" class="input" />
              <div id="err-startDate" class="error-text" aria-live="polite"></div>
            </div>
            <div class="form-field">
              <label class="form-label">End date & time</label>
              <input id="end" type="datetime-local" class="input" />
              <div id="err-endDate" class="error-text" aria-live="polite"></div>
            </div>
          </div>

          <div class="form-field">
            <label class="form-label" for="address">Address</label>
            <input id="address" class="input" placeholder="Street address, city" />
            <div id="err-location" class="error-text" aria-live="polite"></div>
          </div>

          <div style="display:flex; gap:8px; justify-content:flex-end;">
            <button type="button" id="save-draft" class="btn btn--ghost">Save as draft</button>
            <button type="button" id="publish" class="btn btn--primary">Publish</button>
          </div>
        </div>
      </form>
    </div>
  `

  // element refs
  const form = el.querySelector('#event-form') as HTMLFormElement
  const titleInput = el.querySelector('#title') as HTMLInputElement
  const descInput = el.querySelector('#description') as HTMLTextAreaElement
  const heroUrl = el.querySelector('#heroUrl') as HTMLInputElement
  const heroFile = el.querySelector('#heroFile') as HTMLInputElement
  const chooseFile = el.querySelector('#choose-file') as HTMLButtonElement
  const heroPreview = el.querySelector('#hero-preview') as HTMLElement
  const startInput = el.querySelector('#start') as HTMLInputElement
  const endInput = el.querySelector('#end') as HTMLInputElement
  const addressInput = el.querySelector('#address') as HTMLInputElement

  const errMap: Record<string, HTMLElement> = {
    title: el.querySelector('#err-title') as HTMLElement,
    description: el.querySelector('#err-description') as HTMLElement,
    heroImage: el.querySelector('#err-heroImage') as HTMLElement,
    startDate: el.querySelector('#err-startDate') as HTMLElement,
    endDate: el.querySelector('#err-endDate') as HTMLElement,
    location: el.querySelector('#err-location') as HTMLElement,
  }

  function clearErrors() {
    Object.values(errMap).forEach((n) => (n.textContent = ''))
  }

  function renderPreviewFromUrl(url: string) {
    heroPreview.innerHTML = ''
    if (!url) return
    const img = document.createElement('img')
    img.src = url
    img.alt = 'Cover preview'
    img.style.maxWidth = '240px'
    img.style.maxHeight = '140px'
    img.style.borderRadius = '8px'
    img.style.objectFit = 'cover'
    img.onerror = () => { heroPreview.textContent = 'Unable to load image preview' }
    heroPreview.appendChild(img)
  }

  heroUrl.addEventListener('input', () => {
    // clear file selection if user typed URL
    heroFile.value = ''
    renderPreviewFromUrl(heroUrl.value.trim())
  })

  chooseFile.addEventListener('click', () => heroFile.click())
  heroFile.addEventListener('change', () => {
    const f = heroFile.files && heroFile.files[0]
    if (!f) return
    // clear URL field
    heroUrl.value = ''
    heroPreview.innerHTML = ''
    const img = document.createElement('img')
    img.style.maxWidth = '240px'
    img.style.maxHeight = '140px'
    img.style.borderRadius = '8px'
    img.style.objectFit = 'cover'
    img.alt = f.name
    const reader = new FileReader()
    reader.onload = () => { img.src = String(reader.result) }
    reader.readAsDataURL(f)
    heroPreview.appendChild(img)
  })

  async function submit(status: EventStatus) {
    clearErrors()
    const payload: any = {
      title: titleInput.value.trim(),
      description: descInput.value.trim(),
      status,
      startDate: formatIsoFromLocal(startInput.value || null),
      endDate: formatIsoFromLocal(endInput.value || null),
      location: { address: addressInput.value.trim() },
    }

    // hero: prefer file if set, else URL
    const file = heroFile.files && heroFile.files[0]
    if (file) payload.heroImage = { name: file.name, size: file.size, type: file.type }
    else if (heroUrl.value.trim()) payload.heroImageUrl = heroUrl.value.trim()

    // disable UI
    const allButtons = el.querySelectorAll('button')
    allButtons.forEach((b) => (b as HTMLButtonElement).disabled = true)

    try {
      const res = await createEvent(payload)
      if (!res.ok) {
        // show field errors if provided
        if (res.errors) {
          Object.keys(res.errors).forEach((k) => {
            const key = k === 'heroImage' ? 'heroImage' : k
            const node = (errMap as any)[key]
            if (node) node.textContent = (res.errors as any)[k].join('. ')
          })
        } else {
          alert(res.message || 'Unable to create event')
        }
        return
      }

      // on success go back to admin dashboard
      location.hash = '/admin'
    } finally {
      allButtons.forEach((b) => (b as HTMLButtonElement).disabled = false)
    }
  }

  const saveDraft = el.querySelector('#save-draft') as HTMLButtonElement
  const publish = el.querySelector('#publish') as HTMLButtonElement

  saveDraft.addEventListener('click', async () => {
    await submit(EventStatus.Draft)
  })
  publish.addEventListener('click', async () => {
    await submit(EventStatus.Published)
  })

  return el
}
