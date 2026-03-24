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
        <div id="form-error" class="error-text mb-2" role="alert" style="display:none"></div>
        <div class="stack">
          <section class="form-section">
            <h2 class="form-section__title">Basic info</h2>
            <p class="form-section__desc muted">Give your event a clear, concise title so attendees know what to expect.</p>
            <div class="form-field">
              <label class="form-label" for="title">Title</label>
              <input id="title" name="title" class="input" placeholder="Event title" />
              <div id="err-title" class="error-text" aria-live="polite"></div>
            </div>
          </section>

          <section class="form-section">
            <h2 class="form-section__title">Description</h2>
            <p class="form-section__desc muted">Write a short summary and any important details. This will be shown to attendees.</p>
            <div class="form-field">
              <label class="form-label" for="descriptionEditor">Description</label>
              <div class="stack stack--sm">
                <div id="desc-toolbar" class="row row--sm" role="toolbar" aria-label="Description formatting">
                  <button type="button" class="btn btn--ghost btn--sm" data-cmd="bold" title="Bold">B</button>
                  <button type="button" class="btn btn--ghost btn--sm" data-cmd="italic" title="Italic">i</button>
                  <button type="button" class="btn btn--ghost btn--sm" data-cmd="insertUnorderedList" title="Bulleted list">• List</button>
                  <button type="button" class="btn btn--ghost btn--sm" id="add-link" title="Add link">Link</button>
                </div>
                <div id="descriptionEditor" class="textarea" contenteditable="true" role="textbox" aria-multiline="true" placeholder="Short description and details" style="min-height:120px;"></div>
                <textarea id="description" name="description" style="display:none"></textarea>
                <div id="err-description" class="error-text" aria-live="polite"></div>
              </div>
            </div>
          </section>

          <section class="form-section">
            <h2 class="form-section__title">Cover image</h2>
            <p class="form-section__desc muted">Add an image to make the event listing more engaging. Use a JPG or PNG.</p>
            <div class="form-field">
              <label class="form-label">Cover image</label>
              <div class="upload-row">
                <div class="upload-zone" id="hero-upload-zone" tabindex="0" role="button" aria-label="Upload cover image">
                  <input id="heroFile" type="file" accept="image/jpeg,image/png" style="display:none" />
                  <div class="upload-zone__inner">
                    <div class="upload-zone__icon" aria-hidden>🖼️</div>
                    <div>
                      <div class="upload-zone__title">Upload an image</div>
                      <div class="muted helper-text">Click to choose a file or use the field to the right to paste an image URL</div>
                    </div>
                  </div>
                </div>

                <div class="flex-1">
                  <input id="heroUrl" class="input" placeholder="Image URL (jpg/png)" />
                  <div class="row row--sm mt-2">
                    <button type="button" class="btn btn--secondary btn--sm" id="choose-file">Upload</button>
                    <div class="muted helper-text">JPG or PNG • up to 8 MB</div>
                  </div>
                </div>
              </div>

              <div id="hero-preview" class="upload-preview mt-2" aria-live="polite"></div>
              <div id="err-heroImage" class="error-text mt-2" aria-live="polite"></div>
            </div>
          </section>

          <section class="form-section">
            <h2 class="form-section__title">Date & time</h2>
            <p class="form-section__desc muted">Specify when the event starts and ends. Drafts may omit dates.</p>
            <div class="stack stack--md">
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
          </section>

          <section class="form-section">
            <h2 class="form-section__title">Location</h2>
            <p class="form-section__desc muted">Where is this event taking place? Provide an address or venue name.</p>
            <div class="form-field">
              <label class="form-label" for="address">Address</label>
              <input id="address" class="input" placeholder="Street address, city" />
              <div id="err-location" class="error-text" aria-live="polite"></div>
            </div>
          </section>

          <div class="actions actions--right mt-3">
            <button type="button" id="save-draft" class="btn btn--ghost">Save as draft</button>
            <button type="button" id="publish" class="btn btn--primary">Publish</button>
          </div>
        </div>
      </form>
    </div>
  `

    // element refs
    const form = el.querySelector('#event-form') as HTMLFormElement
    const formError = el.querySelector('#form-error') as HTMLElement
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

  function focusFirstError(errors: Record<string, string[]>) {
    const order = ['title', 'description', 'heroImage', 'startDate', 'endDate', 'location']
    for (const k of order) {
      if (errors[k] && errors[k].length) {
        const elmap: Record<string, HTMLElement | null> = {
          title: titleInput,
          description: descEditor,
          heroImage: heroUrl,
          startDate: startInput,
          endDate: endInput,
          location: addressInput,
        }
        const node = elmap[k]
        if (node) {
          node.focus()
          return
        }
      }
    }
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
      updateToolbarState()
    })
    
    // update visual state of toolbar buttons based on current selection
    function updateToolbarState() {
      if (!descToolbar) return
      const btns = Array.from(descToolbar.querySelectorAll('button[data-cmd]')) as HTMLButtonElement[]
      btns.forEach((b) => {
        const cmd = b.getAttribute('data-cmd') || ''
        // queryCommandState works for bold, italic, lists
        try {
          const state = document.queryCommandState(cmd)
          b.setAttribute('aria-pressed', state ? 'true' : 'false')
        } catch (e) {
          b.setAttribute('aria-pressed', 'false')
        }
      })
    }
    // keep toolbar in sync with selection changes and editor input
    document.addEventListener('selectionchange', updateToolbarState)
    if (descEditor) {
      descEditor.addEventListener('input', updateToolbarState)
      descEditor.addEventListener('focus', updateToolbarState)
    }
    // initial state
    updateToolbarState()
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
      // reflect link state (createLink is not queryable reliably, so reset others)
      const tb = descToolbar
      if (tb) {
        const btns = tb.querySelectorAll('button[data-cmd]')
        btns.forEach((b) => b.setAttribute('aria-pressed', document.queryCommandState((b as HTMLElement).getAttribute('data-cmd') || '') ? 'true' : 'false'))
      }
    })
  }

  descEditor.addEventListener('input', () => {
    updateHiddenFromEditor()
  })

  function renderPreviewFromUrl(url: string) {
    heroPreview.innerHTML = ''
    if (!url) return
    const wrapper = document.createElement('div')
    wrapper.className = 'upload-preview'
    const img = document.createElement('img')
    img.src = url
    img.alt = 'Cover preview'
    img.onerror = () => { heroPreview.textContent = 'Unable to load image preview' }
    wrapper.appendChild(img)
    heroPreview.appendChild(wrapper)
  }

  heroUrl.addEventListener('input', () => {
    // clear file selection if user typed URL
    heroFile.value = ''
    errMap.heroImage.textContent = ''
    renderPreviewFromUrl(heroUrl.value.trim())
  })

  chooseFile.addEventListener('click', () => heroFile.click())
  // make the dashed upload zone interactive
  const heroUploadZone = el.querySelector('#hero-upload-zone') as HTMLElement | null
  if (heroUploadZone) {
    heroUploadZone.addEventListener('click', () => heroFile.click())
    heroUploadZone.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); heroFile.click() }
    })
  }
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
    container.className = 'upload-preview'

    const img = document.createElement('img')
    img.style.maxWidth = '240px'
    img.style.maxHeight = '140px'
    img.style.borderRadius = '8px'
    img.style.objectFit = 'cover'
    img.alt = f.name

    const meta = document.createElement('div')
    meta.className = 'upload-meta stack stack--sm'

    const name = document.createElement('div')
    name.textContent = f.name + ' • ' + (Math.round(f.size / 1024) + ' KB')
    name.className = 'muted text-sm'

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
      // client-side validation to provide quicker, inline feedback
      const clientErrors: Record<string, string[]> = {}
      const addErr = (k: string, msg: string) => { clientErrors[k] = clientErrors[k] || []; clientErrors[k].push(msg) }

      if (!payload.title || payload.title.length === 0) addErr('title', 'Title is required')
      else if (payload.title.length > 150) addErr('title', 'Title must be 150 characters or fewer')

      // If publishing, require description and dates; drafts may omit them
      if (status === EventStatus.Published) {
        if (!payload.description || payload.description.length === 0) addErr('description', 'Description is required when publishing')
        if (!payload.startDate) addErr('startDate', 'Start date and time are required')
        else if (Number.isNaN(Date.parse(payload.startDate as string))) addErr('startDate', 'Start date is not a valid datetime')
        if (!payload.endDate) addErr('endDate', 'End date and time are required')
        else if (Number.isNaN(Date.parse(payload.endDate as string))) addErr('endDate', 'End date is not a valid datetime')
      } else {
        // if provided, validate dates' format
        if (payload.startDate && Number.isNaN(Date.parse(payload.startDate as string))) addErr('startDate', 'Start date is not a valid datetime')
        if (payload.endDate && Number.isNaN(Date.parse(payload.endDate as string))) addErr('endDate', 'End date is not a valid datetime')
      }
      if (payload.startDate && payload.endDate) {
        const s = Date.parse(payload.startDate as string)
        const e = Date.parse(payload.endDate as string)
        if (!Number.isNaN(s) && !Number.isNaN(e) && e <= s) addErr('endDate', 'End date must be after start date')
      }

      // hero image URL basic check if provided
      if ((payload as any).heroImageUrl) {
        const low = String((payload as any).heroImageUrl).toLowerCase()
        if (!/\.(jpe?g|png)(\?|$)/.test(low)) addErr('heroImage', 'Hero image URL must point to a JPG or PNG')
      }

      // show client errors and abort before network call
      if (Object.keys(clientErrors).length) {
        clearErrors()
        Object.keys(clientErrors).forEach((k) => {
          const node = (errMap as any)[k]
          if (node) node.textContent = clientErrors[k].join('. ')
        })
        focusFirstError(clientErrors)
        return
      }

       const res = await createEvent(payload)
       if (!res.ok) {
         // show field errors if provided
         if (res.errors) {
           Object.keys(res.errors).forEach((k) => {
             const key = k === 'heroImage' ? 'heroImage' : k
             const node = (errMap as any)[key]
             if (node) node.textContent = (res.errors as any)[k].join('. ')
           })
           focusFirstError(res.errors)
         } else {
           // surface a calm, human-friendly message
           formError.textContent = res.message || 'We were unable to create the event. Please try again.'
           formError.style.display = 'block'
         }
         return
       }

      // on success go back to admin dashboard
      location.hash = '/admin'
    } catch (err) {
      formError.textContent = 'An unexpected error occurred. Please try again.'
      formError.style.display = 'block'
      return
    } finally {
      // restore button labels and re-enable
      saveDraft.textContent = 'Save as draft'
      publish.textContent = 'Publish'
      allButtons.forEach((b) => (b as HTMLButtonElement).disabled = false)
    }
  }

  const saveDraft = el.querySelector('#save-draft') as HTMLButtonElement
  const publish = el.querySelector('#publish') as HTMLButtonElement

  saveDraft.addEventListener('click', async () => {
    // UI: show saving state
    saveDraft.disabled = true
    publish.disabled = true
    saveDraft.textContent = 'Saving…'
    await submit(EventStatus.Draft)
  })
  publish.addEventListener('click', async () => {
    // UI: show publishing state
    saveDraft.disabled = true
    publish.disabled = true
    publish.textContent = 'Publishing…'
    await submit(EventStatus.Published)
  })

  return el
}
