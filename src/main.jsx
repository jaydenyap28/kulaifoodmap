import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/react"
import ReactGA from "react-ga4";
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import './i18n'

if (import.meta.env.PROD) {
  ReactGA.initialize("G-526RPY0VR4");
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {import.meta.env.PROD && <Analytics />}
    </ErrorBoundary>
  </React.StrictMode>,
)
