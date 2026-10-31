import { useEffect, useState } from 'react'
import { standalone } from '../lib/glass.ts'
import { Icon } from './Icon.tsx'

/** Chrome's install prompt, held until the button is pressed. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let held: InstallPromptEvent | undefined
const listeners = new Set<() => void>()
if (typeof window !== 'undefined') {
  // Chrome fires this once, early; keep it for whichever button shows later.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    held = e as InstallPromptEvent
    listeners.forEach((l) => l())
  })
  window.addEventListener('appinstalled', () => {
    held = undefined
    listeners.forEach((l) => l())
  })
}


/** iPhone or iPad Safari, which installs only through Share → Add to Home Screen. */
const iosSafari = () => {
  const ua = navigator.userAgent
  const ios = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  return ios && !/CriOS|FxiOS|EdgiOS/.test(ua)
}

/**
 * "Install app" where the browser offers it (Chrome, Edge, Android), a one-line tip on iPhone
 * Safari, and nothing once the app is installed.
 */
export function InstallApp() {
  const [, rerender] = useState(0)
  useEffect(() => {
    const update = () => rerender((n) => n + 1)
    listeners.add(update)
    return () => void listeners.delete(update)
  }, [])

  if (standalone()) return null
  if (held) {
    const install = async () => {
      const event = held
      if (!event) return
      await event.prompt()
      await event.userChoice
      held = undefined
      listeners.forEach((l) => l())
    }
    return (
      <button className="install-app" onClick={install}>
        <Icon name="download" size={16} />
        Install app
      </button>
    )
  }
  if (iosSafari()) {
    return (
      <p className="install-tip">
        <Icon name="download" size={16} />
        <span>
          Get the app: tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.
        </span>
      </p>
    )
  }
  return null
}
