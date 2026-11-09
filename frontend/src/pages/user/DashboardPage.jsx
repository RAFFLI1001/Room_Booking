import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Calendar, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import { formatCurrency, formatDate, formatTime, getStatusBadge, getStatusLabel } from '../../lib/utils'

export default function UserDashboard() {
  const { user }               = useAuthStore()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]  = useState(true)

  useEffect(() => {
    api.get('/bookings').then(({ data }) => setBookings(data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const stats = {
    total:     bookings.length,
    active:    bookings.filter((b) => b.status === 'confirmed').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  }

  const upcoming = bookings
    .filter((b) => b.status === 'confirmed' && new Date(b.booking_date) >= new Date())
    .sort((a, b) => new Date(a.booking_date) - new Date(b.booking_date))
    .slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Welcome */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Selamat datang, {user?.name}! 👋</h1>
          {user?.position && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
              {user.position}
            </span>
          )}
        </div>
        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Kelola reservasi ruangan rapat kantor Anda di sini.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'Total Reservasi',  value: stats.total,     icon: Calendar,     color: 'bg-blue-50 text-blue-600' },
          { label: 'Rapat Terjadwal',  value: stats.active,    icon: CheckCircle,  color: 'bg-green-50 text-green-600' },
          { label: 'Rapat Selesai',    value: stats.completed, icon: TrendingUp,   color: 'bg-purple-50 text-purple-600' },
          { label: 'Dibatalkan',       value: stats.cancelled, icon: Clock,        color: 'bg-red-50 text-red-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 sm:p-5">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2.5 sm:mb-3 ${color}`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-gray-500 text-xs sm:text-sm">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming bookings */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Booking Mendatang</h2>
            <Link to="/bookings" className="text-primary-600 text-sm font-medium hover:underline">Lihat semua</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="card p-5 animate-pulse h-28 bg-gray-100" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="card p-10 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Belum ada booking mendatang</p>
              <Link to="/rooms" className="btn-primary mt-4 inline-block">Booking Sekarang</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <Link key={b.id} to={`/bookings/${b.id}`} className="card p-5 flex gap-4 hover:shadow-md transition-shadow block">
                  <div className="w-14 h-14 bg-primary-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary-600">
                      {new Date(b.booking_date).toLocaleDateString('id-ID', { month: 'short' })}
                    </span>
                    <span className="text-xl font-bold text-primary-700">
                      {new Date(b.booking_date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{b.room?.name}</p>
                    <p className="text-gray-500 text-sm">{formatTime(b.start_time)} – {formatTime(b.end_time)}</p>
                    <p className="text-gray-400 text-xs truncate mt-0.5">{b.notes || 'Rapat internal'}</p>
                  </div>
                  <span className={getStatusBadge(b.status)}>{getStatusLabel(b.status)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
          <div className="space-y-3">
            <Link to="/rooms" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow block">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Booking Ruangan</p>
                <p className="text-gray-500 text-sm">Cari & reservasi ruangan</p>
              </div>
            </Link>
            <Link to="/bookings" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow block">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Riwayat Booking</p>
                <p className="text-gray-500 text-sm">Lihat semua booking Anda</p>
              </div>
            </Link>
            <Link to="/profile" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow block">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Edit Profil</p>
                <p className="text-gray-500 text-sm">Perbarui data diri Anda</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
