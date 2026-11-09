import { useEffect, useState } from 'react'
import { Building2, Calendar, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import { formatCurrency, getStatusBadge, getStatusLabel } from '../../lib/utils'

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms]       = useState([])
  const [userStats, setUserStats] = useState({ total_users: 0, total_employees: 0 })
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/admin/bookings?per_page=5'),
      api.get('/rooms?per_page=100'),
      api.get('/admin/users?per_page=1'),
    ]).then(([bRes, rRes, uRes]) => {
      setBookings(bRes.data.data || [])
      setRooms(rRes.data.data || [])
      if (uRes.data?.stats) {
        setUserStats(uRes.data.stats)
      }
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const stats = {
    totalRooms:    rooms.length,
    availableRooms:rooms.filter((r) => r.is_available).length,
    totalBookings: bookings.length,
    totalUsers:    userStats.total_users || 0,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Admin MeetMe</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Kelola seluruh ruangan rapat kantor dan jadwal reservasi karyawan.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { label: 'Total Ruangan',    value: stats.totalRooms,     icon: Building2,  color: 'bg-blue-50 text-blue-600' },
          { label: 'Ruangan Tersedia', value: stats.availableRooms, icon: Building2,  color: 'bg-green-50 text-green-600' },
          { label: 'Total Booking',    value: stats.totalBookings,  icon: Calendar,   color: 'bg-purple-50 text-purple-600' },
          { label: 'Total Pengguna',   value: stats.totalUsers,     icon: Users,      color: 'bg-amber-50 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 sm:p-5">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2.5 sm:mb-3 ${color}`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{loading ? '—' : value}</div>
            <div className="text-gray-500 text-xs sm:text-sm">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent bookings */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Reservasi Terbaru</h2>
            <Link to="/admin/bookings" className="text-primary-600 text-xs sm:text-sm font-medium hover:underline">Lihat semua</Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="card p-5 animate-pulse h-20 bg-gray-100" />)}
            </div>
          ) : bookings.length === 0 ? (
            <div className="card p-8 text-center text-gray-400 text-sm">Belum ada booking</div>
          ) : (
            <>
              {/* Mobile Card View (Sangat rapi di HP) */}
              <div className="block md:hidden space-y-2.5">
                {bookings.map((b) => (
                  <div key={b.id} className="card p-3.5 space-y-2 border border-gray-200">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{b.user?.name}</p>
                        <p className="text-gray-400 text-[11px]">
                          {b.user?.position ? `${b.user.position} • ` : ''}{b.booking_date}
                        </p>
                      </div>
                      <span className={getStatusBadge(b.status)}>{getStatusLabel(b.status)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded-lg">
                      <span className="font-medium text-gray-800">{b.room?.name}</span>
                      <span>{b.start_time?.substring(0,5)} - {b.end_time?.substring(0,5)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block card overflow-hidden border border-gray-200">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-xs sm:text-sm min-w-[500px]">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-4 sm:px-5 py-3 text-gray-600 font-medium">Karyawan</th>
                        <th className="text-left px-4 sm:px-5 py-3 text-gray-600 font-medium">Ruangan</th>
                        <th className="text-left px-4 sm:px-5 py-3 text-gray-600 font-medium">Jadwal Waktu</th>
                        <th className="text-left px-4 sm:px-5 py-3 text-gray-600 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 sm:px-5 py-3">
                            <p className="font-semibold text-gray-900">{b.user?.name}</p>
                            <p className="text-gray-400 text-[11px]">
                              {b.user?.position ? `${b.user.position} • ` : ''}{b.booking_date}
                            </p>
                          </td>
                          <td className="px-4 sm:px-5 py-3 text-gray-700 font-medium">{b.room?.name}</td>
                          <td className="px-4 sm:px-5 py-3 text-gray-600">{b.start_time?.substring(0,5)} - {b.end_time?.substring(0,5)}</td>
                          <td className="px-4 sm:px-5 py-3">
                            <span className={getStatusBadge(b.status)}>{getStatusLabel(b.status)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Manajemen</h2>
          <div className="space-y-3">
            <Link to="/admin/rooms/create" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow block">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Tambah Ruangan</p>
                <p className="text-gray-500 text-sm">Buat ruangan baru</p>
              </div>
            </Link>
            <Link to="/admin/rooms" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow block">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Kelola Ruangan</p>
                <p className="text-gray-500 text-sm">Edit & hapus ruangan</p>
              </div>
            </Link>
            <Link to="/admin/bookings" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow block">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Semua Booking</p>
                <p className="text-gray-500 text-sm">Kelola status booking</p>
              </div>
            </Link>
            <Link to="/admin/users" className="card p-5 flex items-center gap-3 hover:shadow-md transition-shadow block">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Data Pengguna</p>
                <p className="text-gray-500 text-sm">Pantau profil & riwayat karyawan</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
