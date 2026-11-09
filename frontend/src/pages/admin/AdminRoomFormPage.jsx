import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Building2, Plus, Trash2, Upload } from 'lucide-react'
import api from '../../lib/axios'
import toast from 'react-hot-toast'

export default function AdminRoomFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    name: '',
    location: '',
    capacity: '',
    price_per_hour: '',
    description: '',
    is_available: true,
    facilities: ['WiFi', 'AC', 'Proyektor'],
  })
  const [newFacility, setNewFacility] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  useEffect(() => {
    if (isEdit) {
      api.get(`/rooms/${id}`)
        .then(({ data }) => {
          setForm({
            name: data.name || '',
            location: data.location || '',
            capacity: data.capacity || '',
            price_per_hour: data.price_per_hour || '',
            description: data.description || '',
            is_available: Boolean(data.is_available),
            facilities: data.facilities || [],
          })
          if (data.image_url) {
            setImagePreview(data.image_url)
          }
        })
        .catch(() => {
          toast.error('Gagal mengambil data ruangan')
          navigate('/admin/rooms')
        })
        .finally(() => setFetching(false))
    }
  }, [id, isEdit])

  const handleAddFacility = (e) => {
    e.preventDefault()
    if (!newFacility.trim()) return
    if (!form.facilities.includes(newFacility.trim())) {
      setForm({ ...form, facilities: [...form.facilities, newFacility.trim()] })
    }
    setNewFacility('')
  }

  const handleRemoveFacility = (item) => {
    setForm({ ...form, facilities: form.facilities.filter((f) => f !== item) })
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('location', form.location)
    formData.append('capacity', form.capacity)
    formData.append('price_per_hour', form.price_per_hour)
    formData.append('description', form.description)
    formData.append('is_available', form.is_available ? '1' : '0')

    form.facilities.forEach((f, idx) => {
      formData.append(`facilities[${idx}]`, f)
    })

    if (imageFile) {
      formData.append('image', imageFile)
    }

    try {
      if (isEdit) {
        formData.append('_method', 'PUT')
        await api.post(`/admin/rooms/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Ruangan berhasil diperbarui')
      } else {
        await api.post('/admin/rooms', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        toast.success('Ruangan baru berhasil dibuat')
      }
      navigate('/admin/rooms')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data ruangan')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 text-center text-gray-500">
        Memuat data ruangan...
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link to="/admin/rooms" className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-800 mb-6">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Ruangan
      </Link>

      <div className="card p-5 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit Ruangan Rapat' : 'Tambah Ruangan Rapat Baru'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gambar Ruangan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Foto Ruangan</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
              <div className="w-full sm:w-36 h-28 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200 shrink-0">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <label className="btn-secondary cursor-pointer text-xs sm:text-sm flex items-center gap-2 py-2 px-3.5">
                <Upload className="w-4 h-4" /> Pilih Foto Ruangan
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Nama & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Ruangan</label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Ruang Rapat Eksekutif"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lokasi / Lantai</label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Lantai 2, Gedung Utama"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Kapasitas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kapasitas Maksimal (Orang)</label>
            <input
              type="number"
              min="1"
              className="input-field"
              placeholder="Contoh: 15"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi Ruangan</label>
            <textarea
              rows={4}
              className="input-field"
              placeholder="Jelaskan spesifikasi, kegunaan, dan keunggulan ruangan ini..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Fasilitas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fasilitas Ruangan</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="input-field"
                placeholder="Tambah fasilitas (e.g. Smart TV, Mic, Sound System)"
                value={newFacility}
                onChange={(e) => setNewFacility(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddFacility(e)
                  }
                }}
              />
              <button type="button" onClick={handleAddFacility} className="btn-secondary flex items-center gap-1.5">
                <Plus className="w-4 h-4" /> Tambah
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {form.facilities.map((fac) => (
                <span
                  key={fac}
                  className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium"
                >
                  {fac}
                  <button
                    type="button"
                    onClick={() => handleRemoveFacility(fac)}
                    className="hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Status Ketersediaan */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="is_available"
              checked={form.is_available}
              onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
              className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
            <label htmlFor="is_available" className="text-sm font-medium text-gray-700">
              Ruangan siap digunakan (Tersedia untuk dibooking)
            </label>
          </div>

          {/* Tombol Aksi */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Link to="/admin/rooms" className="btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Ruangan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
