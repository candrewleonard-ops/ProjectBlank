import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SITE_NAME } from '../lib/site'

export default function Layout() {
  const { user, profile, isAdmin, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-ink-950 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
              {SITE_NAME.charAt(0)}
            </span>
            <span className="text-lg font-semibold tracking-tight text-white group-hover:text-brand-400 transition-colors">
              {SITE_NAME}
            </span>
          </Link>

          {user && (
            <nav className="flex items-center gap-1 sm:gap-2">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:text-white'
                  }`
                }
              >
                Deals
              </NavLink>
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive ? 'bg-ink-800 text-white' : 'text-ink-300 hover:text-white'
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
              <div className="ml-2 hidden items-center gap-2 pl-2 text-sm text-ink-400 sm:flex">
                <span className="max-w-[160px] truncate">{profile?.full_name || user.email}</span>
                {isAdmin && (
                  <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-xs font-medium text-gold-400">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={() => signOut()}
                className="ml-1 rounded-md border border-ink-600 px-3 py-1.5 text-sm font-medium text-ink-300 transition-colors hover:border-ink-400 hover:text-white cursor-pointer"
              >
                Sign out
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-ink-700/60 py-6 text-center text-xs text-ink-500">
        {SITE_NAME} · Private investor portal
      </footer>
    </div>
  )
}
