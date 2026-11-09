import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { Toaster } from 'react-hot-toast'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-gray-900 text-gray-400 py-6 sm:py-8 mt-auto border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-3 text-center">
          <img src="/logo-white.png" alt="MeetMe - Badan Pusat Statistik" className="h-8 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity" />
          <p className="text-xs text-gray-400 font-medium">© 2024 MeetMe — Sistem Reservasi Ruangan Rapat Badan Pusat Statistik. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'Inter, sans-serif', fontSize: '14px' },
        }}
      />
    </div>
  )
}
