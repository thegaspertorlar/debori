export function renderHome() {
  const el = document.createElement('div')
  el.className = 'page page--public'
  el.innerHTML = `
    <main aria-label="Home" class="hero">
      <div class="container hero-inner">
        <div class="hero-content">
          <h1 class="hero-title">Debori — Simple community events that just work</h1>
          <p class="hero-sub">Create, discover, and manage local events with a calm, trustworthy experience designed for organizers and attendees.</p>

          <div class="hero-ctas">
            <a class="btn btn--primary btn--lg" href="#/events">View events</a>
            <a class="btn btn--secondary btn--lg" href="#/login">Sign in</a>
          </div>
        </div>
      </div>
    </main>
  `
  return el
}
