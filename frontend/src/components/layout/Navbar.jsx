import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Building2, Calendar, Home, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Users, X } from 'lucide-react'
import { useState } from 'react'
import useAuthStore from '../../store/authStore'
import { getAvatarUrl } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, logout, isAdmin, isAuthenticated } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Berhasil logout')
    navigate('/login')
  }

  // Active check helper
  const isActive = (path) => {
    if (path === '/' || path === '/admin') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  const navLinks = isAdmin()
    ? [
        { to: '/admin',          label: 'Dashboard Admin', icon: LayoutDashboard },
        { to: '/admin/rooms',    label: 'Kelola Ruangan',  icon: Building2 },
        { to: '/admin/bookings', label: 'Semua Reservasi', icon: Calendar },
        { to: '/admin/users',    label: 'Data Pengguna',   icon: Users },
        { to: '/rooms',          label: 'Lihat Katalog',   icon: Home },
      ]
    : isAuthenticated()
    ? [
        { to: '/',          label: 'Beranda',       icon: Home },
        { to: '/rooms',     label: 'Daftar Ruangan',icon: Building2 },
        { to: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
        { to: '/bookings',  label: 'Jadwal Saya',   icon: Calendar },
      ]
    : [
        { to: '/',      label: 'Beranda',        icon: Home },
        { to: '/rooms', label: 'Daftar Ruangan', icon: Building2 },
      ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Brand + Nav Links Grouped Together */}
          <div className="flex items-center gap-8">
            <Link to={isAdmin() ? "/admin" : "/"} className="flex items-center gap-2.5 tracking-tight group py-1">
              <img
                src="/logo.png"
                alt="MeetMe - Badan Pusat Statistik"
                className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-105"
              />
              {isAdmin() && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] uppercase tracking-wider font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                  <ShieldCheck className="w-3 h-3" /> Admin
                </span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = isActive(to)
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-primary-50 text-primary-700 font-semibold shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated() ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-100/80 text-gray-800 transition-colors"
                >
                  <img
                    src={getAvatarUrl(user)}
                    alt={user?.name || 'User'}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-200 bg-gray-100"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2563eb&color=fff&bold=true`
                    }}
                  />
                  <div className="text-left">
                    <p className="text-xs font-semibold text-gray-900 leading-tight">{user?.name}</p>
                    <p className="text-[10px] text-gray-500 leading-tight truncate max-w-[140px]">{user?.position || (user?.role === 'admin' ? 'Administrator' : 'Karyawan')}</p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors border border-transparent hover:border-red-100"
                  title="Logout dari akun"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login" className="btn-secondary text-xs py-2 px-4">
                  Masuk
                </Link>
                <Link to="/register" className="btn-primary text-xs py-2 px-4">
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {open && (
          <div className="lg:hidden py-4 border-t border-gray-100 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
            {isAuthenticated() && (
              <div className="flex items-center gap-3 px-4 py-2.5 mb-2 bg-gray-50/80 rounded-xl border border-gray-100 md:hidden">
                <img
                  src={getAvatarUrl(user)}
                  alt={user?.name || 'User'}
                  className="w-9 h-9 rounded-full object-cover border border-gray-200 bg-gray-100 shadow-xs"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2563eb&color=fff&bold=true`
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-primary-700 font-medium">{user?.position || (user?.role === 'admin' ? 'Administrator' : 'Karyawan')}</p>
                </div>
              </div>
            )}

            {navLinks.map(({ to, label, icon: Icon }) => {
              const active = isActive(to)
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium ${
                    active ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span>{label}</span>
                </Link>
              )
            })}

            {isAuthenticated() ? (
              <div className="pt-3 border-t border-gray-100 mt-2 space-y-1">
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4 text-gray-400" /> Profil Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" /> Keluar
                </button>
              </div>
            ) : (
              <div className="flex gap-2 px-4 pt-3 border-t border-gray-100 mt-2">
                <Link to="/login" onClick={() => setOpen(false)} className="btn-secondary flex-1 text-center text-sm py-2">
                  Masuk
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary flex-1 text-center text-sm py-2">
                  Daftar
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
