import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin, Search, SlidersHorizontal, Users } from 'lucide-react'
import api from '../lib/axios'
import { formatCurrency } from '../lib/utils'

function RoomCard({ room }) {
  return (
    <div className="card overflow-hidden hover:shadow-md transition-all group">
      <div className="h-48 bg-gradient-to-br from-primary-100 to-blue-200 relative overflow-hidden">
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
            <Building2 className="w-14 h-14 text-primary-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            room.is_available ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {room.is_available ? 'Tersedia' : 'Tidak Tersedia'}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-primary-600 transition-colors leading-tight">
          {room.name}
        </h3>
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">{room.location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <Users className="w-4 h-4 shrink-0" />
            <span>Kapasitas {room.capacity} orang</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{room.description}</p>
        {room.facilities?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {room.facilities.slice(0, 3).map((f) => (
              <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f}</span>
            ))}
            {room.facilities.length > 3 && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{room.facilities.length - 3}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs bg-blue-50 text-blue-700 font-medium px-2.5 py-1 rounded-md">
            Ruangan Kantor
          </span>
          <Link to={`/rooms/${room.id}`} className="btn-primary text-sm py-2 px-4">
            Pilih Jadwal
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RoomsPage() {
  const [rooms, setRooms]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [meta, setMeta]         = useState({})
  const [page, setPage]         = useState(1)
  const [filters, setFilters]   = useState({ search: '', capacity: '', is_available: '' })
  const [showFilter, setShowFilter] = useState(false)

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const params = { page, ...filters }
      Object.keys(params).forEach((k) => !params[k] && delete params[k])
      const { data } = await api.get('/rooms', { params })
      setRooms(data.data || [])
      setMeta({ total: data.total, lastPage: data.last_page, currentPage: data.current_page })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRooms() }, [page, filters])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchRooms()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Ruangan</h1>
        <p className="text-gray-500">Temukan ruangan yang sesuai dengan kebutuhan Anda.</p>
      </div>

      {/* Search & Filter */}
      <div className="card p-3.5 sm:p-5 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau lokasi ruangan rapat..."
              className="input-field pl-10 text-sm py-2.5"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowFilter(!showFilter)}
              className="btn-secondary flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm py-2.5 px-4">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <button type="submit" className="btn-primary flex-1 sm:flex-none py-2.5 px-6 text-sm">
              Cari
            </button>
          </div>
        </form>

        {showFilter && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Kapasitas Minimal</label>
              <input type="number" min="1" placeholder="Contoh: 10 orang"
                className="input-field w-full sm:w-44 text-sm"
                value={filters.capacity}
                onChange={(e) => setFilters({ ...filters, capacity: e.target.value })} />
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-xs font-semibold text-gray-700 mb-1 block">Status Ketersediaan</label>
              <select className="input-field w-full sm:w-48 text-sm" value={filters.is_available}
                onChange={(e) => setFilters({ ...filters, is_available: e.target.value })}>
                <option value="">Semua Ruangan</option>
                <option value="true">Tersedia</option>
                <option value="false">Tidak Tersedia</option>
              </select>
            </div>
            <div className="sm:self-end pt-1">
              <button onClick={() => { setFilters({ search: '', capacity: '', is_available: '' }); setPage(1) }}
                className="btn-secondary w-full sm:w-auto text-xs py-2 px-3">Reset Filter</button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-xl" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-20">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Tidak ada ruangan ditemukan.</p>
        </div>
      ) : (
        <>
          <p className="text-gray-500 text-sm mb-4">{meta.total} ruangan ditemukan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
          </div>

          {/* Pagination */}
          {meta.lastPage > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: meta.lastPage }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    p === meta.currentPage ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
