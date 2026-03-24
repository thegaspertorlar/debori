import { Event, EventStatus, User } from '../models'

const now = new Date()
const iso = (d: Date) => d.toISOString()

export const users: User[] = [
  {
    id: 'user_001',
    email: 'demo@debori.com',
    name: 'Demo Manager',
    role: 'manager',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    bio: 'Prototype account for demonstrating admin flows and event management.',
  },
  {
    id: 'user_002',
    email: 'sarah@communityhub.org',
    name: 'Sarah Lin',
    role: 'organizer',
    avatarUrl:
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=400&h=400&fit=crop',
    bio: 'Community events organizer focused on family-friendly programming.',
  },
  {
    id: 'user_003',
    email: 'mike@startupco.com',
    name: 'Mike Torres',
    role: 'organizer',
    avatarUrl:
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&h=400&fit=crop',
    bio: 'Startup founder and meetup host.',
  },
]

// Helper to build event ids
let eid = 1
const mkid = (prefix = 'evt') => `${prefix}_${(eid++).toString().padStart(3, '0')}`

export const events: Event[] = [
  // Published - upcoming
  {
    id: mkid(),
    title: 'Bay Area Startup Pitch Night',
    slug: 'bay-area-startup-pitch-night',
    shortDescription: 'Early-stage founders pitch to local investors and mentors.',
    description:
      'A curated evening where 8 pre-vetted early-stage startups each get 7 minutes to pitch, followed by networking with VCs and angel investors. Light refreshments provided.',
    status: EventStatus.Published,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 1, 12, 18, 30)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 1, 12, 21, 0)),
    publishedAt: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
    createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 1, 20)),
    updatedAt: iso(new Date()),
    location: {
      address: 'Pier 27, 750 The Embarcadero',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94111',
      country: 'USA',
      lat: 37.785, lng: -122.391,
    },
    isOnline: false,
    capacity: 180,
    priceCents: 2500,
    currency: 'USD',
    tags: ['startups', 'pitch', 'networking'],
    heroImage:
      'https://images.unsplash.com/photo-1531058020387-3be344556be6?w=1200&h=800&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&h=800&fit=crop',
    ],
    organizerId: 'user_003',
  },

  {
    id: mkid(),
    title: 'Sunset Yoga on the Pier',
    slug: 'sunset-yoga-on-the-pier',
    shortDescription: '60-minute all-levels yoga class overlooking the bay.',
    description:
      'Join instructor Maya for an all-levels vinyasa flow as the sun sets over the water. Bring a mat and layers—it gets cool after dusk. Space is limited.',
    status: EventStatus.Published,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 0, now.getDate() + 10, 18, 0)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 0, now.getDate() + 10, 19, 15)),
    publishedAt: iso(new Date(now.getFullYear(), now.getMonth() - 1, 15)),
    createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 2, 3)),
    updatedAt: iso(new Date()),
    location: {
      address: 'Marina Green, 501 Marina Blvd',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94123',
      country: 'USA',
      lat: 37.805, lng: -122.436,
    },
    isOnline: false,
    capacity: 60,
    priceCents: 1500,
    currency: 'USD',
    tags: ['wellness', 'yoga', 'outdoors'],
    heroImage:
      'https://images.unsplash.com/photo-1505666281782-86a5ad07b6c6?w=1200&h=800&fit=crop',
    organizerId: 'user_002',
  },

  {
    id: mkid(),
    title: 'Neighborhood Farmers Market',
    slug: 'neighborhood-farmers-market',
    shortDescription: 'Local farmers, bakers, and makers gather every Saturday.',
    description:
      'A family-friendly market featuring local produce, artisanal breads, fresh flowers, and handmade goods. Free admission. Live music from local performers on the green.',
    status: EventStatus.Published,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 0, now.getDate() + 17, 9, 0)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 0, now.getDate() + 17, 13, 0)),
    publishedAt: iso(new Date(now.getFullYear(), now.getMonth() - 3, 10)),
    createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 3, 1)),
    updatedAt: iso(new Date()),
    location: {
      address: 'Oak & 3rd Street',
      city: 'Oakland',
      state: 'CA',
      postalCode: '94607',
      country: 'USA',
      lat: 37.803, lng: -122.271,
    },
    isOnline: false,
    capacity: 400,
    priceCents: 0,
    currency: 'USD',
    tags: ['community', 'market', 'food'],
    heroImage:
      'https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=1200&h=800&fit=crop',
  },

  // Drafts
  {
    id: mkid(),
    title: 'Interactive Kids Science Workshop',
    slug: 'interactive-kids-science-workshop',
    shortDescription: 'Hands-on STEM activities for kids ages 6–12.',
    description:
      'A morning of guided experiments, build-and-learn stations, and a short science show. Perfect for families and school groups. Draft program—final schedule TBD.',
    status: EventStatus.Draft,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 2, 5, 10, 0)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 2, 5, 12, 0)),
    publishedAt: null,
    createdAt: iso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10)),
    updatedAt: iso(new Date()),
    location: {
      address: 'Community Hall, 88 Park Lane',
      city: 'Berkeley',
      state: 'CA',
      postalCode: '94704',
      country: 'USA',
      lat: 37.871, lng: -122.273,
    },
    isOnline: false,
    capacity: 45,
    priceCents: 2000,
    currency: 'USD',
    tags: ['kids', 'education', 'STEM'],
    heroImage:
      'https://images.unsplash.com/photo-1581091228506-7f0b7be9b6f2?w=1200&h=800&fit=crop',
  },

  {
    id: mkid(),
    title: 'Autumn Photography Walk',
    slug: 'autumn-photography-walk',
    shortDescription: 'Guided city walk focused on composition and lighting.',
    description:
      'Meet local photographer Ana for a relaxed walk through historic neighborhoods. Suitable for beginners and hobbyists. Draft — route and stops being finalized.',
    status: EventStatus.Draft,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 3, 21, 15, 30)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 3, 21, 17, 30)),
    publishedAt: null,
    createdAt: iso(new Date()),
    updatedAt: iso(new Date()),
    location: {
      address: 'Meet at City Library Steps',
      city: 'San Jose',
      state: 'CA',
      postalCode: '95113',
      country: 'USA',
      lat: 37.335, lng: -121.886,
    },
    isOnline: false,
    capacity: 20,
    priceCents: 1200,
    currency: 'USD',
    tags: ['photography', 'outdoors'],
    heroImage:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1200&h=800&fit=crop',
  },

  // Past events
  {
    id: mkid(),
    title: 'Winter Holiday Charity Gala',
    slug: 'winter-holiday-charity-gala',
    shortDescription: 'Formal dinner and auction raising funds for local shelters.',
    description:
      'A black-tie evening with a three-course meal, live auction, and guest speaker. All proceeds support emergency housing programs in the region.',
    status: EventStatus.Past,
    startDate: iso(new Date(now.getFullYear() - 1, 11, 15, 19, 0)),
    endDate: iso(new Date(now.getFullYear() - 1, 11, 15, 23, 0)),
    publishedAt: iso(new Date(now.getFullYear() - 1, 9, 20)),
    createdAt: iso(new Date(now.getFullYear() - 1, 8, 12)),
    updatedAt: iso(new Date(now.getFullYear() - 1, 11, 16)),
    location: {
      address: 'Grand Ballroom, 1000 Market St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'USA',
      lat: 37.774, lng: -122.419,
    },
    isOnline: false,
    capacity: 500,
    priceCents: 25000,
    currency: 'USD',
    tags: ['charity', 'gala', 'fundraiser'],
    heroImage:
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&h=800&fit=crop',
  },

  {
    id: mkid(),
    title: 'Indie Film Screening: Short Works',
    slug: 'indie-film-screening-short-works',
    shortDescription: 'An evening of curated short films from emerging directors.',
    description:
      'Featuring 7 short films across genres, followed by a Q&A with filmmakers. Small reception after the screening.',
    status: EventStatus.Past,
    startDate: iso(new Date(now.getFullYear() - 1, now.getMonth() - 2, 18, 19, 30)),
    endDate: iso(new Date(now.getFullYear() - 1, now.getMonth() - 2, 18, 22, 0)),
    publishedAt: iso(new Date(now.getFullYear() - 1, now.getMonth() - 3, 3)),
    createdAt: iso(new Date(now.getFullYear() - 1, now.getMonth() - 4, 5)),
    updatedAt: iso(new Date(now.getFullYear() - 1, now.getMonth() - 2, 20)),
    location: {
      address: 'Rivertown Cinema, 22 Film Row',
      city: 'Palo Alto',
      state: 'CA',
      postalCode: '94301',
      country: 'USA',
    },
    isOnline: false,
    capacity: 120,
    priceCents: 1200,
    currency: 'USD',
    tags: ['film', 'screening', 'indie'],
    heroImage:
      'https://images.unsplash.com/photo-1517604931442-7f3b1a8b5e39?w=1200&h=800&fit=crop',
  },

  {
    id: mkid(),
    title: 'City Marathon — 10K & Half',
    slug: 'city-marathon-10k-half',
    shortDescription: 'Annual road race with community cheering stations and post-race festival.',
    description:
      'A well-supported 10K and half-marathon through downtown and waterfront routes. Aid stations every 2–3 miles. Post-race festival with food trucks and live music.',
    status: EventStatus.Past,
    startDate: iso(new Date(now.getFullYear() - 1, 4, 2, 7, 0)),
    endDate: iso(new Date(now.getFullYear() - 1, 4, 2, 13, 0)),
    publishedAt: iso(new Date(now.getFullYear() - 1, 1, 10)),
    createdAt: iso(new Date(now.getFullYear() - 1, 0, 12)),
    updatedAt: iso(new Date(now.getFullYear() - 1, 3, 8)),
    location: {
      address: 'Start Line, Civic Center Plaza',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'USA',
    },
    isOnline: false,
    capacity: 3000,
    priceCents: 4500,
    currency: 'USD',
    tags: ['sports', 'running', 'community'],
  },

  // More published
  {
    id: mkid(),
    title: 'Downtown Makers & Crafts Fair',
    slug: 'downtown-makers-crafts-fair',
    shortDescription: 'Handmade goods and artisan booths across three city blocks.',
    description:
      'Over 80 makers featuring ceramics, textiles, small-batch foods, and live craft demonstrations. Kid-friendly activities and a beer & wine garden.',
    status: EventStatus.Published,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 1, 5, 10, 0)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 1, 5, 17, 0)),
    publishedAt: iso(new Date(now.getFullYear(), now.getMonth() - 1, 5)),
    createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 2, 2)),
    updatedAt: iso(new Date()),
    location: {
      address: 'Main St between 5th & 8th',
      city: 'Oakland',
      state: 'CA',
      postalCode: '94607',
      country: 'USA',
    },
    isOnline: false,
    capacity: 2000,
    priceCents: 0,
    currency: 'USD',
    tags: ['crafts', 'market', 'local'],
    heroImage:
      'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=1200&h=800&fit=crop',
  },

  {
    id: mkid(),
    title: 'Virtual Workshop: Remote Team Facilitation',
    slug: 'virtual-workshop-remote-team-facilitation',
    shortDescription: 'Practical techniques for leading engaging remote workshops.',
    description:
      'A live online session covering facilitation patterns, tools, and real-time practice exercises. Includes a follow-up resource pack.',
    status: EventStatus.Published,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 0, now.getDate() + 21, 10, 0)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 0, now.getDate() + 21, 12, 30)),
    publishedAt: iso(new Date(now.getFullYear(), now.getMonth() - 2, 4)),
    createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 3, 22)),
    updatedAt: iso(new Date()),
    isOnline: true,
    capacity: 120,
    priceCents: 3500,
    currency: 'USD',
    tags: ['professional development', 'remote work', 'webinar'],
    heroImage:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981d?w=1200&h=800&fit=crop',
    organizerId: 'user_001',
  },

  {
    id: mkid(),
    title: 'Craft Beer & Local Bites Festival',
    slug: 'craft-beer-local-bites-festival',
    shortDescription: 'Taste from 20+ breweries and 10 local food vendors.',
    description:
      'A tasting festival showcasing regional breweries paired with street food vendors. Limited tickets include tasting tokens and a souvenir glass.',
    status: EventStatus.Published,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 2, 12, 13, 0)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 2, 12, 20, 0)),
    publishedAt: iso(new Date(now.getFullYear(), now.getMonth() - 1, 12)),
    createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
    updatedAt: iso(new Date()),
    location: {
      address: 'Old Port Warehouse District',
      city: 'Oakland',
      state: 'CA',
      postalCode: '94607',
      country: 'USA',
    },
    isOnline: false,
    capacity: 2500,
    priceCents: 5500,
    currency: 'USD',
    tags: ['food', 'beer', 'festival'],
    heroImage:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop',
  },

  // More drafts
  {
    id: mkid(),
    title: 'Hands-On Sourdough Baking Class',
    slug: 'hands-on-sourdough-baking-class',
    shortDescription: 'Learn the fundamentals of sourdough from starter to loaf.',
    description:
      'A practical baker-led class where everyone takes home a jar of starter and a shaped loaf. Equipment list and ingredient pack included in the final ticket.',
    status: EventStatus.Draft,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 4, 8, 10, 0)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 4, 8, 14, 0)),
    publishedAt: null,
    createdAt: iso(new Date()),
    updatedAt: iso(new Date()),
    location: {
      address: 'BakeLab Studio, 12 Baker St',
      city: 'San Mateo',
      state: 'CA',
      postalCode: '94401',
      country: 'USA',
    },
    isOnline: false,
    capacity: 14,
    priceCents: 6500,
    currency: 'USD',
    tags: ['food', 'class', 'baking'],
  },

  {
    id: mkid(),
    title: 'Neighborhood Jazz Night',
    slug: 'neighborhood-jazz-night',
    shortDescription: 'An intimate evening of live jazz and cocktails.',
    description:
      'Featuring a rotating lineup of local jazz quartets. Small venue with limited seating—ideal for date nights and music lovers.',
    status: EventStatus.Published,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 0, now.getDate() + 30, 19, 30)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 0, now.getDate() + 30, 22, 0)),
    publishedAt: iso(new Date(now.getFullYear(), now.getMonth() - 1, 7)),
    createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 2, 28)),
    updatedAt: iso(new Date()),
    location: {
      address: 'Blue Note Room, 44 Jazz Alley',
      city: 'Berkeley',
      state: 'CA',
      postalCode: '94704',
      country: 'USA',
    },
    isOnline: false,
    capacity: 90,
    priceCents: 3000,
    currency: 'USD',
    tags: ['music', 'jazz', 'nightlife'],
    heroImage:
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=800&fit=crop',
  },

  {
    id: mkid(),
    title: 'Community History Walking Tour',
    slug: 'community-history-walking-tour',
    shortDescription: 'Discover the stories and architecture of the old town district.',
    description:
      'A 90-minute guided walk led by local historians. Includes archival photos and a map for self-guided follow-up.',
    status: EventStatus.Published,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 0, now.getDate() + 7, 10, 0)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 0, now.getDate() + 7, 11, 30)),
    publishedAt: iso(new Date(now.getFullYear(), now.getMonth() - 2, 2)),
    createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 3, 19)),
    updatedAt: iso(new Date()),
    location: {
      address: 'Old Town Square',
      city: 'Petaluma',
      state: 'CA',
      postalCode: '94952',
      country: 'USA',
    },
    isOnline: false,
    capacity: 60,
    priceCents: 1500,
    currency: 'USD',
    tags: ['history', 'walk', 'education'],
  },

  {
    id: mkid(),
    title: 'Open Air Classical Concert',
    slug: 'open-air-classical-concert',
    shortDescription: 'String quartet performing works by Vivaldi and Piazzolla.',
    description:
      'A free community concert in the park. Bring blankets and picnics. Program runs 60 minutes with an encore.',
    status: EventStatus.Published,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 1, 22, 17, 0)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 1, 22, 18, 30)),
    publishedAt: iso(new Date(now.getFullYear(), now.getMonth() - 1, 20)),
    createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 2, 7)),
    updatedAt: iso(new Date()),
    location: {
      address: 'Riverside Park Bandstand',
      city: 'Concord',
      state: 'CA',
      postalCode: '94520',
      country: 'USA',
    },
    isOnline: false,
    capacity: 800,
    priceCents: 0,
    currency: 'USD',
    tags: ['music', 'classical', 'community'],
  },

  {
    id: mkid(),
    title: 'Design Thinking Workshop for Educators',
    slug: 'design-thinking-workshop-educators',
    shortDescription: 'Practical curriculum design patterns for K–12 teachers.',
    description:
      'A full-day in-person workshop with hands-on templates, team exercises, and take-home lesson plans tailored for classroom use.',
    status: EventStatus.Published,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 3, 3, 9, 0)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 3, 3, 17, 0)),
    publishedAt: iso(new Date(now.getFullYear(), now.getMonth() - 1, 18)),
    createdAt: iso(new Date(now.getFullYear(), now.getMonth() - 2, 10)),
    updatedAt: iso(new Date()),
    location: {
      address: 'Education Center, 200 Learning Way',
      city: 'Fremont',
      state: 'CA',
      postalCode: '94536',
      country: 'USA',
    },
    isOnline: false,
    capacity: 75,
    priceCents: 8500,
    currency: 'USD',
    tags: ['education', 'workshop'],
    heroImage:
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1200&h=800&fit=crop',
  },

  // Final draft
  {
    id: mkid(),
    title: 'Neighborhood Film Night — Outdoor Screening',
    slug: 'neighborhood-film-night-outdoor-screening',
    shortDescription: 'Community outdoor screening of a family-friendly feature film.',
    description:
      'Bring blankets, chairs, and snacks. Food trucks and popcorn vendor on site. Movie starts at sundown. Draft: licensing in progress.',
    status: EventStatus.Draft,
    startDate: iso(new Date(now.getFullYear(), now.getMonth() + 5, 9, 19, 0)),
    endDate: iso(new Date(now.getFullYear(), now.getMonth() + 5, 9, 22, 0)),
    publishedAt: null,
    createdAt: iso(new Date()),
    updatedAt: iso(new Date()),
    location: {
      address: 'Lincoln Park Open Field',
      city: 'Santa Rosa',
      state: 'CA',
      postalCode: '95401',
      country: 'USA',
    },
    isOnline: false,
    capacity: 600,
    priceCents: 0,
    currency: 'USD',
    tags: ['film', 'outdoors', 'family'],
  },
]

export const demoCredentials = {
  email: 'demo@debori.com',
  password: 'Demo1234!',
}

export default {
  users,
  events,
  demoCredentials,
}
