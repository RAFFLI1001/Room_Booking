import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ui/ProtectedRoute'

// Public Pages
import LandingPage from './pages/LandingPage'
import RoomsPage from './pages/RoomsPage'
import RoomDetailPage from './pages/RoomDetailPage'
import RoomKioskPage from './pages/RoomKioskPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// User Pages
import UserDashboard from './pages/user/DashboardPage'
import BookingsPage from './pages/user/BookingsPage'
import BookingDetailPage from './pages/user/BookingDetailPage'
import ProfilePage from './pages/user/ProfilePage'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRoomsPage from './pages/admin/AdminRoomsPage'
import AdminRoomFormPage from './pages/admin/AdminRoomFormPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Standalone Kiosk Door Display Route (No Navbar / No Footer for full tablet immersion) */}
        <Route path="/rooms/:id/display" element={<RoomKioskPage />} />

        {/* Standard App with Layout */}
        <Route element={<Layout />}>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* User Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<UserDashboard />} />
            <Route path="/bookings" element={<BookingsPage />} />
            <Route path="/bookings/:id" element={<BookingDetailPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/rooms" element={<AdminRoomsPage />} />
            <Route path="/admin/rooms/create" element={<AdminRoomFormPage />} />
            <Route path="/admin/rooms/:id/edit" element={<AdminRoomFormPage />} />
            <Route path="/admin/bookings" element={<AdminBookingsPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}
