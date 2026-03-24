type Route = {
  path: string
  render: (params: Record<string, string>) => HTMLElement
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
    this.outlet.innerHTML = ''
    this.outlet.appendChild(node)
    // focus main for accessibility
    this.outlet.focus()
  }
}
