import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { bootAccessibilityPrefs } from '@/lib/accessibilityPrefs'

bootAccessibilityPrefs()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
