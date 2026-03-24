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
            <label class="form-label" for="descriptionEditor">Description</label>
            <div style="display:flex; gap:8px; flex-direction:column">
              <div id="desc-toolbar" style="display:flex; gap:8px;">
                <button type="button" class="btn btn--ghost btn--sm" data-cmd="bold">B</button>
                <button type="button" class="btn btn--ghost btn--sm" data-cmd="italic">i</button>
                <button type="button" class="btn btn--ghost btn--sm" data-cmd="insertUnorderedList">• List</button>
                <button type="button" class="btn btn--ghost btn--sm" id="add-link">Link</button>
              </div>
              <div id="descriptionEditor" class="textarea" contenteditable="true" role="textbox" aria-multiline="true" placeholder="Short description and details" style="min-height:120px;"></div>
              <textarea id="description" name="description" style="display:none"></textarea>
              <div id="err-description" class="error-text" aria-live="polite"></div>
            </div>
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
  const descEditor = el.querySelector('#descriptionEditor') as HTMLElement
  const startInput = el.querySelector('#start') as HTMLInputElement
  const endInput = el.querySelector('#end') as HTMLInputElement
  const addressInput = el.querySelector('#address') as HTMLInputElement
  const descToolbar = el.querySelector('#desc-toolbar') as HTMLElement
  const addLinkBtn = el.querySelector('#add-link') as HTMLButtonElement

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

  // Simple HTML sanitizer that allows a small set of tags and ensures links are safe
  function sanitizeHtml(html: string) {
    const allowed = new Set(['B', 'STRONG', 'I', 'EM', 'UL', 'OL', 'LI', 'A', 'P', 'BR'])
    const doc = document.createElement('div')
    doc.innerHTML = html || ''

    function walk(node: Node) {
      const toRemove: Node[] = []
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const el = child as HTMLElement
          const tag = el.tagName.toUpperCase()
          if (!allowed.has(tag)) {
            // unwrap the element: move its children up
            while (el.firstChild) node.insertBefore(el.firstChild, el)
            toRemove.push(el)
          } else {
            // strip all attributes except href on anchors
            if (tag === 'A') {
              const href = el.getAttribute('href') || ''
              // allow only http(s) and mailto links
              if (!href.match(/^https?:\/\//) && !href.match(/^mailto:/)) {
                el.removeAttribute('href')
              } else {
                el.setAttribute('rel', 'noopener noreferrer')
                el.setAttribute('target', '_blank')
              }
            } else {
              // remove attributes
              Array.from(el.attributes).forEach((a) => el.removeAttribute(a.name))
            }
            walk(el)
          }
        } else if (child.nodeType === Node.TEXT_NODE) {
          // ok
        } else {
          toRemove.push(child)
        }
      })
      toRemove.forEach((n) => n.parentNode && n.parentNode.removeChild(n))
    }

    walk(doc)
    return doc.innerHTML
  }

  function updateHiddenFromEditor() {
    if (!descEditor) return
    // normalize: wrap text nodes into <p>
    // we will simply take innerHTML and sanitize
    const html = descEditor.innerHTML
    descInput.value = sanitizeHtml(html)
  }

  // wire toolbar
  if (descToolbar) {
    descToolbar.addEventListener('click', (ev) => {
      const btn = (ev.target as HTMLElement).closest('button') as HTMLButtonElement | null
      if (!btn) return
      const cmd = btn.getAttribute('data-cmd')
      if (!cmd) return
      // use execCommand for lightweight formatting
      document.execCommand(cmd, false)
      updateHiddenFromEditor()
      descEditor.focus()
    })
  }

  if (addLinkBtn) {
    addLinkBtn.addEventListener('click', () => {
      const url = window.prompt('Enter a URL (https://...)') || ''
      if (!url) return
      // basic normalization
      const safeUrl = url.trim()
      if (!safeUrl.match(/^https?:\/\//) && !safeUrl.match(/^mailto:/)) {
        alert('Please enter a valid URL starting with http:// or https://')
        return
      }
      document.execCommand('createLink', false, safeUrl)
      updateHiddenFromEditor()
      descEditor.focus()
    })
  }

  descEditor.addEventListener('input', () => {
    updateHiddenFromEditor()
  })

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
    errMap.heroImage.textContent = ''
    renderPreviewFromUrl(heroUrl.value.trim())
  })

  chooseFile.addEventListener('click', () => heroFile.click())
  heroFile.addEventListener('change', () => {
    const f = heroFile.files && heroFile.files[0]
    heroPreview.innerHTML = ''
    errMap.heroImage.textContent = ''
    if (!f) return
    // client-side validation
    const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
    const allowed = ['image/jpeg', 'image/png']
    if (!allowed.includes(f.type)) {
      errMap.heroImage.textContent = 'Invalid file type. Only JPEG and PNG are allowed.'
      heroFile.value = ''
      return
    }
    if (f.size > MAX_BYTES) {
      errMap.heroImage.textContent = 'File too large. Maximum size is 8 MB.'
      heroFile.value = ''
      return
    }

    // clear URL field
    heroUrl.value = ''

    const container = document.createElement('div')
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.gap = '12px'

    const img = document.createElement('img')
    img.style.maxWidth = '240px'
    img.style.maxHeight = '140px'
    img.style.borderRadius = '8px'
    img.style.objectFit = 'cover'
    img.alt = f.name

    const meta = document.createElement('div')
    meta.style.display = 'flex'
    meta.style.flexDirection = 'column'
    meta.style.gap = '6px'

    const name = document.createElement('div')
    name.textContent = f.name + ' • ' + (Math.round(f.size / 1024) + ' KB')
    name.style.fontSize = '13px'
    name.style.color = 'var(--neutral-700)'

    const ok = document.createElement('div')
    ok.textContent = 'Image ready — preview below.'
    ok.className = 'success-text'

    const clearBtn = document.createElement('button')
    clearBtn.type = 'button'
    clearBtn.className = 'btn btn--ghost btn--sm'
    clearBtn.textContent = 'Remove'
    clearBtn.addEventListener('click', () => {
      heroFile.value = ''
      heroPreview.innerHTML = ''
      errMap.heroImage.textContent = ''
    })

    meta.appendChild(name)
    meta.appendChild(ok)
    meta.appendChild(clearBtn)

    const reader = new FileReader()
    reader.onload = () => { img.src = String(reader.result) }
    reader.readAsDataURL(f)

    container.appendChild(img)
    container.appendChild(meta)
    heroPreview.appendChild(container)
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
