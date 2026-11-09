import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  KeyRound,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Tv,
  Users,
  Zap,
  Check,
  AlertCircle
} from 'lucide-react'
import api from '../lib/axios'
import { formatTime, formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

export default function RoomKioskPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [quickBookingDuration, setQuickBookingDuration] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [submittingPin, setSubmittingPin] = useState(false)

  // Fetch display data
  const fetchDisplay = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true)
      const res = await api.get(`/rooms/${id}/display`)
      setData(res.data)
    } catch (err) {
      console.error('Failed to fetch room display', err)
      if (!isSilent) toast.error('Gagal memuat status ruangan')
    } finally {
      if (!isSilent) setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDisplay()
    // Poll every 15 seconds
    const interval = setInterval(() => {
      fetchDisplay(true)
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchDisplay])

  // Live ticking clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  // Quick Book handler
  const handleQuickBook = async (durationMinutes) => {
    setQuickBookingDuration(durationMinutes)
    try {
      const res = await api.post(`/rooms/${id}/quick-book`, { duration: durationMinutes })
      toast.success(res.data.message || `Rapat kilat ${durationMinutes} menit dimulai!`)
      await fetchDisplay(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memulai rapat kilat')
    } finally {
      setQuickBookingDuration(null)
    }
  }

  // Check in PIN handler
  const handleCheckInPin = async (e) => {
    e.preventDefault()
    if (!pinInput.trim() || !data?.current_booking) return
    setSubmittingPin(true)
    try {
      const res = await api.post(`/bookings/${data.current_booking.id}/check-in`, { code: pinInput.trim() })
      toast.success(res.data.message || 'Check-in ruangan berhasil!')
      setPinInput('')
      await fetchDisplay(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'PIN Check-in salah atau tidak valid')
    } finally {
      setSubmittingPin(false)
    }
  }

  // Quick check-in for current booking using its own code
  const handleInstantCheckIn = async () => {
    if (!data?.current_booking) return
    setSubmittingPin(true)
    try {
      const res = await api.post(`/bookings/${data.current_booking.id}/check-in`, {
        code: data.current_booking.check_in_code,
      })
      toast.success(res.data.message || 'Check-in ruangan berhasil diverifikasi!')
      await fetchDisplay(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal check-in')
    } finally {
      setSubmittingPin(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-12 h-12 text-primary-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold">Memuat Tampilan Pintu Ruangan...</h2>
        <p className="text-gray-400 text-sm mt-1">Menghubungkan ke MeetMe Smart Door Kiosk</p>
      </div>
    )
  }

  const room = data?.room
  const isOccupied = data?.is_occupied
  const currentBooking = data?.current_booking
  const nextBooking = data?.next_booking
  const todayBookings = data?.today_bookings || []

  // Calculate remaining minutes for current booking
  let remainingMinutes = 0
  if (isOccupied && currentBooking) {
    const [endH, endM] = (currentBooking.end_time || '00:00').split(':').map(Number)
    const endTotal = endH * 60 + endM
    const nowTotal = currentTime.getHours() * 60 + currentTime.getMinutes()
    remainingMinutes = Math.max(0, endTotal - nowTotal)
  }

  return (
    <div className={`min-h-screen ${isOccupied ? 'bg-gradient-to-br from-red-950 via-gray-950 to-neutral-950' : 'bg-gradient-to-br from-emerald-950 via-gray-950 to-neutral-950'} text-white flex flex-col justify-between p-4 sm:p-8 transition-colors duration-700`}>

      {/* TOP BAR: Room Info + Live Clock */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Link
            to={`/rooms/${id}`}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 transition-colors backdrop-blur-md"
            title="Keluar dari mode Kiosk"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <img
            src="/logo-white.png"
            alt="MeetMe - Badan Pusat Statistik"
            className="h-10 sm:h-12 w-auto object-contain hidden sm:block pr-3 border-r border-white/20"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-widest uppercase bg-white/15 px-2.5 py-0.5 rounded-full text-gray-300">
                Door Signage
              </span>
              <span className="text-xs text-gray-400">· {room?.location}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
              {room?.name}
            </h1>
          </div>
        </div>

        {/* Live Clock & Fullscreen Control */}
        <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto">
          <div className="text-right">
            <div className="font-mono text-3xl sm:text-4xl font-black tracking-wider text-white">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} <span className="text-base text-gray-400">WIB</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 font-medium">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDisplay(false)}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 transition backdrop-blur-md"
              title="Perbarui status"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 transition backdrop-blur-md"
              title={isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh (Tablet Door Sign)'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN BODY: Hero Status Card + Schedule Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1 items-stretch">

        {/* LEFT / HERO STATUS (Col 8) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between">
          {isOccupied ? (
            /* RED / OCCUPIED STATE */
            <div className="relative overflow-hidden rounded-3xl bg-red-950/60 border-2 border-red-500/50 p-6 sm:p-10 shadow-2xl flex-1 flex flex-col justify-between backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

              <div>
                {/* Big Status Badge */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-red-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg animate-pulse mb-6">
                  <span className="w-3 h-3 rounded-full bg-white animate-ping inline-block" />
                  SEDANG DIGUNAKAN (OCCUPIED)
                </div>

                {/* Meeting Title & Host */}
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight mb-3">
                  {currentBooking?.notes || 'Rapat Koordinasi Tim'}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base text-red-200 mb-6">
                  <div className="flex items-center gap-2 bg-red-900/50 px-3.5 py-1.5 rounded-xl border border-red-700/50">
                    <Clock className="w-4 h-4 text-red-300" />
                    <span className="font-mono font-bold">
                      {formatTime(currentBooking?.start_time)} – {formatTime(currentBooking?.end_time)} WIB
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-red-900/50 px-3.5 py-1.5 rounded-xl border border-red-700/50">
                    <span className="text-gray-300">Host:</span>
                    <span className="font-bold text-white">{currentBooking?.user?.name || 'Karyawan'}</span>
                    {currentBooking?.user?.position && (
                      <span className="text-xs text-red-300 font-medium">({currentBooking.user.position})</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Remaining Time Countdown & PIN Check-in */}
              <div className="pt-6 border-t border-red-800/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-red-300 font-semibold mb-1">
                      Sisa Durasi Rapat
                    </p>
                    <div className="text-3xl sm:text-4xl font-black font-mono text-white tracking-wide">
                      {remainingMinutes} <span className="text-lg font-normal text-red-200">Menit Tersisa</span>
                    </div>
                  </div>

                  {/* Check-In Status & Action */}
                  <div className="flex items-center gap-3">
                    {currentBooking?.checked_in_at ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-2xl text-xs sm:text-sm font-bold">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>Telah Check-In ({formatTime(currentBooking.checked_in_at)})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleInstantCheckIn}
                          disabled={submittingPin}
                          className="px-4 py-2.5 bg-white text-red-950 hover:bg-gray-100 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>{submittingPin ? 'Memverifikasi...' : '⚡ Check-In Ruangan'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* PIN Manual Input (If not checked-in) */}
                {!currentBooking?.checked_in_at && (
                  <form onSubmit={handleCheckInPin} className="flex items-center gap-2 max-w-sm pt-2">
                    <div className="relative flex-1">
                      <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Masukkan PIN 6-karakter..."
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                        maxLength={8}
                        className="w-full pl-9 pr-3 py-2 bg-red-900/40 border border-red-700/60 rounded-xl text-white placeholder-red-300/60 font-mono text-xs uppercase tracking-widest focus:outline-hidden focus:ring-2 focus:ring-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submittingPin}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition"
                    >
                      Kirim PIN
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* GREEN / AVAILABLE STATE */
            <div className="relative overflow-hidden rounded-3xl bg-emerald-950/60 border-2 border-emerald-500/50 p-6 sm:p-10 shadow-2xl flex-1 flex flex-col justify-between backdrop-blur-xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

              <div>
                {/* Big Status Badge */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg mb-6">
                  <span className="w-3 h-3 rounded-full bg-white inline-block" />
                  RUANGAN TERSEDIA (AVAILABLE)
                </div>

                <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-3">
                  Siap Digunakan
                </h2>

                <p className="text-emerald-200 text-sm sm:text-base max-w-xl">
                  {nextBooking ? (
                    <>
                      Ruangan kosong hingga pukul <span className="font-bold text-white font-mono">{formatTime(nextBooking.start_time)} WIB</span> ({nextBooking.notes || 'Rapat berikutnya'} oleh {nextBooking.user?.name}).
                    </>
                  ) : (
                    'Tidak ada agenda rapat lagi yang dijadwalkan untuk hari ini. Ruangan bebas dipakai untuk diskusi tim.'
                  )}
                </p>
              </div>

              {/* Instant Quick Book (Rapat Kilat 15, 30, 45, 60 Menit) */}
              <div className="pt-8 border-t border-emerald-800/40">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    ⚡ Rapat Kilat Spontan (1-Click Quick Meeting)
                  </p>
                </div>
                <p className="text-xs text-gray-300 mb-4">
                  Butuh ruangan sekarang tanpa reservasi di web? Tekan durasi di bawah untuk langsung memesan & mengunci ruangan:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[15, 30, 45, 60].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => handleQuickBook(dur)}
                      disabled={quickBookingDuration !== null}
                      className="group p-3.5 bg-emerald-900/50 hover:bg-emerald-600 border border-emerald-700/60 hover:border-emerald-500 rounded-2xl text-left transition-all duration-200 shadow-md flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-300 group-hover:text-white">
                        <span>Kilat</span>
                        <Zap className="w-3.5 h-3.5 text-yellow-400" />
                      </div>
                      <div className="text-2xl font-black font-mono text-white mt-1">
                        {dur} <span className="text-xs font-normal text-emerald-200 group-hover:text-white">Menit</span>
                      </div>
                      <span className="text-[10px] text-emerald-300/80 group-hover:text-emerald-100 mt-2 font-medium">
                        {quickBookingDuration === dur ? 'Memesan...' : 'Mulai Sekarang →'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT / TODAY'S TIMELINE SCHEDULE (Col 4) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <div className="rounded-3xl bg-neutral-900/80 border border-white/10 p-5 sm:p-6 shadow-2xl flex-1 flex flex-col justify-between backdrop-blur-xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary-400" />
                  <h3 className="font-extrabold text-sm sm:text-base text-white">Jadwal Rapat Hari Ini</h3>
                </div>
                <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full text-gray-300">
                  {todayBookings.length} Sesi
                </span>
              </div>

              {todayBookings.length > 0 ? (
                <div className="space-y-3 overflow-y-auto max-h-[480px] pr-1">
                  {todayBookings.map((b) => {
                    const isCurrent = currentBooking?.id === b.id
                    return (
                      <div
                        key={b.id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isCurrent
                            ? 'bg-red-950/70 border-red-500/60 shadow-md ring-1 ring-red-500/30'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className={`font-mono font-bold ${isCurrent ? 'text-red-300' : 'text-primary-300'}`}>
                            {formatTime(b.start_time)} – {formatTime(b.end_time)} WIB
                          </span>
                          {isCurrent ? (
                            <span className="text-[10px] uppercase font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                              Sedang Berlangsung
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              {b.checked_in_at ? '✓ Checked-in' : 'Terjadwal'}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm font-bold text-white truncate mb-1">
                          {b.notes || 'Rapat Koordinasi'}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-gray-400">
                          <span className="truncate">👤 {b.user?.name || 'Karyawan'}</span>
                          {b.check_in_code && (
                            <span className="font-mono text-gray-300 bg-white/10 px-1.5 py-0.5 rounded text-[10px]">
                              PIN: {b.check_in_code}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-gray-600" />
                  <p className="text-xs">Belum ada agenda rapat hari ini.</p>
                  <p className="text-[11px] text-gray-500">Ruangan bebas digunakan tim kapan saja.</p>
                </div>
              )}
            </div>

            {/* Room Info Footer */}
            <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>Kapasitas {room?.capacity || 10} Orang</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                <span className="text-[11px] text-gray-300">Live Kiosk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="text-center text-[11px] text-gray-500 pt-2">
        MeetMe Smart Office · Mode Layar Pintu Ruangan Rapat · Auto-refresh setiap 15 detik
      </div>
    </div>
  )
}
