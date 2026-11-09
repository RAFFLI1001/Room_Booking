import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Download,
  Filter,
  KeyRound,
  LayoutGrid,
  ListFilter,
  MoveHorizontal,
  Paperclip,
  Repeat,
  Table,
  Tv,
  Users,
  Wrench,
  X,
  XCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/axios'
import { formatDate, formatTime, getAvatarUrl, getStatusBadge, getStatusLabel } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function AdminBookingsPage() {
  const [bookings, setBookings]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [exporting, setExporting]       = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode]         = useState('card') // 'card' | 'table'

  // Cancellation Modal state
  const [cancelModalBooking, setCancelModalBooking] = useState(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [submittingCancel, setSubmittingCancel]     = useState(false)

  // Scrollbar dragging refs
  const [scrollPercent, setScrollPercent] = useState(0)
  const [thumbWidth, setThumbWidth]       = useState(30)
  const [isDraggingTable, setIsDraggingTable] = useState(false)
  const tableContainerRef                 = useRef(null)
  const trackRef                          = useRef(null)
  const isMouseDownRef                    = useRef(false)
  const startXRef                         = useRef(0)
  const scrollLeftStartRef                = useRef(0)
  const isDraggingTrackRef                = useRef(false)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/admin/bookings', { params })
      setBookings(data.data || [])
    } catch (err) {
      toast.error('Gagal memuat data reservasi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [statusFilter])

  // Update status (Confirmed / Completed)
  const handleUpdateStatus = async (id, newStatus, reason = null) => {
    try {
      const payload = { status: newStatus }
      if (reason) payload.cancellation_reason = reason
      await api.patch(`/admin/bookings/${id}/status`, payload)
      toast.success(
        newStatus === 'cancelled'
          ? 'Reservasi berhasil dibatalkan beserta alasannya'
          : 'Status reservasi berhasil diperbarui'
      )
      setBookings(
        bookings.map((b) => (b.id === id ? { ...b, status: newStatus, cancellation_reason: reason } : b))
      )
    } catch (err) {
      toast.error('Gagal memperbarui status')
    }
  }

  // Handle Cancel button click
  const openCancelModal = (booking) => {
    setCancelModalBooking(booking)
    setCancellationReason('Ruangan dialihkan untuk kebutuhan mendesak Manajemen')
  }

  const handleConfirmCancel = async (e) => {
    e.preventDefault()
    if (!cancelModalBooking) return
    setSubmittingCancel(true)
    try {
      await handleUpdateStatus(cancelModalBooking.id, 'cancelled', cancellationReason.trim())
      setCancelModalBooking(null)
      setCancellationReason('')
    } finally {
      setSubmittingCancel(false)
    }
  }

  // Export CSV / Excel
  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const res = await api.get('/admin/bookings/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `rekap-reservasi-meetme-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Laporan rekap CSV / Excel berhasil diunduh!')
    } catch (err) {
      toast.error('Gagal mengunduh laporan reservasi')
    } finally {
      setExporting(false)
    }
  }

  // Handle table container scroll event (syncs pill position)
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

  // Mouse drag-to-scroll on table container
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

  // Pointer drag on bottom track
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
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kelola Semua Reservasi Ruangan</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
              Pantau jadwal, status kehadiran check-in, permintaan konsumsi, dan unduh laporan CSV/Excel.
            </p>
          </div>

          {/* Action Bar: Export CSV & Filter Status */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={exporting}
              className="btn-secondary text-xs sm:text-sm py-2 px-3.5 flex items-center gap-2 text-gray-700 hover:text-gray-900 shadow-2xs font-semibold"
              title="Unduh rekap data reservasi ke format file Excel / CSV"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{exporting ? 'Mengunduh...' : '📊 Export CSV / Excel'}</span>
            </button>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                className="input-field py-2 text-xs sm:text-sm w-full sm:w-44"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="confirmed">Dikonfirmasi</option>
                <option value="pending">Menunggu</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
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
            <LayoutGrid className="w-4 h-4" /> 📱 Mode Kartu (Mudah di HP)
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse h-28 bg-gray-100" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">
          Tidak ada data reservasi ditemukan.
        </div>
      ) : (
        <>
          {/* TAMPILAN 1: MODE KARTU (Pas di layar Smartphone) */}
          <div className={`${viewMode === 'table' ? 'hidden' : 'block md:hidden'} space-y-3`}>
            {bookings.map((booking) => (
              <div key={booking.id} className="card p-4 space-y-3 border border-gray-200/80 shadow-xs">
                {/* Header card: Pemesan & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={getAvatarUrl(booking.user)}
                      alt={booking.user?.name || 'User'}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0 bg-gray-100"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.user?.name || 'User')}&background=2563eb&color=fff&bold=true`
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-gray-900 text-sm truncate">{booking.user?.name || 'User'}</p>
                        {booking.recurring_group_id && (
                          <span title="Reservasi Rutin" className="text-primary-600 bg-primary-50 px-1 rounded text-[10px] font-bold">
                            🔁 Rutin
                          </span>
                        )}
                      </div>
                      {booking.user?.position && (
                        <p className="text-[11px] font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded inline-flex items-center gap-1 my-0.5">
                          <Briefcase className="w-3 h-3" /> {booking.user.position}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs truncate">{booking.user?.email}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 ${getStatusBadge(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                </div>

                {/* Status Kehadiran (Check-In) Badge */}
                <div className="flex items-center justify-between text-xs p-2 bg-gray-50/80 rounded-lg border border-gray-200/60">
                  <div className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-gray-500 font-mono text-[11px]">PIN: {booking.check_in_code || '-'}</span>
                  </div>
                  {booking.checked_in_at ? (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Hadir ({formatTime(booking.checked_in_at)})
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400">Belum Check-In</span>
                  )}
                </div>

                {/* Detail Ruangan & Waktu Rapat */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs text-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-gray-900">
                      <Building2 className="w-4 h-4 text-primary-600 shrink-0" />
                      <span>{booking.room?.name}</span>
                      <span className="text-gray-400 font-normal">({booking.room?.location})</span>
                    </div>
                    {booking.room && (
                      <Link
                        to={`/rooms/${booking.room.id}/display`}
                        target="_blank"
                        className="text-primary-600 hover:underline text-[11px] font-semibold flex items-center gap-1"
                      >
                        <Tv className="w-3 h-3" /> Kiosk
                      </Link>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{formatDate(booking.booking_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                    <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)} ({booking.duration_hours} jam)</span>
                  </div>
                </div>

                {/* Layanan Tambahan (Services) if any */}
                {booking.services && (
                  <div className="p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-lg text-xs space-y-1">
                    <p className="font-semibold text-amber-900 text-[11px] uppercase tracking-wider flex items-center gap-1">
                      <Coffee className="w-3 h-3" /> Layanan Tambahan:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {booking.services.equipment?.map((eq) => (
                        <span key={eq} className="bg-white text-amber-800 text-[10px] px-1.5 py-0.5 rounded border border-amber-200">
                          🔧 {eq}
                        </span>
                      ))}
                      {booking.services.catering?.map((cat) => (
                        <span key={cat} className="bg-white text-amber-800 text-[10px] px-1.5 py-0.5 rounded border border-amber-200">
                          ☕ {cat} ({booking.services.catering_pax || 0} Pax)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alasan Pembatalan if cancelled */}
                {booking.status === 'cancelled' && booking.cancellation_reason && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                    <span className="font-semibold">Alasan Batal:</span> &ldquo;{booking.cancellation_reason}&rdquo;
                  </div>
                )}

                {/* Agenda & Berkas Rapat */}
                <div className="text-xs space-y-1.5">
                  <div>
                    <span className="text-gray-400 text-[11px] uppercase tracking-wider font-semibold block">Agenda Rapat:</span>
                    <p className="font-medium text-gray-800">{booking.notes || <span className="text-gray-400 italic font-normal">Tidak ada agenda</span>}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {booking.attendees?.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
                        <Users className="w-3 h-3" /> {booking.attendees.length} Peserta
                      </span>
                    )}
                    {booking.meeting_file && (
                      <a
                        href={booking.meeting_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded font-medium transition-colors"
                      >
                        <Paperclip className="w-3 h-3" /> Berkas Hasil
                      </a>
                    )}
                  </div>
                </div>

                {/* Tombol Aksi Status */}
                <div className="pt-2.5 border-t border-gray-100 flex items-center gap-1.5">
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                    className="flex-1 py-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 active:bg-green-200 rounded-lg transition-colors text-center"
                  >
                    Konfirmasi
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(booking.id, 'completed')}
                    className="flex-1 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-lg transition-colors text-center"
                  >
                    Selesai
                  </button>
                  <button
                    onClick={() => openCancelModal(booking)}
                    className="flex-1 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-lg transition-colors text-center"
                  >
                    Batal
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* TAMPILAN 2: TABEL DENGAN SCROLLBAR BAWAH & FASILITAS BARU */}
          <div className={`${viewMode === 'card' ? 'hidden md:block' : 'block'} card overflow-hidden border border-gray-200 shadow-sm`}>
            
            {/* Tabel Konten */}
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
              <table
                className="w-full text-left text-xs sm:text-sm text-gray-600 border-collapse table-auto"
                style={{ minWidth: '1080px' }}
              >
                <thead className="bg-gray-50 text-[11px] sm:text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '220px' }}>Pemesan</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '180px' }}>Ruangan</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '200px' }}>Jadwal & Check-In</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '240px' }}>Agenda & Layanan</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '130px' }}>Status</th>
                    <th className="px-5 py-3.5 font-semibold text-right whitespace-nowrap" style={{ width: '200px' }}>Ubah Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap align-top">
                        <div className="flex items-center gap-3">
                          <img
                            src={getAvatarUrl(booking.user)}
                            alt={booking.user?.name || 'User'}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0 bg-gray-100 shadow-2xs"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(booking.user?.name || 'User')}&background=2563eb&color=fff&bold=true`
                            }}
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-gray-900">{booking.user?.name || 'User'}</p>
                              {booking.recurring_group_id && (
                                <span title="Reservasi Rutin" className="text-primary-700 bg-primary-50 px-1 py-0.2 rounded text-[10px] font-bold">
                                  🔁 Rutin
                                </span>
                              )}
                            </div>
                            {booking.user?.position && (
                              <p className="text-[11px] font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded inline-flex items-center gap-1 my-0.5">
                                <Briefcase className="w-3 h-3" /> {booking.user.position}
                              </p>
                            )}
                            <p className="text-xs text-gray-400">{booking.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap align-top">
                        <p className="font-medium text-gray-800">{booking.room?.name}</p>
                        <p className="text-xs text-gray-400">{booking.room?.location}</p>
                        {booking.room && (
                          <Link
                            to={`/rooms/${booking.room.id}/display`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[11px] text-primary-600 hover:underline mt-1"
                          >
                            <Tv className="w-3 h-3" /> Layar Kiosk Pintu
                          </Link>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap align-top">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-gray-700">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{formatDate(booking.booking_date)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</span>
                          </div>
                          {/* Check-In Status */}
                          <div className="pt-1">
                            {booking.checked_in_at ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Hadir ({formatTime(booking.checked_in_at)})
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-mono">
                                PIN: {booking.check_in_code || '-'} (Belum Check-In)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top" style={{ minWidth: '240px' }}>
                        <p className="font-medium text-gray-800 text-xs line-clamp-2">{booking.notes || <span className="text-gray-400 italic">Tidak ada agenda</span>}</p>
                        
                        {/* Services preview */}
                        {booking.services && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {booking.services.equipment?.map((eq) => (
                              <span key={eq} className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                🔧 {eq}
                              </span>
                            ))}
                            {booking.services.catering?.map((cat) => (
                              <span key={cat} className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                ☕ {cat} ({booking.services.catering_pax || 0}pax)
                              </span>
                            ))}
                          </div>
                        )}

                        {booking.status === 'cancelled' && booking.cancellation_reason && (
                          <p className="text-[11px] text-red-600 mt-1 italic">
                            Alasan: &ldquo;{booking.cancellation_reason}&rdquo;
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {booking.attendees?.length > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium">
                              <Users className="w-3 h-3" /> {booking.attendees.length} Peserta
                            </span>
                          )}
                          {booking.meeting_file && (
                            <a
                              href={booking.meeting_file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-colors font-medium"
                            >
                              <Paperclip className="w-3 h-3" /> Berkas Hasil
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap align-top">
                        <span className={getStatusBadge(booking.status)}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                            className="px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 active:bg-green-200 rounded-md transition-colors"
                            title="Set Dikonfirmasi"
                          >
                            Konfirmasi
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'completed')}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-md transition-colors"
                            title="Set Selesai"
                          >
                            Selesai
                          </button>
                          <button
                            onClick={() => openCancelModal(booking)}
                            className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 active:bg-red-200 rounded-md transition-colors"
                            title="Batalkan Booking & Tulis Alasan"
                          >
                            Batal
                          </button>
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
                    Aksi / Status ➡️
                  </button>
                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* MODAL ALASAN PEMBATALAN OLEH ADMIN */}
      {cancelModalBooking && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setCancelModalBooking(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-gray-900 text-base">Batalkan Reservasi Rapat</h3>
              </div>
              <button onClick={() => setCancelModalBooking(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Anda akan membatalkan jadwal rapat #{cancelModalBooking.id} di <b>{cancelModalBooking.room?.name}</b> oleh <b>{cancelModalBooking.user?.name}</b>.
            </p>

            {/* Quick Reasons Chips */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-1.5">Pilih Alasan Cepat:</p>
              <div className="flex flex-col gap-1.5">
                {[
                  'Ruangan dialihkan untuk kebutuhan mendesak Manajemen / Direksi',
                  'Perbaikan mendadak fasilitas ruangan / AC / Proyektor',
                  'Terjadi bentrok jadwal rapat internal darurat',
                  'Pemesan mengajukan pembatalan secara lisan / telepon',
                ].map((reasonText) => (
                  <button
                    key={reasonText}
                    type="button"
                    onClick={() => setCancellationReason(reasonText)}
                    className={`text-left text-xs p-2 rounded-lg border transition-colors ${
                      cancellationReason === reasonText
                        ? 'bg-red-50 border-red-300 text-red-800 font-medium'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {reasonText}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Textarea */}
            <form onSubmit={handleConfirmCancel} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Catatan / Alasan Khusus:
                </label>
                <textarea
                  rows={2}
                  required
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Ketik alasan pembatalan..."
                  className="input-field text-xs py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  className="btn-secondary text-xs py-2 px-3.5"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={submittingCancel || !cancellationReason.trim()}
                  className="btn-danger text-xs py-2 px-4 font-semibold"
                >
                  {submittingCancel ? 'Membatalkan...' : 'Konfirmasi Batal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
