export function renderHome() {
  const el = document.createElement('div')
  el.className = 'page page--public'
  el.innerHTML = `
    <main aria-label="Home" class="hero">
      <div class="container hero-inner">
        <div class="hero-content">
          <span class="hero-eyebrow">Fresh event pages for local communities</span>
          <h1 class="hero-title">Simple planning. Clear pages. Better turnout.</h1>
          <p class="hero-sub">Debori gives organizers a calm, modern way to publish events and helps attendees quickly see what is happening, when to show up, and why it matters.</p>

          <div class="hero-ctas">
            <a class="btn btn--primary btn--lg" href="#/events">View events</a>
            <a class="btn btn--secondary btn--lg" href="#/login">Sign in</a>
          </div>

          <div class="hero-metrics" aria-label="Platform highlights">
            <div class="hero-metric">
              <strong>Fast setup</strong>
              <span>Publish polished event pages in minutes.</span>
            </div>
            <div class="hero-metric">
              <strong>Clear updates</strong>
              <span>Keep guests informed without extra effort.</span>
            </div>
            <div class="hero-metric">
              <strong>Better discovery</strong>
              <span>Help more people find nearby events.</span>
            </div>
          </div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="hero-card">
            <div class="hero-card__top">
              <span class="hero-card__badge">Featured this week</span>
              <span class="hero-card__time">Sat · 6:30 PM</span>
            </div>
            <h2 class="hero-card__title">Community Night Market</h2>
            <p class="hero-card__text">A clean event page with the essentials up front: date, place, lineup, and quick updates for every attendee.</p>

            <div class="hero-card__details">
              <div class="hero-card__detail">
                <span class="hero-card__label">Location</span>
                <strong>Riverside Square</strong>
              </div>
              <div class="hero-card__detail">
                <span class="hero-card__label">Attendance</span>
                <strong>240 expected</strong>
              </div>
              <div class="hero-card__detail">
                <span class="hero-card__label">Mood</span>
                <strong>Local, warm, easy</strong>
              </div>
            </div>

            <div class="hero-card__tags">
              <span>Mobile-friendly</span>
              <span>Live updates</span>
              <span>Easy check-in</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  `
  return el
}
