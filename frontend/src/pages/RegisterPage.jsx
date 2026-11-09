import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, Building2, Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react'
import useAuthStore from '../store/authStore'
import GoogleLoginButton from '../components/auth/GoogleLoginButton'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, loading } = useAuthStore()
  const [form, setForm] = useState({
    name: '', email: '', phone: '', position: '', password: '', password_confirmation: '',
  })
  const [showPwd, setShowPwd]   = useState(false)
  const [errors, setErrors]     = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: ['Password tidak cocok'] })
      return
    }
    try {
      const data = await register(form)
      toast.success('Registrasi berhasil! Selamat datang.')
      navigate('/dashboard')
    } catch (err) {
      const errs = err.response?.data?.errors || {}
      setErrors(errs)
      if (!Object.keys(errs).length) {
        toast.error(err.response?.data?.message || 'Registrasi gagal')
      }
    }
  }

  const Field = ({ id, label, icon: Icon, type = 'text', placeholder, value, onChange, error, ...rest }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id={id}
          type={type}
          className={`input-field pl-10 ${error ? 'border-red-400' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...rest}
        />
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error[0]}</p>}
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <img
            src="/logo.png"
            alt="MeetMe - Badan Pusat Statistik"
            className="h-14 sm:h-16 w-auto mx-auto mb-3 object-contain"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Buat Akun MeetMe</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Sudah punya akun? <Link to="/login" className="text-primary-600 font-medium hover:underline">Masuk di sini</Link></p>
        </div>

        <div className="card p-5 sm:p-8">
          {/* Tombol Daftar dengan Akun Google */}
          <div className="mb-5">
            <GoogleLoginButton label="Daftar Cepat dengan Akun Google" />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="bg-white px-3 font-medium">atau daftar dengan email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field id="name" label="Nama Lengkap" icon={User} placeholder="Nama Anda"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name} required />

            <Field id="email" label="Email" icon={Mail} type="email" placeholder="email@example.com"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email} required />

            <Field id="phone" label="Nomor HP (opsional)" icon={Phone} type="tel" placeholder="08xxxxxxxxxx"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              error={errors.phone} />

            <Field id="position" label="Jabatan / Posisi Kantor" icon={Briefcase} placeholder="Contoh: Staff IT, Marketing Manager, HR Specialist"
              value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}
              error={errors.position} />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type={showPwd ? 'text' : 'password'} className={`input-field pl-10 pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  placeholder="Min. 8 karakter" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" className={`input-field pl-10 ${errors.password_confirmation ? 'border-red-400' : ''}`}
                  placeholder="Ulangi password" value={form.password_confirmation}
                  onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required />
              </div>
              {errors.password_confirmation && <p className="text-red-500 text-xs mt-1">{errors.password_confirmation[0]}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
