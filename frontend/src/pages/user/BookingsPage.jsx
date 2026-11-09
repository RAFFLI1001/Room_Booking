import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Filter,
  MessageSquare,
  Paperclip,
  Repeat,
  Smartphone,
  Users
} from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import api from '../../lib/axios'
import {
  buildGoogleCalendarUrl,
  buildWhatsAppNotificationUrl,
  downloadICS,
  formatCurrency,
  formatDate,
  formatTime,
  getStatusBadge,
  getStatusLabel
} from '../../lib/utils'
import toast from 'react-hot-toast'

export default function BookingsPage() {
  const [bookings, setBookings]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [view, setView]             = useState('list')   // 'list' | 'calendar'
  const [filter, setFilter]         = useState('all')

  useEffect(() => {
    api.get('/bookings').then(({ data }) => setBookings(data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter)

  const calendarEvents = bookings
    .filter((b) => b.status !== 'cancelled')
    .map((b) => ({
      id:    String(b.id),
      title: b.room?.name || 'Booking',
      start: `${b.booking_date}T${b.start_time}`,
      end:   `${b.booking_date}T${b.end_time}`,
      color: b.status === 'confirmed' ? '#2563eb' : b.status === 'completed' ? '#7c3aed' : '#6b7280',
      url:   `/bookings/${b.id}`,
    }))

  const statuses = [
    { value: 'all',       label: 'Semua' },
    { value: 'confirmed', label: 'Dikonfirmasi' },
    { value: 'pending',   label: 'Menunggu' },
    { value: 'completed', label: 'Selesai' },
    { value: 'cancelled', label: 'Dibatalkan' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Jadwal Rapat Saya</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{bookings.length} total reservasi rapat</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('list')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${view === 'list' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
          >
            Daftar List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${view === 'calendar' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-300 text-gray-700'}`}
          >
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Kalender
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="card p-3 sm:p-6 overflow-x-auto">
          <div className="min-w-[500px]">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={calendarEvents}
              locale="id"
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,dayGridWeek' }}
              height="auto"
              eventClick={(info) => { info.jsEvent.preventDefault(); window.location.href = info.event.url }}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Filter tabs */}
          <div className="flex gap-1.5 sm:gap-2 flex-wrap mb-5">
            {statuses.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                  filter === value ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="card p-5 animate-pulse h-28" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 sm:py-16 card p-4">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Tidak ada jadwal reservasi rapat</p>
              <Link to="/rooms" className="btn-primary mt-4 inline-block text-xs sm:text-sm">Reservasi Sekarang</Link>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filtered.map((b) => (
                <div key={b.id} className="card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 sm:block">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] sm:text-xs font-semibold text-primary-600 uppercase">
                        {new Date(b.booking_date).toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                      <span className="text-lg sm:text-xl font-extrabold text-primary-700 leading-none">
                        {new Date(b.booking_date).getDate()}
                      </span>
                    </div>
                    <div className="sm:hidden flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-gray-900 truncate text-sm">{b.room?.name}</p>
                        {b.recurring_group_id && (
                          <span className="text-[10px] bg-primary-50 text-primary-700 px-1.5 py-0.2 rounded font-bold">
                            🔁 Rutin
                          </span>
                        )}
                      </div>
                      <span className={getStatusBadge(b.status)}>{getStatusLabel(b.status)}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="hidden sm:flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-base">{b.room?.name}</p>
                      {b.recurring_group_id && (
                        <span className="text-[10px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-bold">
                          🔁 Jadwal Berulang
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-500 text-xs sm:text-sm mt-0.5">
                      <span className="flex items-center gap-1 font-semibold text-gray-700">
                        <Clock className="w-3.5 h-3.5 text-primary-500" />
                        {formatTime(b.start_time)} – {formatTime(b.end_time)}
                      </span>

                      {/* Check-In Badge */}
                      {b.checked_in_at ? (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Hadir
                        </span>
                      ) : b.status !== 'cancelled' ? (
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono font-medium">
                          PIN: {b.check_in_code || '-'}
                        </span>
                      ) : null}

                      {b.attendees?.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                          <Users className="w-3 h-3" /> {b.attendees.length} Peserta
                        </span>
                      )}

                      {b.meeting_file && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                          <Paperclip className="w-3 h-3" /> Berkas
                        </span>
                      )}
                    </div>

                    {b.notes && <p className="text-gray-600 text-xs mt-1.5 truncate font-medium">Agenda: {b.notes}</p>}
                    {b.status === 'cancelled' && b.cancellation_reason && (
                      <p className="text-xs text-red-600 mt-1 italic">
                        Alasan Batal: &ldquo;{b.cancellation_reason}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex-wrap">
                    <span className={`hidden sm:inline-block ${getStatusBadge(b.status)}`}>{getStatusLabel(b.status)}</span>

                    {b.status !== 'cancelled' && (
                      <>
                        {/* WhatsApp Share Link */}
                        <a
                          href={buildWhatsAppNotificationUrl(b)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold transition-colors"
                          title="Bagikan pengingat jadwal ke WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WA</span>
                        </a>

                        {/* Google Calendar Link */}
                        <a
                          href={buildGoogleCalendarUrl(b)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md font-semibold transition-colors"
                          title="Tambahkan ke Kalender HP / Google Calendar"
                        >
                          <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
                          <span>Kalender</span>
                        </a>
                      </>
                    )}

                    <Link
                      to={`/bookings/${b.id}`}
                      className="inline-flex items-center gap-1 text-xs sm:text-sm text-primary-600 font-semibold hover:underline"
                    >
                      <span>Detail</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
