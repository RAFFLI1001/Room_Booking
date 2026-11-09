import { useEffect, useRef, useState } from 'react'
import { Briefcase, Camera, Lock, Phone, Save, User } from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import { getAvatarUrl } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateUser }  = useAuthStore()
  const fileRef               = useRef()
  const [form, setForm]       = useState({ name: '', phone: '', position: '', password: '', password_confirmation: '' })
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors]   = useState({})

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', position: user.position || '', password: '', password_confirmation: '' })
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      const payload = { name: form.name, phone: form.phone, position: form.position }
      if (form.password) {
        payload.password = form.password
        payload.password_confirmation = form.password_confirmation
      }
      const { data } = await api.put('/profile', payload)
      updateUser(data.user)
      toast.success('Profil berhasil diperbarui')
      setForm((f) => ({ ...f, password: '', password_confirmation: '' }))
    } catch (err) {
      const errs = err.response?.data?.errors || {}
      setErrors(errs)
      if (!Object.keys(errs).length) toast.error(err.response?.data?.message || 'Gagal memperbarui profil')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setUploading(true)
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const { data } = await api.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateUser(data.user)
      toast.success('Avatar berhasil diperbarui')
    } catch {
      toast.error('Gagal mengunggah avatar')
    } finally {
      setUploading(false)
    }
  }

  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Profil Saya</h1>

      {/* Avatar */}
      <div className="card p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <img
              src={avatarPreview || getAvatarUrl(user)}
              alt={user?.name || 'Avatar'}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md bg-gray-100"
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=2563eb&color=fff&bold=true`
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg sm:text-xl">{user?.name}</h2>
            <p className="text-gray-500 text-xs sm:text-sm">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                user?.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {user?.role === 'admin' ? 'Administrator' : 'Karyawan'}
              </span>
              {user?.position && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> {user.position}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="card p-4 sm:p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <h3 className="font-semibold text-gray-900 text-lg">Informasi Akun</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" className={`input-field pl-10 ${errors.name ? 'border-red-400' : ''}`}
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" className="input-field bg-gray-50 cursor-not-allowed" value={user?.email} disabled />
            <p className="text-gray-400 text-xs mt-1">Email tidak dapat diubah</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Jabatan / Posisi Kantor</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Contoh: Staff IT, Marketing Manager, HR Specialist"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
              />
            </div>
            {errors.position && <p className="text-red-500 text-xs mt-1">{errors.position[0]}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor HP</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="tel" className="input-field pl-10" placeholder="08xxxxxxxxxx"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="font-semibold text-gray-900 mb-4">Ganti Password</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="password" className={`input-field pl-10 ${errors.password ? 'border-red-400' : ''}`}
                    placeholder="Kosongkan jika tidak ingin mengubah"
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} />
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="password" className="input-field pl-10"
                    placeholder="Ulangi password baru"
                    value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </form>
      </div>
    </div>
  )
}
