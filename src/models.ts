export enum EventStatus {
  Draft = 'draft',
  Published = 'published',
  Past = 'past',
  Cancelled = 'cancelled',
}

export interface Location {
  address: string
  city: string
  state?: string
  postalCode?: string
  country?: string
  lat?: number
  lng?: number
}

export interface User {
  id: string
  email: string
  name: string
  role: 'manager' | 'organizer' | 'attendee' | 'admin'
  avatarUrl?: string
  bio?: string
}

export interface Event {
  id: string
  title: string
  slug: string
  shortDescription: string
  description: string
  status: EventStatus
  startDate?: string // ISO
  endDate?: string // ISO
  publishedAt?: string | null
  createdAt: string
  updatedAt: string
  location?: Location
  isOnline?: boolean
  capacity?: number
  priceCents?: number | null
  currency?: string
  tags?: string[]
  heroImage?: string
  images?: string[]
  organizerId?: string
}
