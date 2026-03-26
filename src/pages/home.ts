export function renderHome() {
  const el = document.createElement('div')
  el.className = 'page page--public'
  el.innerHTML = `
    <main aria-label="Home" class="hero hero--community">
      <div class="container hero-inner">
        <div class="hero-content">
          <span class="hero-eyebrow">YOUR COMMUNITY, RECONNECTED</span>
          <h1 class="hero-title">Bringing Engagement Back to Your Local Community</h1>
          <p class="hero-sub">Never miss out on activities in your local community again. Browse the latest news and events, choose your interests and receive notifications from the organizations you follow.</p>
        </div>
      </div>
    </main>
  `
  return el
}
