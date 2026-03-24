import { demoCredentials } from './data/seed'

type Session = { user: any; token: string } | null

// In-memory session state. This intentionally does NOT persist to storage
// so a full page reload clears the session (matching requirements).
let current: Session = null

const listeners: Array<() => void> = []

export function isAuthenticated() {
  return current !== null
}

export function getSession() {
  return current
}

export function loginSession(user: any, token: string) {
  // For the prototype we only accept the seeded demo account as a manager
  if (!user || token == null) return false
  if (user.email !== demoCredentials.email) return false
  current = { user, token }
  listeners.forEach((l) => l())
  return true
}

export function logoutSession() {
  current = null
  listeners.forEach((l) => l())
}

export function onSessionChange(cb: () => void) {
  listeners.push(cb)
  return () => {
    const i = listeners.indexOf(cb)
    if (i !== -1) listeners.splice(i, 1)
  }
}
