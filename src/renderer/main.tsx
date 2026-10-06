import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { installNativeApi } from './api/tauriApi'

if ('__TAURI_INTERNALS__' in window) installNativeApi()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
