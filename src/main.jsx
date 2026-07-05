import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

/*
 * This is the React entry point. StrictMode wraps the app during development so
 * React can surface unsafe render patterns early, while App contains the actual
 * checkers editor and game experience.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
