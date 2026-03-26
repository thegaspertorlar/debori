import type { Event } from './models'

export type EventHeroLike = Pick<Event, 'id' | 'title' | 'slug' | 'heroImage' | 'tags' | 'location' | 'isOnline'>

type HeroTheme = {
  label: string
  eyebrow: string
  start: string
  end: string
  accent: string
  glow: string
  motif: 'wave' | 'grid' | 'rings' | 'spotlight' | 'path' | 'tile'
}

const HERO_THEMES: Array<{ keywords: string[]; theme: HeroTheme }> = [
  {
    keywords: ['online', 'remote', 'webinar', 'virtual'],
    theme: {
      label: 'Remote session',
      eyebrow: 'Live online',
      start: '#14213d',
      end: '#243b53',
      accent: '#8ecae6',
      glow: 'rgba(142, 202, 230, 0.42)',
      motif: 'grid',
    },
  },
  {
    keywords: ['yoga', 'wellness', 'outdoors', 'sunset'],
    theme: {
      label: 'Wellness gathering',
      eyebrow: 'Fresh air series',
      start: '#355070',
      end: '#6d597a',
      accent: '#eaac8b',
      glow: 'rgba(234, 172, 139, 0.36)',
      motif: 'wave',
    },
  },
  {
    keywords: ['market', 'craft', 'makers', 'food', 'beer', 'festival'],
    theme: {
      label: 'Local favorites',
      eyebrow: 'Curated community event',
      start: '#264653',
      end: '#2a9d8f',
      accent: '#e9c46a',
      glow: 'rgba(233, 196, 106, 0.34)',
      motif: 'tile',
    },
  },
  {
    keywords: ['music', 'jazz', 'classical', 'concert'],
    theme: {
      label: 'Live performance',
      eyebrow: 'Featured evening',
      start: '#1d3557',
      end: '#6d2e46',
      accent: '#f4a261',
      glow: 'rgba(244, 162, 97, 0.34)',
      motif: 'spotlight',
    },
  },
  {
    keywords: ['walk', 'history', 'tour', 'photography'],
    theme: {
      label: 'Guided experience',
      eyebrow: 'City discovery',
      start: '#283618',
      end: '#606c38',
      accent: '#dda15e',
      glow: 'rgba(221, 161, 94, 0.32)',
      motif: 'path',
    },
  },
  {
    keywords: ['startup', 'pitch', 'design', 'workshop', 'education'],
    theme: {
      label: 'Hands-on learning',
      eyebrow: 'Professional growth',
      start: '#2b2d42',
      end: '#4a4e69',
      accent: '#f2cc8f',
      glow: 'rgba(242, 204, 143, 0.34)',
      motif: 'rings',
    },
  },
]

const DEFAULT_THEME: HeroTheme = {
  label: 'Community event',
  eyebrow: 'Featured gathering',
  start: '#1f3c88',
  end: '#39a0ed',
  accent: '#f6bd60',
  glow: 'rgba(246, 189, 96, 0.34)',
  motif: 'wave',
}

function escapeSvg(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1).trimEnd()}…`
}

function pickTheme(event: EventHeroLike) {
  if (event.isOnline) return HERO_THEMES[0].theme
  const haystack = [event.title, event.slug, ...(event.tags || []), event.location?.city]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return HERO_THEMES.find(({ keywords }) => keywords.some((keyword) => haystack.includes(keyword)))?.theme || DEFAULT_THEME
}

function motifMarkup(theme: HeroTheme) {
  switch (theme.motif) {
    case 'grid':
      return `
        <g opacity="0.18" stroke="${theme.accent}" stroke-width="2">
          <path d="M1040 110h360" />
          <path d="M1040 180h360" />
          <path d="M1040 250h360" />
          <path d="M1040 320h360" />
          <path d="M1100 70v310" />
          <path d="M1190 70v310" />
          <path d="M1280 70v310" />
          <path d="M1370 70v310" />
        </g>
      `
    case 'rings':
      return `
        <g fill="none" stroke="${theme.accent}" opacity="0.22">
          <circle cx="1230" cy="220" r="160" stroke-width="26" />
          <circle cx="1230" cy="220" r="96" stroke-width="18" />
          <circle cx="1230" cy="220" r="38" stroke-width="14" />
        </g>
      `
    case 'spotlight':
      return `
        <g>
          <path d="M1130 60L1380 60L1270 430L1240 430Z" fill="rgba(255,255,255,0.10)" />
          <circle cx="1260" cy="220" r="150" fill="${theme.glow}" />
        </g>
      `
    case 'path':
      return `
        <g opacity="0.34">
          <path d="M1030 380C1120 320 1190 200 1290 160C1360 130 1450 160 1500 220" fill="none" stroke="${theme.accent}" stroke-width="34" stroke-linecap="round" />
          <path d="M1070 420C1160 360 1230 240 1330 200" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="12" stroke-linecap="round" />
        </g>
      `
    case 'tile':
      return `
        <g opacity="0.18">
          <rect x="1060" y="86" width="118" height="118" rx="22" fill="${theme.accent}" />
          <rect x="1200" y="140" width="118" height="118" rx="22" fill="rgba(255,255,255,0.18)" />
          <rect x="1340" y="84" width="118" height="118" rx="22" fill="${theme.accent}" />
          <rect x="1128" y="280" width="118" height="118" rx="22" fill="rgba(255,255,255,0.18)" />
          <rect x="1268" y="234" width="118" height="118" rx="22" fill="${theme.accent}" />
        </g>
      `
    case 'wave':
    default:
      return `
        <g opacity="0.28">
          <path d="M950 300C1040 240 1130 240 1220 300C1310 360 1400 360 1490 300V520H950Z" fill="${theme.accent}" />
          <path d="M980 350C1070 290 1160 290 1250 350C1340 410 1430 410 1520 350" fill="none" stroke="rgba(255,255,255,0.20)" stroke-width="12" stroke-linecap="round" />
        </g>
      `
  }
}

export function buildEventHeroSvgDataUri(event: EventHeroLike) {
  const theme = pickTheme(event)
  const title = escapeSvg(truncate(event.title || 'Featured event', 48))
  const city = event.isOnline ? 'Online event' : event.location?.city || theme.label
  const subtitle = escapeSvg(truncate(city, 28))
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" role="img" aria-label="${title}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${theme.start}" />
          <stop offset="100%" stop-color="${theme.end}" />
        </linearGradient>
        <linearGradient id="panel" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="rgba(255,255,255,0.18)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0.05)" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#bg)" />
      <circle cx="1310" cy="160" r="214" fill="${theme.glow}" />
      <circle cx="1510" cy="740" r="204" fill="rgba(255,255,255,0.08)" />
      <rect x="72" y="90" width="860" height="720" rx="42" fill="url(#panel)" stroke="rgba(255,255,255,0.16)" />
      ${motifMarkup(theme)}
      <rect x="118" y="146" width="248" height="52" rx="26" fill="rgba(255,255,255,0.12)" />
      <text x="242" y="180" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="700" fill="#ffffff" letter-spacing="1.4">${escapeSvg(theme.eyebrow.toUpperCase())}</text>
      <text x="118" y="326" font-family="Inter, Arial, sans-serif" font-size="82" font-weight="800" fill="#ffffff">${title}</text>
      <text x="118" y="394" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="600" fill="rgba(255,255,255,0.82)">${subtitle}</text>
      <rect x="118" y="466" width="224" height="4" rx="2" fill="${theme.accent}" />
      <text x="118" y="562" font-family="Inter, Arial, sans-serif" font-size="36" font-weight="700" fill="#ffffff">${escapeSvg(theme.label)}</text>
      <text x="118" y="620" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="500" fill="rgba(255,255,255,0.74)">Curated event artwork generated from event metadata.</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function isSvgDataUri(source: string) {
  return /^data:image\/svg\+xml(?:;charset=[^,;]+)?(?:;base64)?,/i.test(source)
}

function isSvgUrl(source: string) {
  return /^(https?:\/\/|\/|\.\/|\.\.\/).+\.svg(?:[?#].*)?$/i.test(source)
}

function isSvgSource(source: string) {
  return isSvgDataUri(source) || isSvgUrl(source)
}

export function normalizeEventHeroImage(event: EventHeroLike) {
  const source = typeof event.heroImage === 'string' ? event.heroImage.trim() : ''
  if (source && isSvgSource(source)) return source
  return buildEventHeroSvgDataUri(event)
}

export function resolveEventHeroImage(event: EventHeroLike) {
  return normalizeEventHeroImage(event)
}
