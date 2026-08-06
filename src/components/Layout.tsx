import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SITE_NAME, CONTACT_PHONE, CONTACT_PHONE_HREF, FACEBOOK_PAGE_URL, FACEBOOK_CARSON_URL } from '../lib/site'
import Logo from './Logo'
import EmailGate from './EmailGate'

export default function Layout() {
  const { user, profile, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // "Contact us" always lands on the signup CTA, from any page.
  function goToContact() {
    if (location.pathname !== '/') {
      navigate('/#contact')
      return
    }
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(14,165,233,0.07),transparent)]"
      />
      <header className="sticky top-0 z-30 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
          <Link
            to="/"
            aria-label={SITE_NAME}
            className="group shrink-0 transition-opacity hover:opacity-85"
          >
            <Logo />
          </Link>

          <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors sm:px-3 sm:text-sm ${
                  isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:text-white'
                }`
              }
            >
              Deals
            </NavLink>

            <NavLink
              to="/track-record"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors sm:px-3 sm:text-sm ${
                  isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:text-white'
                }`
              }
            >
              Rehab Work
            </NavLink>

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors sm:px-3 sm:text-sm ${
                    isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:text-white'
                  }`
                }
              >
                Admin
              </NavLink>
            )}

            <button
              onClick={goToContact}
              className="whitespace-nowrap rounded-md bg-brand-500 px-2.5 py-1.5 text-[13px] font-semibold text-ink-950 transition-colors hover:bg-brand-400 sm:px-3.5 sm:text-sm cursor-pointer"
            >
              Contact us
            </button>

            {user && (
              <button
                onClick={() => signOut()}
                title={profile?.full_name || user.email || 'Sign out'}
                className="ml-0.5 rounded-md border border-ink-600 px-2 py-1.5 text-[13px] font-medium text-ink-300 transition-colors hover:border-ink-400 hover:text-white sm:px-3 sm:text-sm cursor-pointer"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      </header>

      <EmailGate />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink-700/60 bg-ink-900/40 py-8 text-center">
        <p className="text-sm text-ink-200">
          Interested in a deal? Call{' '}
          <a href={CONTACT_PHONE_HREF} className="font-semibold text-brand-400 hover:text-brand-300">
            {CONTACT_PHONE}
          </a>
        </p>
        <p className="mt-2 text-sm">
          <a
            href={FACEBOOK_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-ink-200 transition-colors hover:text-brand-400"
          >
            Follow {SITE_NAME} on Facebook! →
          </a>
        </p>
        <p className="mt-3 text-xs text-ink-400">
          {SITE_NAME} · Private investor portal ·{' '}
          <a
            href={FACEBOOK_CARSON_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-300 transition-colors hover:text-brand-400"
          >
            Facebook
          </a>
        </p>
      </footer>
    </div>
  )
}
