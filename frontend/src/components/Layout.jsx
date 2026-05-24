import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/dashboard',  icon: '▦',  label: 'Dashboard'   },
  { to: '/assessment', icon: '◉',  label: 'Assessment'  },
  { to: '/bmi',        icon: '⊕',  label: 'BMI Calc'    },
  { to: '/history',    icon: '◧',  label: 'History'     },
]

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  const handleLogout = () => { logout(); navigate('/') }

  // Top-bar: show on home page always, show on auth pages (/login, /register)
  const showTopBar = isHome || !isAuthenticated

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#060d1f' }}>

      {/* ── TOP NAVIGATION BAR ─────────────────────────────────────────── */}
      {showTopBar && (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(6,13,31,0.9)' }}>
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <NavLink to="/" className="flex items-center gap-2.5 select-none">
              <span className="text-2xl">🌙</span>
              <span className="font-bold text-white text-lg tracking-tight">
                SleepSense <span className="gradient-text">AI</span>
              </span>
            </NavLink>

            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                /* Logged-in user on home page */
                <>
                  <span className="text-slate-400 text-sm hidden sm:block">
                    Hi, {user?.name?.split(' ')[0]} 👋
                  </span>
                  <NavLink to="/dashboard" className="btn-primary text-sm py-2 px-4">
                    Go to Dashboard →
                  </NavLink>
                  <button onClick={handleLogout} className="btn-danger text-sm py-2 px-4">
                    Sign Out
                  </button>
                </>
              ) : (
                /* Guest */
                <>
                  <NavLink to="/login"    className="btn-secondary text-sm py-2 px-4">Log In</NavLink>
                  <NavLink to="/register" className="btn-primary  text-sm py-2 px-4">Get Started</NavLink>
                </>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── AUTHENTICATED APP SHELL (sidebar layout) ───────────────────── */}
      {isAuthenticated && !isHome ? (
        <div className="flex flex-1">
          {/* Sidebar */}
          <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/5 flex flex-col z-40"
            style={{ backgroundColor: '#0a1628' }}>

            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
              <NavLink to="/" className="flex items-center gap-2 select-none">
                <span className="text-xl">🌙</span>
                <span className="font-bold text-white tracking-tight">
                  SleepSense <span className="gradient-text">AI</span>
                </span>
              </NavLink>
            </div>

            {/* Nav */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {NAV.map(({ to, icon, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}>
                  <span className="text-base w-5 text-center">{icon}</span>
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>

            {/* User card + logout */}
            <div className="p-4 border-t border-white/5 shrink-0">
              <div className="rounded-xl p-3 mb-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-xs text-slate-500 mb-0.5">Signed in as</p>
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button onClick={handleLogout} className="w-full btn-danger text-sm py-2">
                Sign Out
              </button>
            </div>
          </aside>

          {/* Main content area */}
          <main className="ml-64 flex-1 min-h-screen p-8">
            <Outlet />
          </main>
        </div>

      ) : (
        /* Public / home layout */
        <main className={showTopBar && !isHome ? 'pt-16' : ''}>
          <Outlet />
        </main>
      )}
    </div>
  )
}
