export const API = {

  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  CHANGE_PASSWORD: '/api/auth/change-password', // ← add

  PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile', // PATCH name  ← add

  TXNS: '/api/transactions',
  TXNS_UPLOAD: '/api/transactions/upload',
  TXNS_SUMMARY: '/api/transactions/summary',

  AA_FETCH: '/api/aa/fetch',

  PDF_UPLOAD: '/api/pdf/upload',
} as const
