import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import useAuthStore from '../store/authStore'
import GoogleLoginButton from '../components/auth/GoogleLoginButton'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, googleLogin, loading } = useAuthStore()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [errors, setErrors] = useState({})

  // Tangani callback respons resmi dari Google setelah redirect
  useEffect(() => {
    const hash = window.location.hash
    if (hash && (hash.includes('id_token') || hash.includes('access_token'))) {
      const params = new URLSearchParams(hash.replace(/^#/, ''))
      const idToken = params.get('id_token')
      const accessToken = params.get('access_token')

      const handleGoogleCallback = async () => {
        try {
          toast.loading('Menghubungkan akun Google...', { id: 'google-oauth' })
          let data
          if (idToken) {
            data = await googleLogin(idToken)
          } else if (accessToken) {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
            const profile = await res.json()
            data = await googleLogin({
              email: profile.email,
              name: profile.name,
              avatar: profile.picture,
              google_id: profile.sub,
            })
          }
          toast.success(`Selamat datang, ${data.user.name}! (Akun Google Terhubung)`, { id: 'google-oauth' })
          window.history.replaceState(null, '', window.location.pathname)
          navigate(data.user.role === 'admin' ? '/admin' : '/dashboard')
        } catch (err) {
          toast.error(err.response?.data?.message || 'Login dengan Google gagal', { id: 'google-oauth' })
        }
      }

      handleGoogleCallback()
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    try {
      const data = await login(form.email, form.password)
      toast.success(`Selamat datang, ${data.user.name}!`)
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      const errs = err.response?.data?.errors || {}
      setErrors(errs)
      if (!Object.keys(errs).length) {
        toast.error(err.response?.data?.message || 'Login gagal')
      }
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-8 sm:py-12 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <img
            src="/logo.png"
            alt="MeetMe - Badan Pusat Statistik"
            className="h-14 sm:h-16 w-auto mx-auto mb-3 object-contain"
          />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Masuk ke MeetMe</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Belum punya akun? <Link to="/register" className="text-primary-600 font-medium hover:underline">Daftar akun karyawan</Link></p>
        </div>

        <div className="card p-5 sm:p-8">
          {/* Tombol Login Akun Google */}
          <div className="mb-5">
            <GoogleLoginButton label="Masuk dengan Akun Google" />

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400">
                <span className="bg-white px-3 font-medium">atau masuk dengan email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  className={`input-field pl-10 ${errors.email ? 'border-red-400' : ''}`}
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email[0]}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-medium mb-1">Akun Demo:</p>
            <p>Admin: <code className="font-mono">admin@roombooking.com</code> / <code className="font-mono">password</code></p>
            <p>User: <code className="font-mono">budi@example.com</code> / <code className="font-mono">password</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
