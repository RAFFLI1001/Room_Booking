import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, ChevronLeft, ChevronRight, Edit, LayoutGrid, MapPin, Plus, Table, Trash2, Users } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function AdminRoomsPage() {
  const [rooms, setRooms]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [viewMode, setViewMode]           = useState('card') // 'card' | 'table'
  const [scrollPercent, setScrollPercent] = useState(0)
  const [thumbWidth, setThumbWidth]       = useState(35)
  const [isDraggingTable, setIsDraggingTable] = useState(false)
  const tableContainerRef                 = useRef(null)
  const trackRef                          = useRef(null)
  const isMouseDownRef                    = useRef(false)
  const startXRef                         = useRef(0)
  const scrollLeftStartRef                = useRef(0)
  const isDraggingTrackRef                = useRef(false)

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/rooms?per_page=100')
      setRooms(data.data || [])
    } catch (err) {
      toast.error('Gagal memuat data ruangan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus ruangan "${name}"?`)) return

    try {
      await api.delete(`/admin/rooms/${id}`)
      toast.success('Ruangan berhasil dihapus')
      setRooms(rooms.filter((r) => r.id !== id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus ruangan')
    }
  }

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

  // Handle pointer drag on bottom track with pointer capture
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
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Kelola Ruangan Rapat</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">Tambah, perbarui fasilitas, atau nonaktifkan ruangan rapat kantor.</p>
          </div>

          <Link to="/admin/rooms/create" className="btn-primary inline-flex items-center justify-center gap-2 text-xs sm:text-sm py-2 px-3.5 sm:py-2.5 sm:px-4 shadow-xs shrink-0 self-start sm:self-auto">
            <Plus className="w-4 h-4" /> Tambah Ruangan
          </Link>
        </div>

        {/* View toggle on mobile */}
        <div className="flex md:hidden items-center bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'card' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> 📱 Mode Kartu (Mudah di HP)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'table' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
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
      ) : rooms.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">
          Belum ada data ruangan. Silakan tambah ruangan baru.
        </div>
      ) : (
        <>
          {/* TAMPILAN MOBILE: KARTU (Sangat nyaman di HP, tanpa geser) */}
          <div className={`${viewMode === 'table' ? 'hidden' : 'block md:hidden'} space-y-3`}>
            {rooms.map((room) => (
              <div key={room.id} className="card p-4 space-y-3 border border-gray-200 shadow-xs">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200">
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
                      <Building2 className="w-7 h-7 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-bold text-gray-900 text-sm truncate">{room.name}</h3>
                      <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        room.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {room.is_available ? 'Tersedia' : 'Nonaktif'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{room.location}</span>
                    </div>

                    <div className="flex items-center gap-1 text-gray-500 text-xs mt-0.5">
                      <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>Kapasitas {room.capacity} orang</span>
                    </div>
                  </div>
                </div>

                {room.description && (
                  <p className="text-gray-500 text-xs line-clamp-2 bg-gray-50 p-2 rounded-lg">{room.description}</p>
                )}

                <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                  <Link
                    to={`/admin/rooms/${room.id}/edit`}
                    className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1 text-blue-600"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(room.id, room.name)}
                    className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1 text-red-600 hover:bg-red-50 hover:border-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* TAMPILAN TABEL: DENGAN SCROLLBAR DI BAWAH SEPERTI DI HANDPHONE */}
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
              <table
                className="w-full text-left text-xs sm:text-sm text-gray-600 border-collapse table-auto"
                style={{ minWidth: '780px' }}
              >
                <thead className="bg-gray-50 text-[11px] sm:text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '260px' }}>Ruangan</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '180px' }}>Lokasi</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '140px' }}>Kapasitas</th>
                    <th className="px-5 py-3.5 font-semibold whitespace-nowrap" style={{ width: '120px' }}>Status</th>
                    <th className="px-5 py-3.5 font-semibold text-right whitespace-nowrap" style={{ width: '130px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 border border-gray-200">
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
                              <Building2 className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{room.name}</p>
                            <p className="text-xs text-gray-400 line-clamp-1 max-w-xs">{room.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-700 font-medium">
                        {room.location}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-gray-700">
                          <Users className="w-3.5 h-3.5 text-gray-400" /> {room.capacity} orang
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          room.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {room.is_available ? 'Tersedia' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/rooms/${room.id}/edit`}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Ruangan"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(room.id, room.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Ruangan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* SCROLLBAR & KONTROL GESER TABEL DI BAGIAN BAWAH (HANYA MUNCUL DI MOBILE / LAYAR KECIL) */}
            <div className="md:hidden bg-gray-50/95 px-4 py-3.5 border-t border-gray-200 flex flex-col items-center justify-center gap-2 select-none">
              <div className="w-full max-w-sm flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollTable(-200)}
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
                  onClick={() => scrollTable(200)}
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
    </div>
  )
}
