import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Today', icon: TodayIcon, match: (path) => path === '/' },
  { to: '/patients', label: 'Patients', icon: PeopleIcon, match: (path) => path.startsWith('/patients') && path !== '/patients/new' },
  { to: '/patients/new', label: 'Register', icon: PlusIcon, match: (path) => path === '/patients/new' },
]

export default function Shell({ children }) {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [pathname, hash])

  return (
    <div className="shell">
      <a className="skip" href="#content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" to="/">
          <span className="mark" aria-hidden="true">
            <LeafIcon />
          </span>
          <span>
            <strong>Homeo</strong>
            <small>Case book</small>
          </span>
        </Link>
        <nav className="nav" aria-label="Primary">
          {NAV.map((item) => {
            const active = item.match(pathname)
            const Icon = item.icon
            return (
              <Link key={item.to} to={item.to} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
                <Icon />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <p className="foot">Records are stored in Neon Postgres. Export a backup from Today if you want a local copy.</p>
      </aside>
      <main id="content" className="main">
        {children}
      </main>
    </div>
  )
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M5 19C5 11 10 5 20 4 19 14 14 19 5 19Z" />
      <path d="M9 16c1.8-2 3.6-4.6 5.4-7.2" strokeLinecap="round" />
    </svg>
  )
}

function TodayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3.5V7M16 3.5V7M4 10h16" strokeLinecap="round" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="9" cy="9" r="3" />
      <path d="M4.5 18.5c.6-2.4 2.4-3.5 4.5-3.5s3.9 1.1 4.5 3.5" strokeLinecap="round" />
      <circle cx="16.5" cy="9.5" r="2.2" />
      <path d="M16 15.2c1.6.2 2.8 1.1 3.4 3.3" strokeLinecap="round" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8.5v7M8.5 12h7" strokeLinecap="round" />
    </svg>
  )
}
