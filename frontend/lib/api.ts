import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const tripApi = {
  list:   ()                        => api.get('/trips'),
  get:    (id: string)              => api.get(`/trips/${id}`),
  create: (data: any)               => api.post('/trips', data),
  delete: (id: string)              => api.delete(`/trips/${id}`),
}

export const itineraryApi = {
  generate: (tripId: string) => api.post(`/trips/${tripId}/itinerary/generate`),
  get:      (tripId: string) => api.get(`/trips/${tripId}/itinerary`),
}

export const chatApi = {
  send:    (data: { message: string; tripId: string }) => api.post('/chat', data),
  history: (tripId: string) => api.get(`/chat/${tripId}/history`),
}

export default api