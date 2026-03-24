import { events as seededEvents, users as seededUsers, demoCredentials } from '../data/seed'
import { Event, User, EventStatus } from '../models'

// Simple in-memory copies so UI can import and mutate if needed in demo
const events: Event[] = JSON.parse(JSON.stringify(seededEvents))
const users: User[] = JSON.parse(JSON.stringify(seededUsers))

export function listPublicEvents(): Event[] {
  // Public browsing shows published events and recent past events
  const now = new Date().toISOString()
  return events.filter((e) => {
    if (e.status === EventStatus.Published) return true
    if (e.status === EventStatus.Past) return true
    return false
  })
}

export function listAdminEvents(): Event[] {
  // All events for admin/manager management
  return events.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function getEventById(id: string): Event | undefined {
  return events.find((e) => e.id === id)
}

export function findEventsByTag(tag: string): Event[] {
  return events.filter((e) => (e.tags || []).includes(tag))
}

export function authenticate(email: string, password: string): { ok: boolean; user?: User; token?: string; error?: string } {
  // Extremely simple demo auth
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
  if (!user) return { ok: false, error: 'User not found' }
  if (email === demoCredentials.email && password === demoCredentials.password) {
    return { ok: true, user, token: 'demo-token-123' }
  }
  // For other seeded users accept any password that equals 'password'
  if (password === 'password') return { ok: true, user, token: 'demo-token-guest' }
  return { ok: false, error: 'Invalid credentials' }
}

export function createEvent(event: Partial<Event> & { title: string; organizerId?: string }): Event {
  const id = `evt_${Math.random().toString(36).slice(2, 9)}`
  const now = new Date().toISOString()
  const newEvent: Event = {
    id,
    title: event.title,
    slug: (event.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    shortDescription: event.shortDescription || '',
    description: event.description || '',
    status: event.status || EventStatus.Draft,
    startDate: event.startDate,
    endDate: event.endDate,
    publishedAt: event.publishedAt ?? null,
    createdAt: now,
    updatedAt: now,
    location: event.location,
    isOnline: event.isOnline ?? false,
    capacity: event.capacity,
    priceCents: event.priceCents ?? 0,
    currency: event.currency || 'USD',
    tags: event.tags || [],
    heroImage: event.heroImage,
    images: event.images || [],
    organizerId: event.organizerId,
  }
  events.push(newEvent)
  return newEvent
}

export { events as seededEventList, users as seededUserList }
