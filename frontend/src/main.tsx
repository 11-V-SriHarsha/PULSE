import React from 'react'
import ReactDOM from 'react-dom/client'
import { RecoilRoot } from 'recoil'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'

// 👇 ensure dark/light class is set on <html> before React renders
import { setThemeClass } from './utils/format'
setThemeClass()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RecoilRoot>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <App />
      </BrowserRouter>
    </RecoilRoot>
  </React.StrictMode>
)
