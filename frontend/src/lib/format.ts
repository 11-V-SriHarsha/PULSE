type Prefs = {
    currency: 'INR' | 'INR_COMMAS'
    dateFormat: 'DD-MM-YYYY' | 'YYYY-MM-DD'
    weekStart: 'SUN' | 'MON'
    theme: 'light' | 'dark'
  }
  
  const defaultPrefs: Prefs = {
    currency: 'INR_COMMAS',
    dateFormat: 'DD-MM-YYYY',
    weekStart: 'MON',
    theme: 'light',
  }
  
  const readPrefs = (): Prefs => {
    try {
      const raw = localStorage.getItem('pulse:prefs')
      if (!raw) return defaultPrefs
      const p = JSON.parse(raw)
      return {
        currency: p.currency ?? defaultPrefs.currency,
        dateFormat: p.dateFormat ?? defaultPrefs.dateFormat,
        weekStart: p.weekStart ?? defaultPrefs.weekStart,
        theme: p.theme ?? defaultPrefs.theme,
      }
    } catch {
      return defaultPrefs
    }
  }
  
  export const inr = (v: number | string, opts?: { currency?: Prefs['currency'] }) => {
    const prefs = readPrefs()
    const mode = opts?.currency ?? prefs.currency
    const n = typeof v === 'number' ? v : Number(v)
    if (!Number.isFinite(n)) return '₹0'
    if (mode === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
      }).format(n)
    }
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n)}`
  }
  
  export const fmtDate = (isoOrDate: string | Date, opts?: { format?: Prefs['dateFormat'] }) => {
    const prefs = readPrefs()
    const format = opts?.format ?? prefs.dateFormat
    const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate
    if (Number.isNaN(+d)) return '—'
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return format === 'YYYY-MM-DD' ? `${yyyy}-${mm}-${dd}` : `${dd}-${mm}-${yyyy}`
  }
  
  export const getWeekStart = () => readPrefs().weekStart
  export const getTheme = () => readPrefs().theme
  export const setThemeClass = () => {
    const theme = getTheme()
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }
  