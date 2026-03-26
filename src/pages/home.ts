export function renderHome() {
  const el = document.createElement('div')
  el.className = 'page page--public'
  el.innerHTML = `
    <main aria-label="Home" class="hero">
      <div class="container hero-inner">
        <div class="hero-content">
          <div class="hero-eyebrow-wrap">
            <span class="hero-eyebrow">Trusted local event platform</span>
            <span class="hero-status">Live schedules · Smooth check-ins</span>
          </div>

          <h1 class="hero-title">Bring your community together with a brighter, greener event experience</h1>
          <p class="hero-sub">Debori helps organizers launch polished local events faster, while giving attendees a clean, welcoming place to discover what is happening nearby.</p>

          <div class="hero-ctas">
            <a class="btn btn--primary btn--lg" href="#/events">View events</a>
            <a class="btn btn--secondary btn--lg" href="#/login">Sign in</a>
          </div>

          <div class="hero-highlights" aria-label="Platform highlights">
            <div class="hero-highlight">
              <strong>Fast setup</strong>
              <span>Publish community events in minutes with clear details and confident controls.</span>
            </div>
            <div class="hero-highlight">
              <strong>Local discovery</strong>
              <span>Make it easy for people to find neighborhood workshops, meetups, and fundraisers.</span>
            </div>
            <div class="hero-highlight">
              <strong>Reliable experience</strong>
              <span>Keep everything calm, consistent, and easy to trust from launch to attendance.</span>
            </div>
          </div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="hero-panel">
            <div class="hero-panel__glow"></div>
            <div class="hero-panel__card hero-panel__card--primary">
              <div class="hero-panel__topline">
                <span class="hero-panel__pill">Featured event</span>
                <span class="hero-panel__meta">This weekend</span>
              </div>
              <h2 class="hero-panel__title">Riverside Green Market</h2>
              <p class="hero-panel__text">Fresh local vendors, family activities, and live acoustic music in one easy-to-share event page.</p>

              <div class="hero-panel__stats">
                <div>
                  <span class="hero-panel__stat-value">240+</span>
                  <span class="hero-panel__stat-label">expected guests</span>
                </div>
                <div>
                  <span class="hero-panel__stat-value">18</span>
                  <span class="hero-panel__stat-label">local vendors</span>
                </div>
                <div>
                  <span class="hero-panel__stat-value">4.9★</span>
                  <span class="hero-panel__stat-label">organizer rating</span>
                </div>
              </div>
            </div>

            <div class="hero-panel__card hero-panel__card--secondary">
              <div class="hero-panel__mini-row">
                <span class="hero-panel__dot"></span>
                <span>Attendance updates synced</span>
              </div>
              <div class="hero-panel__mini-row">
                <span class="hero-panel__dot hero-panel__dot--soft"></span>
                <span>Friendly pages for every device</span>
              </div>
              <div class="hero-panel__mini-row">
                <span class="hero-panel__dot hero-panel__dot--accent"></span>
                <span>Designed for neighborhood momentum</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  `
  return el
}
