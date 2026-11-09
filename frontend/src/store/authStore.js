import { create } from 'zustand'
import api from '../lib/axios'

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return data
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal'
      set({ error: msg, loading: false })
      throw err
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null })
    try {
      const { data } = await api.post('/auth/register', payload)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return data
    } catch (err) {
      const msg = err.response?.data?.message || 'Registrasi gagal'
      set({ error: msg, loading: false })
      throw err
    }
  },

  googleLogin: async (credentialOrPayload) => {
    set({ loading: true, error: null })
    try {
      const body = typeof credentialOrPayload === 'string'
        ? { credential: credentialOrPayload }
        : credentialOrPayload
      const { data } = await api.post('/auth/google', body)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, loading: false })
      return data
    } catch (err) {
      const msg = err.response?.data?.message || 'Login Google gagal'
      set({ error: msg, loading: false })
      throw err
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout')
    } catch (_) {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user })
  },

  setAuth: (user, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, token, loading: false, error: null })
  },

  isAdmin: () => get().user?.role === 'admin',
  isAuthenticated: () => !!get().token,
}))

export default useAuthStore
