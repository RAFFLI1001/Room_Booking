import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  Filter,
  History,
  LayoutGrid,
  Mail,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Table,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import { formatDate, formatTime, getAvatarUrl, getStatusBadge, getStatusLabel } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminUsersPage() {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({
    total_users: 0,
    total_admins: 0,
    total_employees: 0,
    google_users: 0,
    total_bookings: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [viewMode, setViewMode] = useState('card') // 'card' | 'table'

  // Drag-to-scroll & scrollbar state
  const [scrollPercent, setScrollPercent] = useState(0)
  const [thumbWidth, setThumbWidth] = useState(30)
  const [isDraggingTable, setIsDraggingTable] = useState(false)
  const tableContainerRef = useRef(null)
  const trackRef = useRef(null)
  const isMouseDownRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftStartRef = useRef(0)
  const isDraggingTrackRef = useRef(false)

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetailLoading, setUserDetailLoading] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    role: 'user',
  })
  const [savingEdit, setSavingEdit] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        per_page: 100,
      }
      const { data } = await api.get('/admin/users', { params })
      setUsers(data.users?.data || [])
      if (data.stats) setStats(data.stats)
    } catch (err) {
      toast.error('Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 250)
    return () => clearTimeout(timer)
  }, [search, roleFilter, sortBy, sortOrder])

  // View user details & booking history
  const handleViewUser = async (id) => {
    setUserDetailLoading(true)
    try {
      const { data } = await api.get(`/admin/users/${id}`)
      setSelectedUser(data.user)
    } catch (err) {
      toast.error('Gagal memuat detail pengguna')
    } finally {
      setUserDetailLoading(false)
    }
  }

  // Open edit modal
  const handleOpenEdit = (u) => {
    setEditingUser(u)
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      position: u.position || '',
      role: u.role || 'user',
    })
  }

  // Save edit form
  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingUser) return

    setSavingEdit(true)
    try {
      const { data } = await api.put(`/admin/users/${editingUser.id}`, editForm)
      toast.success(data.message || 'Data pengguna berhasil diperbarui')
      setEditingUser(null)
      fetchUsers()
      if (selectedUser?.id === editingUser.id) {
        setSelectedUser((prev) => ({ ...prev, ...data.user }))
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan perubahan')
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete user
  const handleDeleteUser = async (u) => {
    if (u.id === currentUser?.id) {
      toast.error('Anda tidak dapat menghapus akun Anda sendiri')
      return
    }

    if (!window.confirm(`Yakin ingin menghapus pengguna "${u.name}" (${u.email})? Seluruh riwayat reservasi yang bersangkutan akan terhapus.`)) {
      return
    }

    try {
      await api.delete(`/admin/users/${u.id}`)
      toast.success(`Pengguna ${u.name} berhasil dihapus`)
      setUsers(users.filter((item) => item.id !== u.id))
      if (selectedUser?.id === u.id) setSelectedUser(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus pengguna')
    }
  }

  // Quick toggle role (Admin <-> Karyawan)
  const handleToggleRole = async (u) => {
    if (u.id === currentUser?.id) {
      toast.error('Anda tidak dapat mengubah role akun Anda sendiri')
      return
    }

    const newRole = u.role === 'admin' ? 'user' : 'admin'
    const roleLabel = newRole === 'admin' ? 'Administrator' : 'Karyawan'

    if (!window.confirm(`Ubah hak akses "${u.name}" menjadi ${roleLabel}?`)) {
      return
    }

    try {
      const { data } = await api.put(`/admin/users/${u.id}`, {
        name: u.name,
        email: u.email,
        phone: u.phone,
        position: u.position,
        role: newRole,
      })
      toast.success(`Role ${u.name} diubah menjadi ${roleLabel}`)
      setUsers(users.map((item) => (item.id === u.id ? { ...item, role: newRole } : item)))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah role pengguna')
    }
  }

  // Scrollbar & drag handlers
  const handleTableScroll = () => {
    if (tableContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tableContainerRef.current
      const maxScroll = scrollWidth - clientWidth
      if (maxScroll > 0) {
        setScrollPercent(Math.round((scrollLeft / maxScroll) * 100))
        const ratio = Math.max(20, Math.min(50, Math.round((clientWidth / scrollWidth) * 100)))
        setThumbWidth(ratio)
      } else {
        setScrollPercent(0)
      }
    }
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    if (e.target.closest('button, a, input, select')) return
    isMouseDownRef.current = true
    setIsDraggingTable(true)
    startXRef.current = e.pageX - (tableContainerRef.current?.offsetLeft || 0)
    scrollLeftStartRef.current = tableContainerRef.current?.scrollLeft || 0
  }

  const handleMouseMove = (e) => {
    if (!isMouseDownRef.current || !tableContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - (tableContainerRef.current.offsetLeft || 0)
    const walk = (x - startXRef.current) * 1.3
    tableContainerRef.current.scrollLeft = scrollLeftStartRef.current - walk
  }

  const handleMouseUpOrLeave = () => {
    isMouseDownRef.current = false
    setIsDraggingTable(false)
  }

  const updateScrollFromTrack = (clientX) => {
    if (!trackRef.current || !tableContainerRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const clickX = clientX - rect.left
    const ratio = Math.max(0, Math.min(1, clickX / rect.width))
    const { scrollWidth, clientWidth } = tableContainerRef.current
    tableContainerRef.current.scrollLeft = ratio * (scrollWidth - clientWidth)
  }

  const handleTrackPointerDown = (e) => {
    isDraggingTrackRef.current = true
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    updateScrollFromTrack(e.clientX)
  }

  const handleTrackPointerMove = (e) => {
    if (!isDraggingTrackRef.current) return
    updateScrollFromTrack(e.clientX)
  }

  const handleTrackPointerUp = (e) => {
    isDraggingTrackRef.current = false
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  const scrollTable = (offset) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  const scrollToPercent = (percent) => {
    if (tableContainerRef.current) {
      const { scrollWidth, clientWidth } = tableContainerRef.current
      tableContainerRef.current.scrollTo({
        left: (percent / 100) * (scrollWidth - clientWidth),
        behavior: 'smooth',
      })
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            <span>Data & Kelola Pengguna</span>
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Pantau seluruh akun karyawan/pengguna, jabatan, kontak, dan riwayat reservasi ruangan kantor.
          </p>
        </div>
      </div>

      {/* Ringkasan Statistik 4 Kartu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="card p-4 sm:p-5 border border-blue-100 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Pengguna</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{stats.total_users}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Seluruh akun terdaftar di MeetMe</p>
        </div>

        <div className="card p-4 sm:p-5 border border-emerald-100 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Karyawan / User</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-700 mt-0.5">{stats.total_employees}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Dapat melakukan reservasi ruangan</p>
        </div>

        <div className="card p-4 sm:p-5 border border-purple-100 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Administrator</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-700 mt-0.5">{stats.total_admins}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Akses penuh pengelolaan sistem</p>
        </div>

        <div className="card p-4 sm:p-5 border border-amber-100 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Akun Google</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-700 mt-0.5">{stats.google_users}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Terhubung via Single Sign-On</p>
        </div>
      </div>

      {/* Filter, Search & View Mode Controls */}
      <div className="card p-4 mb-6 border border-gray-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="input-field pl-9 py-2 text-xs sm:text-sm w-full"
              placeholder="Cari berdasarkan nama, jabatan, email, atau no. HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Role */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
            <select
              className="input-field py-2 text-xs sm:text-sm w-full sm:w-44"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">Semua Role</option>
              <option value="user">Karyawan</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <select
              className="input-field py-2 text-xs sm:text-sm w-full sm:w-44"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-')
                setSortBy(sb)
                setSortOrder(so)
              }}
            >
              <option value="created_at-desc">Terbaru Terdaftar</option>
              <option value="created_at-asc">Terlama Terdaftar</option>
              <option value="name-asc">Nama (A-Z)</option>
              <option value="name-desc">Nama (Z-A)</option>
              <option value="bookings_count-desc">Paling Sering Booking</option>
            </select>
          </div>
        </div>

        {/* View Mode Toggle for Mobile & Tablet */}
        <div className="md:hidden flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'card'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> 📱 Mode Kartu
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'table'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Table className="w-4 h-4" /> 📊 Mode Tabel
          </button>
        </div>
      </div>

      {/* Konten Data Pengguna */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse h-24 bg-gray-100" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">
          Tidak ada pengguna yang cocok dengan pencarian atau filter.
        </div>
      ) : (
        <>
          {/* TAMPILAN 1: MODE KARTU (Nyaman di layar HP) */}
          <div className={`${viewMode === 'table' ? 'hidden' : 'block md:hidden'} space-y-3`}>
            {users.map((u) => (
              <div key={u.id} className="card p-4 space-y-3 border border-gray-200 shadow-2xs">
                {/* Header User */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getAvatarUrl(u)}
                      alt={u.name}
                      className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0 bg-gray-100 shadow-2xs"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=2563eb&color=fff&bold=true`
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.2 rounded font-semibold">Anda</span>
                        )}
                      </p>
                      {u.position ? (
                        <p className="text-[11px] font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded inline-flex items-center gap-1 my-0.5">
                          <Briefcase className="w-3 h-3" /> {u.position}
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">Belum ada jabatan</p>
                      )}
                      <p className="text-gray-500 text-xs truncate mt-0.5">{u.email}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {u.role === 'admin' ? 'Administrator' : 'Karyawan'}
                  </span>
                </div>

                {/* Detail info & badge */}
                <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-2 text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[11px]">No. Telepon:</span>
                    <span className="font-medium text-gray-800">{u.phone || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[11px]">Metode Akun:</span>
                    {u.google_id ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Google Terhubung
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">
                        <Mail className="w-3 h-3 text-gray-400" /> Email & Sandi
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[11px]">Total Reservasi:</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                      <Calendar className="w-3 h-3" /> {u.bookings_count || 0} Booking
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-[11px]">Terdaftar Sejak:</span>
                    <span className="text-gray-600 text-[11px]">{formatDate(u.created_at)}</span>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleViewUser(u.id)}
                    className="flex-1 py-2 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 active:bg-primary-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" /> Riwayat Booking
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(u)}
                    className="p-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Edit Data Pengguna"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {u.id !== currentUser?.id && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u)}
                      className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      title="Hapus Pengguna"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* TAMPILAN 2: TABEL LENGKAP (DENGAN DRAG DAN SCROLLBAR RESPONSIF) */}
          <div className={`${viewMode === 'card' ? 'hidden md:block' : 'block'} card overflow-hidden border border-gray-200 shadow-sm`}>
            <div
              ref={tableContainerRef}
              onScroll={handleTableScroll}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className={`horizontal-scrollbar w-full overflow-x-auto ${
                isDraggingTable ? 'cursor-grabbing select-none' : 'cursor-grab'
              }`}
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorX: 'contain',
                touchAction: 'pan-x pan-y',
              }}
            >
              <table className="w-full text-left text-xs sm:text-sm text-gray-600 border-collapse table-auto" style={{ minWidth: '950px' }}>
                <thead className="bg-gray-50 text-[11px] sm:text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '240px' }}>Pengguna</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '160px' }}>Jabatan</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '180px' }}>Kontak</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '120px' }}>Role</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '140px' }}>Metode Akun</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '120px' }}>Total Booking</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '140px' }}>Bergabung</th>
                    <th className="px-5 py-3.5 font-semibold text-right whitespace-nowrap" style={{ width: '160px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Kolom Pengguna */}
                      <td className="px-5 py-4 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-3">
                          <img
                            src={getAvatarUrl(u)}
                            alt={u.name}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0 bg-gray-100 shadow-2xs"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=2563eb&color=fff&bold=true`
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.id === currentUser?.id && (
                                <span className="text-[10px] bg-primary-100 text-primary-700 px-1.5 py-0.2 rounded font-semibold">Anda</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Kolom Jabatan */}
                      <td className="px-5 py-4 whitespace-nowrap align-middle">
                        {u.position ? (
                          <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md inline-flex items-center gap-1 border border-primary-100">
                            <Briefcase className="w-3.5 h-3.5 text-primary-600" /> {u.position}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Belum disetel</span>
                        )}
                      </td>

                      {/* Kolom Kontak */}
                      <td className="px-5 py-4 whitespace-nowrap align-middle text-xs">
                        <div className="space-y-0.5">
                          <p className="text-gray-700 font-medium">{u.phone || <span className="text-gray-400 italic">—</span>}</p>
                          <a href={`mailto:${u.email}`} className="text-primary-600 hover:underline text-[11px] block">
                            Kirim Email &rarr;
                          </a>
                        </div>
                      </td>

                      {/* Kolom Role */}
                      <td className="px-5 py-4 whitespace-nowrap align-middle">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {u.role === 'admin' ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5" /> Admin
                            </>
                          ) : (
                            <>
                              <User className="w-3.5 h-3.5" /> Karyawan
                            </>
                          )}
                        </span>
                      </td>

                      {/* Kolom Metode Akun */}
                      <td className="px-5 py-4 whitespace-nowrap align-middle">
                        {u.google_id ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Google SSO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                            <Mail className="w-3 h-3 text-gray-400" /> Email & Sandi
                          </span>
                        )}
                      </td>

                      {/* Kolom Total Booking */}
                      <td className="px-5 py-4 whitespace-nowrap align-middle">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-800">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{u.bookings_count || 0}</span>
                        </span>
                      </td>

                      {/* Kolom Bergabung */}
                      <td className="px-5 py-4 whitespace-nowrap align-middle text-xs text-gray-500">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Kolom Aksi */}
                      <td className="px-5 py-4 text-right whitespace-nowrap align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewUser(u.id)}
                            className="p-1.5 text-primary-600 hover:bg-primary-50 active:bg-primary-100 rounded-lg transition-colors"
                            title="Lihat Riwayat Reservasi & Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                            title="Edit Data Pengguna"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg transition-colors"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SCROLLBAR & KONTROL GESER TABEL DI BAGIAN BAWAH */}
            <div className="md:hidden bg-gray-50/95 px-4 py-3.5 border-t border-gray-200 flex flex-col items-center justify-center gap-2 select-none">
              <div className="w-full max-w-sm flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollTable(-240)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 shadow-2xs active:scale-95 transition-all shrink-0"
                  title="Geser Kiri"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div
                  ref={trackRef}
                  onPointerDown={handleTrackPointerDown}
                  onPointerMove={handleTrackPointerMove}
                  onPointerUp={handleTrackPointerUp}
                  onPointerCancel={handleTrackPointerUp}
                  className="relative flex-1 py-2.5 px-1 cursor-pointer touch-none"
                  title="Tarik atau sentuh untuk menggeser posisi tabel"
                >
                  <div className="w-full h-2.5 bg-gray-200/90 hover:bg-gray-300 rounded-full overflow-hidden transition-colors relative">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all duration-75 flex items-center justify-center shadow-xs"
                      style={{
                        width: `${thumbWidth}%`,
                        marginLeft: `${(scrollPercent / 100) * (100 - thumbWidth)}%`,
                      }}
                    >
                      <span className="w-3 h-0.5 bg-white/70 rounded-full block" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => scrollTable(240)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 shadow-2xs active:scale-95 transition-all shrink-0"
                  title="Geser Kanan"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full max-w-sm flex items-center justify-between text-[11px] text-gray-500 font-medium px-1">
                <span className="flex items-center gap-1">
                  <span>👉 Geser layar / bar</span>
                  <span className="font-semibold text-primary-700">({scrollPercent}%)</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => scrollToPercent(0)}
                    disabled={scrollPercent <= 2}
                    className="px-2 py-0.5 rounded bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Awal
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToPercent(100)}
                    disabled={scrollPercent >= 98}
                    className="px-2 py-0.5 rounded bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Aksi ➡️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: LIHAT DETAIL & RIWAYAT BOOKING PENGGUNA */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header User */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-gray-200">
              <img
                src={getAvatarUrl(selectedUser)}
                alt={selectedUser.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary-500 bg-gray-100 shadow-md shrink-0"
              />
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{selectedUser.name}</h3>
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      selectedUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {selectedUser.role === 'admin' ? 'Administrator' : 'Karyawan'}
                  </span>
                </div>

                {selectedUser.position && (
                  <p className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded inline-flex items-center gap-1 my-1">
                    <Briefcase className="w-3.5 h-3.5" /> {selectedUser.position}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> {selectedUser.email}
                  </span>
                  {selectedUser.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {selectedUser.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Riwayat Reservasi Ruangan */}
            <div className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-primary-600" />
                  <span>Riwayat Reservasi Ruangan ({selectedUser.bookings?.length || 0})</span>
                </h4>
                <span className="text-xs text-gray-400">Diurutkan dari jadwal terbaru</span>
              </div>

              {userDetailLoading ? (
                <div className="p-8 text-center text-gray-400 text-xs animate-pulse">Memuat riwayat reservasi...</div>
              ) : !selectedUser.bookings || selectedUser.bookings.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-xl border border-gray-200 text-gray-400 text-xs">
                  Pengguna ini belum pernah melakukan reservasi ruangan rapat.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {selectedUser.bookings.map((b) => (
                    <div key={b.id} className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-xl border border-gray-200 text-xs space-y-1.5 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 font-semibold text-gray-900">
                          <Building2 className="w-4 h-4 text-primary-600 shrink-0" />
                          <span>{b.room?.name || 'Ruangan'}</span>
                          <span className="text-gray-400 font-normal">({b.room?.location || 'Kantor'})</span>
                        </div>
                        <span className={`shrink-0 ${getStatusBadge(b.status)}`}>
                          {getStatusLabel(b.status)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-gray-600 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" /> {formatDate(b.booking_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-400" /> {formatTime(b.start_time)} - {formatTime(b.end_time)}
                        </span>
                      </div>

                      {b.notes && (
                        <p className="text-[11px] text-gray-700 bg-white p-2 rounded-lg border border-gray-200">
                          <span className="font-semibold text-gray-500">Agenda:</span> {b.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="btn-secondary py-2 px-4 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT DATA & ROLE PENGGUNA */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary-600" />
              <span>Edit Data Pengguna</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Perbarui profil, jabatan, atau hak akses administrator untuk <b>{editingUser.name}</b>.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  className="input-field text-xs py-2"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="input-field text-xs py-2"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Jabatan / Posisi</label>
                <input
                  type="text"
                  className="input-field text-xs py-2"
                  placeholder="Contoh: Manager IT, Staff HR, dsb."
                  value={editForm.position}
                  onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nomor Telepon / WhatsApp</label>
                <input
                  type="text"
                  className="input-field text-xs py-2"
                  placeholder="Contoh: 08123456789"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Peran Akses (Role)</label>
                <select
                  className="input-field text-xs py-2"
                  value={editForm.role}
                  disabled={editingUser.id === currentUser?.id}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                >
                  <option value="user">Karyawan (Peminjam Ruangan)</option>
                  <option value="admin">Administrator (Akses Penuh)</option>
                </select>
                {editingUser.id === currentUser?.id && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    * Anda tidak dapat mengubah peran akun Anda sendiri.
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-secondary py-2 px-3 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="btn-primary py-2 px-4 text-xs font-semibold"
                >
                  {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
