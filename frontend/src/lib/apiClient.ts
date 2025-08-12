import axios from 'axios'

const apiClient = axios.create({
  withCredentials: true,
  timeout: 10000 // 10 second timeout
})

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      // let routes/pages handle redirect; we keep it simple
    } else if (err?.code === 'ECONNREFUSED' || err?.code === 'ERR_NETWORK') {
      console.error('Backend server is not running. Please start the backend server on port 5000.')
    }
    return Promise.reject(err)
  }
)

export default apiClient
