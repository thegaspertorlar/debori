type Route = {
  path: string
  render: (params: Record<string, string>) => HTMLElement
  // mark routes that require an authenticated manager session
  protected?: boolean
}

function pathToRegex(path: string) {
  // convert /events/:id to ^/events/([^/]+)$
  const pattern = path.replace(/:[^/]+/g, '([^/]+)')
  return new RegExp('^' + pattern + '$')
}

function extractParams(routePath: string, actualPath: string) {
  const paramNames = (routePath.match(/:([^/]+)/g) || []).map((s) => s.substring(1))
  const regex = pathToRegex(routePath)
  const m = actualPath.match(regex)
  const params: Record<string, string> = {}
  if (!m) return params
  paramNames.forEach((name, i) => {
    params[name] = m[i + 1]
  })
  return params
}

import { isAuthenticated } from './session'

export class Router {
  routes: Route[]
  outlet: HTMLElement

  constructor(routes: Route[], outlet: HTMLElement) {
    this.routes = routes
    this.outlet = outlet

    window.addEventListener('hashchange', () => {
      this.handle(location.hash.replace(/^#/, ''))
    })
    // handle initial
    this.handle(location.hash.replace(/^#/, ''))
  }

  handle(path: string) {
    const clean = path || '/home'
    // find route with longest matching prefix
    for (const r of this.routes) {
      const regex = pathToRegex(r.path)
      if (regex.test(clean)) {
        // protect routes before rendering so protected screens never flash
        if (r.protected && !isAuthenticated()) {
          // redirect to login
          location.hash = '/login'
          return
        }
        const params = extractParams(r.path, clean)
        const node = r.render(params)
        this.renderNode(node)
        return
      }
    }
    // no match -> fallback to home
    const home = this.routes.find((x) => x.path === '/home')!
    this.renderNode(home.render({}))
  }

  navigate(path: string) {
    location.hash = path
  }

  private renderNode(node: HTMLElement) {
    // smooth replace without flashing: create wrapper and animate
    const wrapper = document.createElement('div')
    wrapper.className = 'page-wrap page-enter'
    wrapper.appendChild(node)

    // remove existing content immediately but keep node out of DOM until wrapped
    this.outlet.innerHTML = ''
    this.outlet.appendChild(wrapper)

    // trigger enter animation
    requestAnimationFrame(() => {
      wrapper.classList.remove('page-enter')
    })

    // focus main for accessibility
    this.outlet.focus()
  }
}
