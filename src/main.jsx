import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from "@vercel/analytics/react"
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import './i18n'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <Analytics />
    </ErrorBoundary>
  </React.StrictMode>,
)
