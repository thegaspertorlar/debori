import { events as seededEvents, users as seededUsers, demoCredentials } from '../data/seed'
import { Event, User, EventStatus } from '../models'

// In-memory state for the current session only
const events: Event[] = JSON.parse(JSON.stringify(seededEvents))
const users: User[] = JSON.parse(JSON.stringify(seededUsers))

// Helper: artificial latency between 200-300ms
function delay() {
  const ms = 200 + Math.floor(Math.random() * 100)
  return new Promise((res) => setTimeout(res, ms))
}

type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; errors?: Record<string, string[]>; message?: string }

function nowIso() {
  return new Date().toISOString()
}

function deriveStatus(ev: Event): EventStatus {
  if (ev.endDate) {
    const end = new Date(ev.endDate).getTime()
    if (!Number.isNaN(end) && end < Date.now()) return EventStatus.Past
  }
  return ev.status
}

function validateImageReference(img: any) {
  // Accept either a URL string or a file-like object { name, size, type }
  if (!img) return []
  const errors: string[] = []
  if (typeof img === 'string') {
    const lower = img.toLowerCase()
    if (!/\.(jpe?g|png)(\?|$)/.test(lower)) errors.push('Hero image must be a JPG or PNG URL')
    return errors
  }
  // file-like object
  const { size, type, name } = img
  if (typeof size !== 'number') errors.push('Image size unknown')
  if (typeof type === 'string' && !/(image\/jpeg|image\/png)/.test(type)) errors.push('Image must be JPEG or PNG')
  if (typeof size === 'number' && size > 8 * 1024 * 1024) errors.push('Image must be 8 MB or smaller')
  if (name && !/\.(jpe?g|png)$/i.test(name)) errors.push('Image filename must end with .jpg, .jpeg or .png')
  return errors
}

export async function listPublicEvents(): Promise<ApiResponse<Event[]>> {
  await delay()
  // Return events that are published or past (derive past when endDate passed)
  const list = events.map((e) => ({ ...e }))
  list.forEach((e) => {
    const derived = deriveStatus(e)
    if (derived === EventStatus.Past) e.status = EventStatus.Past
  })
  const filtered = list.filter((e) => e.status === EventStatus.Published || e.status === EventStatus.Past)
  return { ok: true, data: filtered }
}

export async function listAdminEvents(): Promise<ApiResponse<Event[]>> {
  await delay()
  // Admin sees all events, with derived status applied
  const list = events.map((e) => ({ ...e }))
  list.forEach((e) => {
    const derived = deriveStatus(e)
    if (derived === EventStatus.Past) e.status = EventStatus.Past
  })
  list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return { ok: true, data: list }
}

export async function getEventById(id: string): Promise<ApiResponse<Event>> {
  await delay()
  const ev = events.find((x) => x.id === id)
  if (!ev) return { ok: false, message: 'Event not found' }
  const copy = { ...ev }
  const derived = deriveStatus(copy)
  if (derived === EventStatus.Past) copy.status = EventStatus.Past
  return { ok: true, data: copy }
}

export async function authenticate(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
  await delay()
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) return { ok: false, message: 'User not found' }
  if (email === demoCredentials.email && password === demoCredentials.password) {
    return { ok: true, data: { user, token: 'demo-token-123' } }
  }
  if (password === 'password') return { ok: true, data: { user, token: 'demo-token-guest' } }
  return { ok: false, message: 'Invalid credentials', errors: { password: ['Invalid password'] } }
}

function validateEventInput(payload: Partial<Event>, isUpdate = false) {
  const errors: Record<string, string[]> = {}
  const add = (k: string, msg: string) => { errors[k] = errors[k] || []; errors[k].push(msg) }

  if (!isUpdate || payload.title !== undefined) {
    if (!payload.title || String(payload.title).trim() === '') add('title', 'Title is required')
    else if (String(payload.title).length > 150) add('title', 'Title must be 150 characters or fewer')
  }
  if (!isUpdate || payload.description !== undefined) {
    if (!payload.description || String(payload.description).trim() === '') add('description', 'Description is required')
  }
  // start and end required
  if (!isUpdate || payload.startDate !== undefined) {
    if (!payload.startDate) add('startDate', 'Start date and time are required')
    else if (Number.isNaN(Date.parse(payload.startDate as string))) add('startDate', 'Start date is not a valid datetime')
  }
  if (!isUpdate || payload.endDate !== undefined) {
    if (!payload.endDate) add('endDate', 'End date and time are required')
    else if (Number.isNaN(Date.parse(payload.endDate as string))) add('endDate', 'End date is not a valid datetime')
  }
  if (payload.startDate && payload.endDate) {
    const s = Date.parse(payload.startDate as string)
    const e = Date.parse(payload.endDate as string)
    if (!Number.isNaN(s) && !Number.isNaN(e) && e <= s) add('endDate', 'End date must be after start date')
  }

  // heroImage validation (optional)
  if (payload.heroImage) {
    const imgErrs = validateImageReference((payload as any).heroImage)
    if (imgErrs.length) errors['heroImage'] = imgErrs
  }

  return errors
}

export async function createEvent(payload: Partial<Event> & { title: string; organizerId?: string }): Promise<ApiResponse<Event>> {
  await delay()
  const errors = validateEventInput(payload, false)
  if (Object.keys(errors).length) return { ok: false, errors }

  const id = `evt_${Math.random().toString(36).slice(2, 9)}`
  const now = nowIso()
  const newEvent: Event = {
    id,
    title: payload.title,
    slug: (payload.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    shortDescription: payload.shortDescription || '',
    description: payload.description || '',
    status: payload.status || EventStatus.Draft,
    startDate: payload.startDate,
    endDate: payload.endDate,
    publishedAt: payload.publishedAt ?? null,
    createdAt: now,
    updatedAt: now,
    location: payload.location,
    isOnline: payload.isOnline ?? false,
    capacity: payload.capacity,
    priceCents: payload.priceCents ?? 0,
    currency: payload.currency || 'USD',
    tags: payload.tags || [],
    heroImage: (payload as any).heroImageUrl || (payload as any).heroImage || undefined,
    images: payload.images || [],
    organizerId: payload.organizerId,
  }
  // If published now and no publishedAt, set it
  if (newEvent.status === EventStatus.Published && !newEvent.publishedAt) newEvent.publishedAt = now
  events.push(newEvent)
  return { ok: true, data: newEvent }
}

export async function updateEvent(id: string, payload: Partial<Event>): Promise<ApiResponse<Event>> {
  await delay()
  const ev = events.find((x) => x.id === id)
  if (!ev) return { ok: false, message: 'Event not found' }
  const errors = validateEventInput(payload, true)
  if (Object.keys(errors).length) return { ok: false, errors }

  // apply updates
  if (payload.title !== undefined) {
    ev.title = payload.title as string
    ev.slug = (payload.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }
  if (payload.shortDescription !== undefined) ev.shortDescription = payload.shortDescription as string
  if (payload.description !== undefined) ev.description = payload.description as string
  if (payload.startDate !== undefined) ev.startDate = payload.startDate
  if (payload.endDate !== undefined) ev.endDate = payload.endDate
  if (payload.location !== undefined) ev.location = payload.location
  if (payload.isOnline !== undefined) ev.isOnline = payload.isOnline
  if (payload.capacity !== undefined) ev.capacity = payload.capacity
  if (payload.priceCents !== undefined) ev.priceCents = payload.priceCents
  if (payload.currency !== undefined) ev.currency = payload.currency
  if (payload.tags !== undefined) ev.tags = payload.tags
  if ((payload as any).heroImage !== undefined) ev.heroImage = (payload as any).heroImage
  if (payload.images !== undefined) ev.images = payload.images
  if (payload.organizerId !== undefined) ev.organizerId = payload.organizerId

  // status transitions
  if (payload.status !== undefined && payload.status !== ev.status) {
    ev.status = payload.status as EventStatus
    if (ev.status === EventStatus.Published && !ev.publishedAt) ev.publishedAt = nowIso()
  }

  ev.updatedAt = nowIso()
  return { ok: true, data: { ...ev } }
}

export async function deleteEvent(id: string): Promise<ApiResponse<null>> {
  await delay()
  const idx = events.findIndex((x) => x.id === id)
  if (idx === -1) return { ok: false, message: 'Event not found' }
  const ev = events[idx]
  if (ev.status !== EventStatus.Draft) return { ok: false, message: 'Only draft events can be deleted' }
  events.splice(idx, 1)
  return { ok: true, data: null }
}

export { events as seededEventList, users as seededUserList }
