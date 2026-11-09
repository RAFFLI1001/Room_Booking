/**
 * Get full working Avatar URL
 */
export const getAvatarUrl = (userOrAvatar) => {
  if (!userOrAvatar) {
    return 'https://ui-avatars.com/api/?name=User&background=2563eb&color=fff&bold=true'
  }
  const avatar = typeof userOrAvatar === 'string'
    ? userOrAvatar
    : (userOrAvatar.avatar_url || userOrAvatar.avatar)

  if (!avatar) {
    const name = typeof userOrAvatar === 'object' && userOrAvatar.name ? userOrAvatar.name : 'User'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2563eb&color=fff&bold=true`
  }

  if (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('blob:') || avatar.startsWith('data:')) {
    return avatar
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
  const hostBase = apiBase.replace(/\/api\/?$/, '')
  const cleanPath = avatar.replace(/^\/+/, '')
  const finalPath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`
  return `${hostBase}/${finalPath}`
}

/**
 * Format currency to IDR
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format date to Indonesian locale
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format time HH:MM
 */
export const formatTime = (time) => {
  if (!time) return ''
  return time.substring(0, 5)
}

/**
 * Get badge class based on booking status
 */
export const getStatusBadge = (status) => {
  const map = {
    confirmed: 'badge-confirmed',
    pending:   'badge-pending',
    cancelled: 'badge-cancelled',
    completed: 'badge-completed',
  }
  return map[status] || 'badge-pending'
}

export const getStatusLabel = (status) => {
  const map = {
    confirmed: 'Dikonfirmasi',
    pending:   'Menunggu',
    cancelled: 'Dibatalkan',
    completed: 'Selesai',
  }
  return map[status] || status
}

/**
 * Generate ICS calendar file content
 */
export const generateICS = (booking) => {
  const dateStr = booking.booking_date.replace(/-/g, '')
  const startStr = dateStr + 'T' + booking.start_time.replace(':', '') + '00'
  const endStr   = dateStr + 'T' + booking.end_time.replace(':', '') + '00'

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MeetMe//ID',
    'BEGIN:VEVENT',
    `UID:booking-${booking.id}@meetme.internal`,
    `DTSTART;TZID=Asia/Jakarta:${startStr}`,
    `DTEND;TZID=Asia/Jakarta:${endStr}`,
    `SUMMARY:Rapat di ${booking.room?.name || 'Ruang Rapat'} (MeetMe)`,
    `DESCRIPTION:${booking.notes || 'Booking ruangan'}`,
    `LOCATION:${booking.room?.location || ''}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

/**
 * Download ICS file
 */
export const downloadICS = (booking) => {
  const ics = generateICS(booking)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `booking-${booking.id}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Build Google Calendar URL from booking
 */
export const buildGoogleCalendarUrl = (booking) => {
  const start = booking.booking_date.replace(/-/g, '') + 'T' + booking.start_time.replace(':', '') + '00'
  const end   = booking.booking_date.replace(/-/g, '') + 'T' + booking.end_time.replace(':', '') + '00'

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Rapat ${booking.room?.name || 'Ruangan'} (MeetMe)`,
    dates: `${start}/${end}`,
    details: booking.notes || 'Reservasi Ruang Rapat Kantor via MeetMe',
    location: booking.room?.location || '',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Build WhatsApp notification share URL with rich meeting details
 */
export const buildWhatsAppNotificationUrl = (booking, targetPhone = '') => {
  const roomName = booking.room?.name || 'Ruang Rapat'
  const location = booking.room?.location || 'Kantor'
  const date = formatDate(booking.booking_date)
  const time = `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)} WIB`
  const pemesan = booking.user?.name || 'Karyawan'
  const position = booking.user?.position ? ` (${booking.user.position})` : ''
  const agenda = booking.notes || 'Rapat Koordinasi Tim'
  const pin = booking.check_in_code || '-'
  const gcalUrl = buildGoogleCalendarUrl(booking)

  let servicesText = ''
  if (booking.services) {
    const eq = booking.services.equipment?.length ? `Peralatan: ${booking.services.equipment.join(', ')}` : ''
    const cat = booking.services.catering?.length ? `Konsumsi: ${booking.services.catering.join(', ')} (${booking.services.catering_pax || 0} Pax)` : ''
    if (eq || cat) {
      servicesText = `\n📦 *Layanan Tambahan:*\n${eq ? '• ' + eq + '\n' : ''}${cat ? '• ' + cat + '\n' : ''}`
    }
  }

  const message = `🔔 *PENGINGAT JADWAL RAPAT - MEETME*
━━━━━━━━━━━━━━━━━━
🏢 *Ruangan:* ${roomName} (${location})
📅 *Tanggal:* ${date}
⏰ *Waktu:* ${time}
👤 *Pemesan:* ${pemesan}${position}
📝 *Agenda:* ${agenda}
🔑 *PIN Check-In:* ${pin}${servicesText}
━━━━━━━━━━━━━━━━━━
📅 Tambah ke Kalender HP:
${gcalUrl}

_Pesan otomatis dari MeetMe Room Reservation System_`

  const cleanPhone = (targetPhone || booking.user?.phone || '').replace(/\D/g, '')
  const phoneParam = cleanPhone ? (cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone) : ''

  return `https://wa.me/${phoneParam}?text=${encodeURIComponent(message)}`
}
