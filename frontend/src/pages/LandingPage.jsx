import { Link } from 'react-router-dom'
import { ArrowRight, Building2, Calendar, CheckCircle, Clock, MapPin, Shield, Star, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../lib/axios'
import { formatCurrency } from '../lib/utils'

const features = [
  { icon: Building2,    title: 'Berbagai Ruangan',    desc: 'Pilih dari berbagai jenis ruangan sesuai kebutuhan Anda.' },
  { icon: Calendar,     title: 'Booking Mudah',       desc: 'Pesan ruangan kapan saja dan di mana saja dengan cepat.' },
  { icon: Clock,        title: 'Jadwal Fleksibel',    desc: 'Tentukan jadwal booking sesuai kebutuhan Anda.' },
  { icon: CheckCircle,  title: 'Konfirmasi Instan',   desc: 'Dapatkan konfirmasi booking langsung setelah pemesanan.' },
  { icon: Users,        title: 'Kapasitas Beragam',   desc: 'Dari ruang meeting kecil hingga aula besar tersedia.' },
  { icon: Shield,       title: 'Aman & Terpercaya',   desc: 'Sistem booking yang aman dengan data terenkripsi.' },
]

function RoomCard({ room }) {
  return (
    <div className="card overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-48 bg-gradient-to-br from-primary-100 to-primary-200 relative overflow-hidden">
        {room.image_url ? (
          <img
            src={room.image_url}
            alt={room.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80'
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-16 h-16 text-primary-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            room.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {room.is_available ? 'Tersedia' : 'Tidak Tersedia'}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-primary-600 transition-colors">
          {room.name}
        </h3>
        <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
          <MapPin className="w-4 h-4" />
          <span>{room.location}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-500 text-sm mb-3">
          <Users className="w-4 h-4" />
          <span>Kapasitas: {room.capacity} orang</span>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{room.description}</p>
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-1 rounded-full">
            Fasilitas Kantor
          </span>
          <Link to={`/rooms/${room.id}`} className="btn-primary text-sm py-2 px-4">
            Pilih Jadwal
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [rooms, setRooms]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/rooms?per_page=3')
      .then(({ data }) => setRooms(data.data?.slice(0, 3) || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-5">
              <img
                src="/logo-white.png"
                alt="MeetMe - Badan Pusat Statistik"
                className="h-12 sm:h-16 w-auto object-contain drop-shadow-md"
              />
            </div>
            <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs sm:text-sm px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full mb-4 sm:mb-6 font-medium backdrop-blur-xs">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-300" />
              Sistem Reservasi Ruang Rapat Kantor BPS
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 sm:mb-6">
              Reservasi Ruangan Rapat
              <br />
              <span className="text-yellow-300">Cepat, Praktis</span> & Teratur
            </h1>
            <p className="text-base sm:text-xl text-primary-100 mb-6 sm:mb-8 max-w-xl">
              Atur jadwal rapat tim dan departemen dengan mudah tanpa bentrok. Cek ketersediaan ruangan, tentukan waktu, dan sinkronkan ke kalender kerja Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link to="/rooms" className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl hover:bg-gray-50 transition-colors text-center text-sm sm:text-base shadow-sm">
                Lihat Ruangan <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link to="/register" className="inline-flex items-center justify-center gap-2 border-2 border-white/60 text-white font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl hover:bg-white/10 transition-colors text-center text-sm sm:text-base">
                Daftar Akun Karyawan
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative shapes */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute right-20 bottom-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2" />
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-8 text-center divide-x sm:divide-x-0 divide-gray-100">
            {[
              { value: '50+', label: 'Ruangan Tersedia' },
              { value: '1000+', label: 'Booking Selesai' },
              { value: '200+', label: 'Karyawan Aktif' },
            ].map((s) => (
              <div key={s.label} className="px-2">
                <div className="text-xl sm:text-3xl font-extrabold text-primary-600">{s.value}</div>
                <div className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Mengapa Pilih MeetMe?</h2>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              Platform reservasi ruang rapat kantor yang modern, praktis, dan terintegrasi langsung dengan agenda tim kerja.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Ruangan Populer</h2>
              <p className="text-gray-500">Pilihan ruangan terbaik untuk berbagai kebutuhan Anda.</p>
            </div>
            <Link to="/rooms" className="btn-secondary hidden sm:flex items-center gap-2">
              Semua Ruangan <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-xl" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
            </div>
          )}
          <div className="text-center mt-8 sm:hidden">
            <Link to="/rooms" className="btn-primary">Lihat Semua Ruangan</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 text-white py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Siap Mulai Reservasi Rapat?</h2>
          <p className="text-sm sm:text-base text-primary-100 mb-6 sm:mb-8">
            Pesan ruangan rapat kantor dengan cepat, undang rekan kerja, dan lampirkan hasil notulensi tanpa ribet.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link to="/register" className="bg-white text-primary-700 font-bold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base shadow-sm">
              Daftar Akun Baru
            </Link>
            <Link to="/rooms" className="border-2 border-white/60 text-white font-semibold px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl hover:bg-white/10 transition-colors text-sm sm:text-base">
              Jelajahi Ruangan
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
