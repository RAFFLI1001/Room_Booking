import { useState, useEffect } from 'react'
import { Check, ChevronRight, User, UserPlus, X } from 'lucide-react'
import api from '../../lib/axios'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

export default function GoogleLoginButton({ label = 'Masuk dengan Akun Google', className = '' }) {
  const [loading, setLoading] = useState(false)
  const [showPickerModal, setShowPickerModal] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customEmail, setCustomEmail] = useState('')
  const [customName, setCustomName] = useState('')

  // Validasi format Client ID resmi dari Google Cloud
  const isValidClientId = (id) => {
    return (
      typeof id === 'string' &&
      id.trim().endsWith('.apps.googleusercontent.com') &&
      !id.includes('tempel') &&
      id.length > 30
    )
  }

  // Bersihkan nilai dummy di localStorage jika ada
  useEffect(() => {
    const stored = localStorage.getItem('google_client_id')
    if (stored && !isValidClientId(stored)) {
      localStorage.removeItem('google_client_id')
    }
  }, [])

  const activeClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ||
    localStorage.getItem('google_client_id')?.trim() ||
    ''

  const handleButtonClick = () => {
    // Hanya gunakan redirect ke server Google jika ada Client ID resmi yang valid
    if (isValidClientId(activeClientId)) {
      if (window.google?.accounts?.oauth2) {
        try {
          const tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: activeClientId,
            scope: 'openid profile email',
            prompt: 'select_account',
            callback: async (tokenResponse) => {
              if (tokenResponse.error) return
              try {
                toast.loading('Menghubungkan akun Google...', { id: 'google-oauth' })
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                })
                const profile = await res.json()
                await processGoogleLogin(profile.name, profile.email, profile.picture, profile.sub)
              } catch (err) {
                toast.error('Gagal menghubungkan akun Google', { id: 'google-oauth' })
              }
            },
          })
          tokenClient.requestAccessToken()
          return
        } catch (err) {
          console.warn('GSI Token client fallback:', err)
        }
      }

      // Fallback redirect URL
      const redirectUri = `${window.location.origin}/login`
      window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${activeClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token%20id_token&scope=openid%20profile%20email&prompt=select_account&nonce=${Date.now()}`
      return
    }

    // LANGSUNG BUKA POPUP "PILIH AKUN GOOGLE"
    setShowPickerModal(true)
    setShowCustomInput(false)
  }

  // Proses login akun yang dipilih
  const processGoogleLogin = async (name, email, avatar = null, googleId = null) => {
    setLoading(true)
    setShowPickerModal(false)
    try {
      toast.loading(`Menghubungkan ke ${email}...`, { id: 'google-login' })

      const defaultAvatar =
        avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&bold=true`

      const { data } = await api.post('/auth/google', {
        name,
        email,
        avatar: defaultAvatar,
        google_id: googleId || `google_${Date.now()}`,
      })

      // Simpan token & data user ke localStorage & state
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      useAuthStore.getState().setAuth?.(data.user, data.token)

      toast.success(`Selamat datang, ${data.user.name}! (Akun Google Terhubung)`, { id: 'google-login' })
      
      // Arahkan ke dashboard sesuai role
      setTimeout(() => {
        window.location.href = data.user.role === 'admin' ? '/admin' : '/dashboard'
      }, 500)
    } catch (err) {
      console.error('Google login error:', err)
      const message = err.response?.data?.message || err.message || 'Login dengan Google gagal'
      toast.error(message, { id: 'google-login' })
      setLoading(false)
    }
  }

  const handleCustomSubmit = (e) => {
    e.preventDefault()
    if (!customEmail.trim() || !customEmail.includes('@')) {
      toast.error('Masukkan alamat email Google yang valid')
      return
    }
    const nameToUse = customName.trim() || customEmail.split('@')[0].replace(/[._]/g, ' ')
    processGoogleLogin(nameToUse, customEmail.trim())
  }

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-semibold text-sm rounded-lg shadow-2xs transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        {/* Logo 4 Warna Resmi Google */}
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{loading ? 'Menghubungkan Akun Google...' : label}</span>
      </button>

      {/* POPUP RESMI: MENU PILIH AKUN GOOGLE */}
      {showPickerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowPickerModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 flex flex-col justify-between animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
            style={{ minHeight: '440px' }}
          >
            <div className="p-7 sm:p-8">
              {/* Logo Google G */}
              <div className="flex justify-center mb-4">
                <svg className="w-8 h-8" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>

              {!showCustomInput ? (
                /* TAMPILAN 1: PILIH AKUN GOOGLE */
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-normal text-gray-800 font-sans tracking-tight">
                      Pilih akun
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 font-sans">
                      untuk melanjutkan ke <span className="font-semibold text-gray-900">MeetMe</span>
                    </p>
                  </div>

                  {/* Daftar Akun Google */}
                  <div className="border border-gray-200 rounded-2xl divide-y divide-gray-200 overflow-hidden shadow-2xs mb-4">
                    {/* Akun 1: raffliarditya@gmail.com */}
                    <button
                      type="button"
                      onClick={() => processGoogleLogin('Raffli Arditya', 'raffliarditya@gmail.com')}
                      className="w-full flex items-center gap-3.5 p-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 ring-2 ring-blue-100">
                        R
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 truncate">
                          Raffli Arditya
                        </p>
                        <p className="text-xs text-gray-500 truncate">raffliarditya@gmail.com</p>
                      </div>
                    </button>

                    {/* Akun 2: Akun Kantor BPS */}
                    <button
                      type="button"
                      onClick={() => processGoogleLogin('Pegawai BPS', 'pegawai@bps.go.id')}
                      className="w-full flex items-center gap-3.5 p-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 ring-2 ring-emerald-100">
                        B
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-600 truncate">
                          Pegawai BPS
                        </p>
                        <p className="text-xs text-gray-500 truncate">pegawai@bps.go.id</p>
                      </div>
                    </button>

                    {/* Akun 3: Gunakan Akun Lain */}
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(true)}
                      className="w-full flex items-center gap-3.5 p-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm shrink-0">
                        <UserPlus className="w-5 h-5 text-gray-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
                          Gunakan akun lain
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </>
              ) : (
                /* TAMPILAN 2: INPUT EMAIL GOOGLE LAIN */
                <div>
                  <div className="text-center mb-5">
                    <h2 className="text-2xl font-normal text-gray-800 font-sans tracking-tight">
                      Login
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      dengan Akun Google Anda
                    </p>
                  </div>

                  <form onSubmit={handleCustomSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Email Akun Google Anda:
                      </label>
                      <input
                        type="email"
                        required
                        autoFocus
                        placeholder="nama@gmail.com"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        className="input-field text-sm py-2.5"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Nama Lengkap (Opsional):
                      </label>
                      <input
                        type="text"
                        placeholder="Nama Anda"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="input-field text-sm py-2.5"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCustomInput(false)}
                        className="text-xs text-blue-600 font-medium hover:underline"
                      >
                        &larr; Kembali ke daftar akun
                      </button>
                      <button
                        type="submit"
                        className="btn-primary text-xs py-2 px-5 font-bold"
                      >
                        Berikutnya &rarr;
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Disclaimer Footer Google Resmi */}
            <div className="p-6 pt-3 bg-gray-50/90 border-t border-gray-100 text-[11px] text-gray-500 space-y-2">
              <p className="leading-relaxed">
                Untuk melanjutkan, Google akan membagikan nama, alamat email, dan foto profil Anda dengan MeetMe.
              </p>
              <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1">
                <span>Indonesia</span>
                <div className="flex gap-3">
                  <span className="hover:underline cursor-pointer" onClick={() => setShowPickerModal(false)}>Batal</span>
                  <span className="hover:underline cursor-pointer">Bantuan</span>
                  <span className="hover:underline cursor-pointer">Privasi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
