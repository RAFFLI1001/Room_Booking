import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CalendarPlus,
  CheckCircle,
  CheckCircle2,
  Clock,
  Coffee,
  Download,
  FileCheck,
  FileText,
  MapPin,
  MessageSquare,
  Monitor,
  Paperclip,
  Plus,
  QrCode,
  Repeat,
  Smartphone,
  Trash2,
  Tv,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  X
} from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import {
  buildGoogleCalendarUrl,
  buildWhatsAppNotificationUrl,
  downloadICS,
  formatDate,
  formatTime,
  getStatusLabel
} from '../../lib/utils'
import toast from 'react-hot-toast'

export default function BookingDetailPage() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const { user: currentUser } = useAuthStore()

  const [booking, setBooking]         = useState(null)
  const [loading, setLoading]         = useState(true)
  const [cancelling, setCancelling]   = useState(false)
  const [checkingIn, setCheckingIn]   = useState(false)
  const [showQrModal, setShowQrModal] = useState(false)

  // Fitur Peserta / Invite Teman
  const [availableUsers, setAvailableUsers] = useState([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [participantInput, setParticipantInput] = useState('')
  const [savingAttendees, setSavingAttendees] = useState(false)

  // Fitur Upload Hasil Rapat
  const fileInputRef = useRef(null)
  const [uploadingFile, setUploadingFile] = useState(false)

  useEffect(() => {
    api.get(`/bookings/${id}`)
      .then(({ data }) => setBooking(data))
      .catch(() => navigate('/bookings'))
      .finally(() => setLoading(false))

    // Ambil daftar rekan kantor untuk diundang
    api.get('/users')
      .then(({ data }) => setAvailableUsers(data || []))
      .catch(console.error)
  }, [id, navigate])

  // Check-in ruangan mandiri
  const handleCheckIn = async (codeToUse) => {
    const code = typeof codeToUse === 'string' ? codeToUse : booking?.check_in_code
    setCheckingIn(true)
    try {
      const { data } = await api.post(`/bookings/${id}/check-in`, { code })
      setBooking(data.booking)
      toast.success(data.message || 'Check-in berhasil! Ruangan siap digunakan.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in gagal. Periksa kembali PIN Anda.')
    } finally {
      setCheckingIn(false)
    }
  }

  // Batalkan booking
  const handleCancel = async () => {
    if (!confirm('Yakin ingin membatalkan reservasi rapat ini?')) return
    setCancelling(true)
    try {
      await api.patch(`/bookings/${id}/cancel`)
      toast.success('Reservasi rapat berhasil dibatalkan')
      setBooking((prev) => ({ ...prev, status: 'cancelled' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan')
    } finally {
      setCancelling(false)
    }
  }

  // Tambah peserta rapat dari dropdown
  const handleAddColleague = async (colleagueId) => {
    if (!colleagueId) return
    const selected = availableUsers.find((u) => String(u.id) === String(colleagueId))
    if (!selected) return

    const currentList = booking.attendees || []
    if (currentList.some((a) => a.email === selected.email)) {
      toast.error('Rekan ini sudah ada di daftar peserta')
      return
    }

    const updated = [...currentList, { name: selected.name, email: selected.email, position: selected.position || '', user_id: selected.id }]
    await saveAttendees(updated)
  }

  // Tambah peserta manual (nama / email luar)
  const handleAddManualParticipant = async (e) => {
    e.preventDefault()
    const trimmed = participantInput.trim()
    if (!trimmed) return

    const currentList = booking.attendees || []
    if (currentList.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Peserta ini sudah ada di daftar')
      return
    }

    const updated = [...currentList, { name: trimmed, email: trimmed.includes('@') ? trimmed : '' }]
    await saveAttendees(updated)
    setParticipantInput('')
  }

  // Hapus peserta
  const handleRemoveAttendee = async (indexToRemove) => {
    const updated = (booking.attendees || []).filter((_, idx) => idx !== indexToRemove)
    await saveAttendees(updated)
  }

  // Simpan perubahan peserta ke backend
  const saveAttendees = async (newAttendees) => {
    setSavingAttendees(true)
    try {
      const { data } = await api.put(`/bookings/${id}/attendees`, { attendees: newAttendees })
      setBooking(data.booking)
      toast.success('Daftar peserta diperbarui')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui peserta')
    } finally {
      setSavingAttendees(false)
    }
  }

  // Upload hasil rapat / notulensi
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran berkas maksimal 10 MB')
      return
    }

    setUploadingFile(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await api.post(`/bookings/${id}/upload-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setBooking(data.booking)
      toast.success('Berkas hasil rapat berhasil diunggah!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengunggah berkas')
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Hapus file rapat
  const handleDeleteFile = async () => {
    if (!confirm('Hapus berkas hasil rapat ini?')) return
    try {
      const { data } = await api.delete(`/bookings/${id}/delete-file`)
      setBooking(data.booking)
      toast.success('Berkas berhasil dihapus')
    } catch (err) {
      toast.error('Gagal menghapus berkas')
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="card h-64" />
    </div>
  )

  if (!booking) return null

  const canCancel = ['pending', 'confirmed'].includes(booking.status)
  const attendeesList = booking.attendees || []
  const qrCodeUrl = booking.qr_code_url || `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(booking.check_in_code || 'MEETME')}`

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <Link to="/bookings" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Reservasi
        </Link>
        {booking.room && (
          <Link
            to={`/rooms/${booking.room.id}/display`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-200 transition"
          >
            <Tv className="w-3.5 h-3.5" /> Buka Layar Pintu (Kiosk)
          </Link>
        )}
      </div>

      <div className="card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-primary-200 text-xs font-medium uppercase tracking-wider">
                  Reservasi Ruangan Rapat #{booking.id}
                </span>
                {booking.recurring_group_id && (
                  <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
                    <Repeat className="w-3 h-3" /> Jadwal Berulang
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold">{booking.room?.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                booking.status === 'confirmed' ? 'bg-green-500 text-white'
                  : booking.status === 'completed' ? 'bg-blue-500 text-white'
                  : booking.status === 'cancelled' ? 'bg-red-500 text-white'
                  : 'bg-yellow-500 text-white'
              }`}>
                {getStatusLabel(booking.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Details Content */}
        <div className="p-6 space-y-6">

          {/* Alert jika Dibatalkan & Alasan Pembatalan */}
          {booking.status === 'cancelled' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-red-900">Reservasi Rapat Ini Telah Dibatalkan</p>
                {booking.cancellation_reason ? (
                  <p className="text-xs text-red-700 mt-1">
                    <span className="font-semibold">Alasan Pembatalan:</span> &ldquo;{booking.cancellation_reason}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-red-600 mt-1">
                    Jadwal ini dibatalkan dan slot jam telah dibebaskan kembali untuk karyawan lain.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* KARTU CHECK-IN QR & PIN */}
          {booking.status !== 'cancelled' && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-emerald-200/80 rounded-2xl p-5 shadow-2xs">
              <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div
                    onClick={() => setShowQrModal(true)}
                    className="cursor-pointer group relative p-1.5 bg-white rounded-xl shadow-xs border border-emerald-200 hover:scale-105 transition-transform"
                    title="Klik untuk perbesar QR Code"
                  >
                    <img
                      src={qrCodeUrl}
                      alt="QR Check-in"
                      className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-bold">
                      Perbesar
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <QrCode className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                        Check-In Masuk Ruangan
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 max-w-sm mb-2">
                      Scan QR di pintu tablet ruangan atau masukkan PIN 6-karakter saat rapat dimulai:
                    </p>
                    <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-2xs">
                      <span className="text-[11px] text-gray-500 font-semibold uppercase">PIN Masuk:</span>
                      <span className="font-mono text-base font-extrabold tracking-widest text-emerald-700">
                        {booking.check_in_code || '------'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center md:items-end gap-2 w-full md:w-auto">
                  {booking.checked_in_at ? (
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Sudah Check-In ({formatTime(booking.checked_in_at)})</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCheckIn(booking.check_in_code)}
                      disabled={checkingIn}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition hover:shadow"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{checkingIn ? 'Memproses...' : '⚡ Check-In Sekarang'}</span>
                    </button>
                  )}
                  <p className="text-[10px] text-gray-500 text-center md:text-right">
                    {booking.checked_in_at
                      ? 'Kehadiran di ruangan telah diverifikasi'
                      : 'Cegah no-show dengan check-in saat tiba di ruangan'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Modal Pop-up QR Code Besar */}
          {showQrModal && (
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
              onClick={() => setShowQrModal(false)}
            >
              <div
                className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-sm">QR Code Check-In Ruangan</h3>
                  <button onClick={() => setShowQrModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl flex justify-center">
                  <img src={qrCodeUrl} alt="QR Code" className="w-60 h-60 object-contain rounded-lg" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">PIN Manual Tablet Pintu:</p>
                  <p className="font-mono text-2xl font-black text-emerald-700 tracking-widest">{booking.check_in_code}</p>
                </div>
                <button onClick={() => setShowQrModal(false)} className="btn-secondary w-full text-xs py-2">
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* Info Pemesan / Penanggung Jawab Rapat */}
          {booking.user && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-gray-50/80 rounded-xl border border-gray-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm shadow-2xs">
                  {booking.user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Pemesan / Penanggung Jawab Rapat:</p>
                  <p className="text-sm font-bold text-gray-900">{booking.user.name}</p>
                </div>
              </div>
              {booking.user.position && (
                <span className="self-start sm:self-auto inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Briefcase className="w-3.5 h-3.5" /> {booking.user.position}
                </span>
              )}
            </div>
          )}

          {/* Info Utama */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-2">
            <InfoItem icon={Calendar} label="Tanggal" value={formatDate(booking.booking_date)} />
            <InfoItem icon={Clock} label="Waktu" value={`${formatTime(booking.start_time)} – ${formatTime(booking.end_time)}`} />
            <InfoItem icon={MapPin} label="Lokasi" value={booking.room?.location} />
            <InfoItem icon={Users} label="Kapasitas" value={`${booking.room?.capacity} orang`} />
          </div>

          {/* Agenda Rapat */}
          {booking.notes && (
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Agenda / Keperluan Rapat</p>
              <p className="text-gray-800 text-sm font-medium">{booking.notes}</p>
            </div>
          )}

          {/* FITUR 3: PERMINTAAN LAYANAN FASILITAS & KONSUMSI (SERVICES) */}
          {booking.services && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Layanan Tambahan & Konsumsi Rapat</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Peralatan Teknis */}
                <div className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5" /> Peralatan Teknis
                  </p>
                  {booking.services.equipment?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {booking.services.equipment.map((eq) => (
                        <span key={eq} className="bg-white border border-amber-200 text-amber-900 text-xs px-2.5 py-1 rounded-md font-medium">
                          ✓ {eq}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Tidak ada permintaan alat tambahan</p>
                  )}
                </div>

                {/* Konsumsi & Catering */}
                <div className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5" /> Konsumsi
                    </p>
                    {booking.services.catering_pax > 0 && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                        {booking.services.catering_pax} Pax
                      </span>
                    )}
                  </div>
                  {booking.services.catering?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {booking.services.catering.map((cat) => (
                        <span key={cat} className="bg-white border border-amber-200 text-amber-900 text-xs px-2.5 py-1 rounded-md font-medium">
                          ☕ {cat}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">Tanpa pesanan konsumsi</p>
                  )}
                </div>
              </div>

              {booking.services.notes && (
                <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-700">Catatan Khusus Logistik:</span> {booking.services.notes}
                </p>
              )}
            </div>
          )}

          {/* Fasilitas Standar Ruangan */}
          {booking.room?.facilities?.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Fasilitas Standar Ruangan</p>
              <div className="flex flex-wrap gap-1.5">
                {booking.room.facilities.map((fac) => (
                  <span key={fac} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-md font-medium">
                    {fac}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* FITUR HASIL RAPAT / NOTULENSI & SOFTFILE */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Hasil Rapat & Dokumen Tim</h3>
              </div>
            </div>

            {booking.meeting_file_url ? (
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {booking.meeting_file_name || 'Dokumen Hasil Rapat'}
                    </p>
                    <p className="text-[11px] text-gray-500">Berkas notulensi / materi rapat siap diunduh</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={booking.meeting_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    download
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </a>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
                    title="Ganti berkas"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteFile}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="Hapus berkas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700">Belum ada dokumen hasil rapat / notulensi yang diunggah</p>
                    <p className="text-[11px] text-gray-400">Unggah notulensi, presentasi, atau rangkuman rapat tim Anda (Maks. 10MB)</p>
                  </div>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingFile ? 'Mengunggah...' : 'Unggah Notulensi'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FITUR DAFTAR PESERTA & INVITE TEMAN */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-600" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  Daftar Peserta Rapat ({attendeesList.length} Orang)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(!showInviteModal)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-2.5 py-1 rounded-md"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showInviteModal ? 'Tutup' : 'Undang Rekan'}
              </button>
            </div>

            {/* Form invite rekan */}
            {showInviteModal && (
              <div className="p-3.5 mb-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
                <p className="text-xs font-semibold text-gray-700">Undang Rekan ke Rapat Ini:</p>
                {availableUsers.length > 0 && (
                  <select
                    className="input-field text-xs py-1.5"
                    onChange={(e) => { handleAddColleague(e.target.value); e.target.value = '' }}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Pilih dari Daftar Karyawan --</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.position ? `(${u.position})` : ''} — {u.email}
                      </option>
                    ))}
                  </select>
                )}

                <form onSubmit={handleAddManualParticipant} className="flex gap-2">
                  <input
                    type="text"
                    className="input-field text-xs py-1.5"
                    placeholder="Atau masukkan nama / email peserta bebas..."
                    value={participantInput}
                    onChange={(e) => setParticipantInput(e.target.value)}
                  />
                  <button type="submit" disabled={savingAttendees} className="btn-primary text-xs px-3 py-1.5 shrink-0 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </form>
              </div>
            )}

            {/* List peserta */}
            {attendeesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {attendeesList.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {att.name?.charAt(0) || 'P'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-gray-900 truncate">{att.name}</p>
                          {att.position && (
                            <span className="text-[10px] text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded font-medium">
                              {att.position}
                            </span>
                          )}
                        </div>
                        {att.email && <p className="text-gray-400 text-[11px] truncate">{att.email}</p>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttendee(idx)}
                      disabled={savingAttendees}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                      title="Hapus peserta"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                <p className="text-xs text-gray-400">Belum ada daftar peserta yang ditambahkan.</p>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="text-xs text-primary-600 font-medium hover:underline mt-1 inline-block"
                >
                  + Tambah peserta sekarang
                </button>
              </div>
            )}
          </div>

          {/* PENGINGAT WHATSAPP & SINKRONISASI KE KALENDER HP */}
          {booking.status !== 'cancelled' && (
            <div className="border-t border-gray-100 pt-5">
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50/70 to-emerald-50/50 rounded-2xl p-4 sm:p-5 border border-blue-100 space-y-3.5">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary-600 shrink-0" />
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Pengingat WhatsApp & Sinkronisasi Kalender
                  </h4>
                </div>
                <p className="text-xs text-gray-600">
                  Kirim pengingat lengkap via WhatsApp ke tim rapat atau simpan jadwal langsung ke kalender handphone Anda:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* WhatsApp Share Button */}
                  <a
                    href={buildWhatsAppNotificationUrl(booking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors"
                  >
                    <MessageSquare className="w-4 h-4 shrink-0" />
                    <span>Kirim ke WhatsApp</span>
                  </a>

                  {/* Google Calendar */}
                  <a
                    href={buildGoogleCalendarUrl(booking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 font-semibold text-xs rounded-xl shadow-2xs transition-colors"
                  >
                    <CalendarPlus className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Google Calendar</span>
                  </a>

                  {/* Kalender Bawaan HP (.ics) */}
                  <button
                    type="button"
                    onClick={() => {
                      downloadICS(booking)
                      toast.success('File kalender berhasil diunduh! Buka untuk menambah ke Kalender HP.')
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition-colors"
                  >
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Kalender HP (.ics)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cancel */}
          {canCancel && (
            <div className="border-t border-gray-100 pt-4">
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-2 btn-danger text-xs py-2 px-3.5"
              >
                <X className="w-4 h-4" />
                {cancelling ? 'Membatalkan...' : 'Batalkan Reservasi Rapat'}
              </button>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Membatalkan jadwal akan membuka kembali slot jam ruangan ini untuk tim lainnya.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5 text-gray-900 font-semibold text-xs sm:text-sm">
        <Icon className="w-3.5 h-3.5 text-primary-500 shrink-0" />
        <span className="truncate">{value}</span>
      </div>
    </div>
  )
}
