import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Upright weights 200-800 only; the site uses no italics.
import '@fontsource-variable/atkinson-hyperlegible-next/wght.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
