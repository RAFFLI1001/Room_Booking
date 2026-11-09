import { useEffect, useState, useRef } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Coffee,
  FileText,
  MapPin,
  Monitor,
  Paperclip,
  Plus,
  Repeat,
  Trash2,
  Tv,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

function TimeSlotPicker({ booked, selected, onSelect }) {
  // Jam operasional kantor: 07:00 s/d 19:00
  const hours = Array.from({ length: 13 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

  // Normalisasi waktu booked ke format HH:mm
  const normalizedBooked = (booked || []).map((b) => ({
    ...b,
    start: (b.start_time || '').substring(0, 5),
    end: (b.end_time || '').substring(0, 5),
  }))

  const getOccupyingBooking = (slot) => {
    return normalizedBooked.find((b) => slot >= b.start && slot < b.end)
  }

  return (
    <div className="space-y-3 mt-3">
      {/* Grid Tombol Slot Jam */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1.5 sm:gap-2">
        {hours.map((slot) => {
          const bookingInfo = getOccupyingBooking(slot)
          const busy = Boolean(bookingInfo)
          const isStart = selected.start === slot
          const isEnd   = selected.end === slot
          const inRange = selected.start && selected.end && slot >= selected.start && slot <= selected.end

          return (
            <button
              key={slot}
              type="button"
              disabled={busy}
              onClick={() => onSelect(slot)}
              title={busy ? `Sedang digunakan (${bookingInfo.start} - ${bookingInfo.end}): ${bookingInfo.user_name || 'Karyawan'}` : `Pilih jam ${slot}`}
              className={`relative text-xs py-2 px-1 rounded-lg border font-semibold transition-all flex flex-col items-center justify-center ${
                busy
                  ? 'bg-red-50/90 border-red-300 text-red-500 cursor-not-allowed opacity-85'
                  : isStart || isEnd
                  ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                  : inRange
                  ? 'bg-primary-100 border-primary-300 text-primary-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-primary-400 hover:text-primary-600 shadow-2xs'
              }`}
            >
              <span className={busy ? 'line-through text-red-600 font-bold' : ''}>{slot}</span>
              {busy ? (
                <span className="text-[9px] font-bold text-red-600 uppercase tracking-tighter mt-0.5">
                  Dipakai
                </span>
              ) : (
                <span className="text-[9px] font-normal text-emerald-600 mt-0.5">
                  Tersedia
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Indikator Status Warna */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 pt-1.5 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-gray-300" />
          <span>Tersedia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <span className="font-medium text-red-600">Sedang Digunakan (Terkunci)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
          <span>Dipilih Anda</span>
        </div>
      </div>

      {/* Daftar Jadwal yang Terisi pada Tanggal Ini */}
      {normalizedBooked.length > 0 ? (
        <div className="bg-red-50/70 border border-red-200 rounded-xl p-3 space-y-1.5">
          <p className="text-xs font-bold text-red-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            Jadwal Rapat yang Sedang Terisi di Tanggal Ini:
          </p>
          <div className="space-y-1">
            {normalizedBooked.map((b, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-red-900 bg-white/90 px-2.5 py-1.5 rounded-lg border border-red-100">
                <span className="font-bold text-red-700 font-mono">
                  🔒 {b.start} – {b.end} WIB
                </span>
                <span className="text-gray-600 text-[11px] truncate">
                  Digunakan: <b>{b.user_name || 'Karyawan'}</b> {b.user_position ? `(${b.user_position})` : ''} {b.notes ? `• Agenda: ${b.notes}` : ''}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-red-600 mt-1 italic">
            * Jam-jam di atas tidak dapat dipilih oleh pengguna lain untuk menghindari bentrok jadwal.
          </p>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-800 flex items-center gap-2">
          <span>✅</span>
          <span>Seluruh jam di tanggal ini masih kosong dan bebas Anda booking.</span>
        </div>
      )}
    </div>
  )
}

export default function RoomDetailPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { isAuthenticated, user: currentUser } = useAuthStore()
  const fileInputRef = useRef(null)

  const [room, setRoom]             = useState(null)
  const [loading, setLoading]       = useState(true)
  const [date, setDate]             = useState('')
  const [booked, setBooked]         = useState([])
  const [form, setForm]             = useState({ start_time: '', end_time: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)

  // Fitur Peserta / Invite Teman
  const [availableUsers, setAvailableUsers] = useState([])
  const [attendees, setAttendees]           = useState([])
  const [participantInput, setParticipantInput] = useState('')

  // Fitur Upload Berkas / Hasil Rapat
  const [meetingFile, setMeetingFile] = useState(null)

  // Fitur Layanan Tambahan (Peralatan & Konsumsi)
  const [services, setServices] = useState({
    equipment: [],
    catering: [],
    catering_pax: 10,
  })

  // Fitur Reservasi Berulang (Recurring)
  const [recurringType, setRecurringType] = useState('none')

  const toggleEquipment = (item) => {
    setServices((prev) => {
      const exists = prev.equipment.includes(item)
      return {
        ...prev,
        equipment: exists ? prev.equipment.filter((x) => x !== item) : [...prev.equipment, item],
      }
    })
  }

  const toggleCatering = (item) => {
    setServices((prev) => {
      const exists = prev.catering.includes(item)
      return {
        ...prev,
        catering: exists ? prev.catering.filter((x) => x !== item) : [...prev.catering, item],
      }
    })
  }

  useEffect(() => {
    api.get(`/rooms/${id}`)
      .then(({ data }) => setRoom(data))
      .catch(() => navigate('/rooms'))
      .finally(() => setLoading(false))

    // Ambil daftar karyawan kantor untuk diundang
    if (isAuthenticated()) {
      api.get('/users')
        .then(({ data }) => setAvailableUsers(data || []))
        .catch(console.error)
    }
  }, [id])

  useEffect(() => {
    if (date) {
      api.get(`/rooms/${id}/availability`, { params: { date } })
        .then(({ data }) => setBooked(data.bookings || []))
        .catch(console.error)
    }
  }, [date, id])

  const handleTimeSelect = (slot) => {
    const normalized = (booked || []).map((b) => ({
      start: (b.start_time || '').substring(0, 5),
      end: (b.end_time || '').substring(0, 5),
    }))

    // Cek apakah slot yang diklik sedang digunakan
    const isSlotBusy = normalized.some((b) => slot >= b.start && slot < b.end)
    if (isSlotBusy) {
      toast.error(`Jam ${slot} sedang digunakan untuk rapat lain. Silakan pilih jam yang tersedia.`)
      return
    }

    if (!form.start_time || (form.start_time && form.end_time)) {
      setForm({ ...form, start_time: slot, end_time: '' })
    } else {
      if (slot <= form.start_time) {
        setForm({ ...form, start_time: slot, end_time: '' })
      } else {
        const hasConflictInRange = normalized.some(
          (b) => b.start < slot && b.end > form.start_time
        )

        if (hasConflictInRange) {
          toast.error('Rentang waktu yang Anda pilih bertabrakan dengan jadwal rapat lain.')
          return
        }

        setForm({ ...form, end_time: slot })
      }
    }
  }

  // Tambah peserta
  const handleAddParticipant = (e) => {
    e.preventDefault()
    const trimmed = participantInput.trim()
    if (!trimmed) return

    if (attendees.some((a) => (typeof a === 'string' ? a : a.name) === trimmed)) {
      toast.error('Peserta ini sudah ditambahkan')
      return
    }

    const matchedUser = availableUsers.find(
      (u) => u.name.toLowerCase() === trimmed.toLowerCase() || u.email.toLowerCase() === trimmed.toLowerCase()
    )

    if (matchedUser) {
      setAttendees([...attendees, { id: matchedUser.id, name: matchedUser.name, email: matchedUser.email, position: matchedUser.position }])
    } else {
      setAttendees([...attendees, { name: trimmed }])
    }

    setParticipantInput('')
  }

  const handleSelectUser = (u) => {
    if (attendees.some((a) => a.id === u.id)) {
      toast.error('Karyawan ini sudah ditambahkan ke daftar peserta')
      return
    }
    setAttendees([...attendees, { id: u.id, name: u.name, email: u.email, position: u.position }])
    setParticipantInput('')
  }

  const handleRemoveAttendee = (idx) => {
    setAttendees(attendees.filter((_, i) => i !== idx))
  }

  // File change
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ukuran berkas maksimal 10 MB')
        return
      }
      setMeetingFile(file)
    }
  }

  const durationHours = form.start_time && form.end_time
    ? parseInt(form.end_time) - parseInt(form.start_time)
    : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated()) {
      navigate('/login')
      return
    }
    if (!date || !form.start_time || !form.end_time) {
      toast.error('Pilih tanggal dan waktu booking')
      return
    }
    setSubmitting(true)

    const formData = new FormData()
    formData.append('room_id', id)
    formData.append('booking_date', date)
    formData.append('start_time', form.start_time)
    formData.append('end_time', form.end_time)
    if (form.notes) formData.append('notes', form.notes)

    // Append attendees as JSON
    formData.append('attendees', JSON.stringify(attendees))

    // Append services & recurring option
    formData.append('services', JSON.stringify(services))
    formData.append('recurring_type', recurringType)

    // Append meeting file if attached
    if (meetingFile) {
      formData.append('meeting_file', meetingFile)
    }

    try {
      const { data } = await api.post('/bookings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success(data.message || 'Reservasi ruangan rapat berhasil dibuat!')
      navigate(`/bookings/${data.booking.id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reservasi gagal')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
      <div className="h-64 bg-gray-200 rounded-xl mb-6" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
    </div>
  )

  if (!room) return null

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate())
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Room Info */}
        <div className="lg:col-span-3">
          <div className="h-72 rounded-xl overflow-hidden mb-6 bg-gradient-to-br from-primary-100 to-blue-200">
            {room.image_url ? (
              <img
                src={room.image_url}
                alt={room.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80'
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-24 h-24 text-primary-300" />
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{room.name}</h1>
            <Link
              to={`/rooms/${room.id}/display`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 hover:bg-black text-white shadow-xs self-start transition-all"
              title="Buka tampilan tablet signage untuk dipasang di pintu ruangan rapat"
            >
              <Tv className="w-3.5 h-3.5 text-primary-400" />
              <span>Mode Layar Pintu (Kiosk)</span>
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-5 h-5 text-primary-500" />
              <span>{room.location}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-5 h-5 text-primary-500" />
              <span>Kapasitas {room.capacity} orang</span>
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed mb-6">{room.description}</p>

          {room.facilities?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Fasilitas Ruangan</h3>
              <div className="flex flex-wrap gap-2">
                {room.facilities.map((f) => (
                  <div key={f} className="flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg text-sm">
                    <CheckCircle className="w-4 h-4" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5 bg-blue-50/50 border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Tipe Ruangan</p>
                <p className="text-lg font-bold text-gray-900">Ruangan Rapat Internal Kantor</p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                room.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {room.is_available ? 'Tersedia' : 'Tidak Tersedia'}
              </span>
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-20 shadow-md border border-gray-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Formulir Reservasi</h2>
                <p className="text-xs text-gray-500">Pilih tanggal & jam untuk memesan ruangan</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                Bebas Biaya
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary-600" />
                  Tanggal Rapat
                </label>
                <input
                  type="date"
                  min={minDate}
                  className="input-field text-sm"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value)
                    setForm({ ...form, start_time: '', end_time: '' })
                  }}
                  required
                />
              </div>

              {date && (
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary-600" />
                      Pilih Jam Rapat
                    </label>
                    <span className="text-[11px] text-gray-400">Klik jam mulai, lalu jam selesai</span>
                  </div>

                  <TimeSlotPicker
                    booked={booked}
                    selected={{ start: form.start_time, end: form.end_time }}
                    onSelect={handleTimeSelect}
                  />

                  {/* Waktu Mulai & Selesai yang Dipilih */}
                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Jam Mulai:</span>
                      <span className="font-bold text-primary-700 text-sm">
                        {form.start_time ? `${form.start_time} WIB` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Jam Selesai:</span>
                      <span className="font-bold text-primary-700 text-sm">
                        {form.end_time ? `${form.end_time} WIB` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Agenda / Keperluan Rapat
                </label>
                <textarea
                  className="input-field text-sm"
                  rows={2}
                  placeholder="Contoh: Rapat koordinasi project Q4, review mingguan tim marketing..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {/* Fitur: Undang Peserta Rapat */}
              <div className="border-t pt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-primary-600" />
                    Peserta Rapat <span className="text-gray-400 font-normal text-xs">(Opsional)</span>
                  </span>
                  <span className="text-xs text-primary-600 font-medium">{attendees.length} dipilih</span>
                </label>

                {/* Input cari / ketik peserta */}
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="input-field text-xs py-2 flex-1"
                    placeholder="Ketik nama atau email rekan kerja..."
                    value={participantInput}
                    onChange={(e) => setParticipantInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddParticipant(e)
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    className="btn-secondary text-xs py-2 px-3 shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </div>

                {/* Autocomplete rekomendasi karyawan kantor */}
                {participantInput && availableUsers.length > 0 && (
                  <div className="border border-gray-200 rounded-lg max-h-36 overflow-y-auto mb-2 bg-white shadow-sm divide-y divide-gray-100">
                    {availableUsers
                      .filter(
                        (u) =>
                          u.name.toLowerCase().includes(participantInput.toLowerCase()) ||
                          u.email.toLowerCase().includes(participantInput.toLowerCase())
                      )
                      .slice(0, 4)
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="w-full text-left p-2 hover:bg-primary-50 flex items-center justify-between text-xs transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-gray-900">{u.name}</span>
                            <span className="text-gray-400 ml-1.5">({u.email})</span>
                          </div>
                          {u.position && (
                            <span className="text-[10px] text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded font-medium">
                              {u.position}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                )}

                {/* Badge list peserta yang ditambahkan */}
                {attendees.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-150">
                    {attendees.map((a, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-xs bg-white text-gray-800 border border-gray-200 px-2.5 py-1 rounded-full shadow-2xs"
                      >
                        <span className="font-medium">{typeof a === 'string' ? a : a.name}</span>
                        {a.position && (
                          <span className="text-[10px] text-gray-400">({a.position})</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttendee(idx)}
                          className="text-gray-400 hover:text-red-500 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic">Belum ada peserta yang ditambahkan.</p>
                )}
              </div>

              {/* Fitur: Upload Softfile / Berkas Rapat (Opsional) */}
              <div className="border-t pt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-primary-600" />
                  Berkas / Bahan Rapat <span className="text-gray-400 font-normal text-xs">(Opsional)</span>
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  Dapat berupa PDF, Word (.docx), Excel, PowerPoint, atau softfile lainnya (Maks. 10MB).
                </p>

                {meetingFile ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-primary-600 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-gray-900 truncate">{meetingFile.name}</p>
                        <p className="text-gray-500 text-[10px]">{(meetingFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMeetingFile(null)}
                      className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors ml-2"
                      title="Hapus file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 hover:border-primary-400 rounded-lg py-2.5 px-3 text-xs text-gray-600 hover:text-primary-600 font-medium flex items-center justify-center gap-2 transition-all bg-gray-50/50 hover:bg-primary-50/30"
                    >
                      <Paperclip className="w-4 h-4" />
                      Pilih Berkas Softfile (PDF/Word/Excel)
                    </button>
                  </div>
                )}
              </div>

              {/* Fitur: Permintaan Layanan Tambahan (Peralatan & Konsumsi) */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                    <Coffee className="w-4 h-4 text-primary-600" />
                    Kebutuhan Tambahan <span className="text-gray-400 font-normal text-xs">(Opsional)</span>
                  </label>
                </div>

                {/* Peralatan */}
                <div className="space-y-1.5 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                  <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                    <Monitor className="w-3.5 h-3.5 text-gray-500" /> Peralatan Teknis:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {[
                      'Mic Wireless Tambahan',
                      'Converter HDMI / Type-C',
                      'Pointer Laser Presentasi',
                      'Whiteboard Marker Ekstra',
                    ].map((item) => {
                      const checked = services.equipment.includes(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleEquipment(item)}
                          className={`text-left text-xs p-2 rounded-lg border transition-all flex items-center gap-2 ${
                            checked
                              ? 'bg-primary-50 border-primary-400 text-primary-800 font-semibold shadow-2xs'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            checked ? 'bg-primary-600 border-primary-600 text-white' : 'border-gray-300 bg-white'
                          }`}>
                            {checked ? '✓' : ''}
                          </span>
                          <span className="truncate">{item}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Konsumsi */}
                <div className="space-y-2 bg-gray-50/80 p-3 rounded-xl border border-gray-200">
                  <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                    <Coffee className="w-3.5 h-3.5 text-gray-500" /> Konsumsi Rapat (Office GA):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {[
                      'Kopi & Teh Panas',
                      'Air Mineral Botol',
                      'Snack Box',
                      'Nasi Kotak / Lunch Box',
                    ].map((item) => {
                      const checked = services.catering.includes(item)
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleCatering(item)}
                          className={`text-left text-xs p-2 rounded-lg border transition-all flex items-center gap-2 ${
                            checked
                              ? 'bg-amber-50 border-amber-400 text-amber-900 font-semibold shadow-2xs'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <span className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                            checked ? 'bg-amber-600 border-amber-600 text-white' : 'border-gray-300 bg-white'
                          }`}>
                            {checked ? '✓' : ''}
                          </span>
                          <span className="truncate">{item}</span>
                        </button>
                      )
                    })}
                  </div>

                  {services.catering.length > 0 && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
                      <span className="text-gray-600 font-medium">Jumlah Peserta / Porsi:</span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max={room.capacity * 2}
                          value={services.catering_pax}
                          onChange={(e) => setServices({ ...services, catering_pax: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="w-16 input-field py-1 px-2 text-center text-xs font-bold"
                        />
                        <span className="text-gray-500 text-xs">Pax</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fitur: Reservasi Berulang (Recurring Meeting) */}
              <div className="border-t pt-4">
                <label className="block text-sm font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
                  <Repeat className="w-4 h-4 text-primary-600" />
                  Ulangi Rapat Ini <span className="text-gray-400 font-normal text-xs">(Rapat Rutin)</span>
                </label>
                <select
                  value={recurringType}
                  onChange={(e) => setRecurringType(e.target.value)}
                  className="input-field py-2 text-xs"
                >
                  <option value="none">Tidak Berulang (Sekali saja)</option>
                  <option value="weekly_4">Setiap Minggu (4 sesi berturut-turut)</option>
                  <option value="biweekly_2">Setiap 2 Minggu (2 sesi)</option>
                  <option value="monthly_3">Setiap Bulan (3 sesi berturut-turut)</option>
                </select>
                {recurringType !== 'none' && (
                  <p className="text-[11px] text-primary-700 bg-primary-50 p-2 rounded-lg mt-1.5 border border-primary-200">
                    ℹ️ Sistem akan otomatis memesan jam yang sama di setiap sesi dan memastikan tidak ada tanggal yang bentrok.
                  </p>
                )}
              </div>

              {/* Summary */}
              {durationHours > 0 && (
                <div className="bg-primary-50 rounded-lg p-3.5 space-y-1.5 text-sm">
                  <div className="flex justify-between text-gray-700 font-medium">
                    <span>Durasi Rapat:</span>
                    <span className="text-primary-700 font-bold">{durationHours} jam</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>Peserta Diundang:</span>
                    <span className="text-gray-800 font-medium">{attendees.length} orang</span>
                  </div>
                  {recurringType !== 'none' && (
                    <div className="flex justify-between text-gray-600 text-xs">
                      <span>Total Sesi Rutin:</span>
                      <span className="text-primary-700 font-bold">
                        {recurringType === 'weekly_4' ? '4 Pertemuan' : recurringType === 'biweekly_2' ? '2 Pertemuan' : '3 Pertemuan'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>Status Biaya:</span>
                    <span className="text-green-700 font-semibold bg-green-100 px-2 py-0.5 rounded">Fasilitas Kantor (Gratis)</span>
                  </div>
                </div>
              )}

              {!isAuthenticated() ? (
                <button type="button" onClick={() => navigate('/login')} className="btn-primary w-full">
                  Masuk untuk Booking
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting || !date || !form.start_time || !form.end_time}
                  className="btn-primary w-full text-sm font-semibold shadow-md py-3"
                >
                  {submitting ? 'Memproses Reservasi...' : 'Konfirmasi Reservasi Ruangan'}
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
