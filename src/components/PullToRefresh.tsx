import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon.tsx'

/** How far to pull (after the drag is halved) before letting go refreshes. */
const THRESHOLD = 64
/** Long enough to see that something happened, even when the data comes back at once. */
const MIN_SPIN = 600

/**
 * Pull down from the top of the page to reload the team's data, as in a phone app (the glass
 * app on touch screens). The page keeps showing what it has until the new data is in.
 * The browser's own pull to refresh is off in the glass app (App.css), so only this one runs.
 */
export function PullToRefresh({ onRefresh }: { onRefresh: () => Promise<void> }) {
  const [pull, setPull] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const busyRef = useRef(false)

  useEffect(() => {
    let start: { x: number; y: number } | undefined
    let distance = 0
    const onStart = (e: TouchEvent) => {
      // Only from the very top, and not while a refresh is running.
      start = window.scrollY <= 0 && !busyRef.current && e.touches.length === 1
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : undefined
      distance = 0
    }
    const onMove = (e: TouchEvent) => {
      if (!start) return
      const dx = e.touches[0].clientX - start.x
      const dy = e.touches[0].clientY - start.y
      // A sideways swipe (the next-up cards, the roster table) or a scroll up isn't a pull.
      if (distance === 0 && (dy <= 0 || Math.abs(dx) > Math.abs(dy))) {
        start = undefined
        return
      }
      distance = Math.min(dy / 2, THRESHOLD * 1.5)
      setPull(distance)
    }
    const onEnd = () => {
      if (!start) return
      start = undefined
      setPull(0)
      if (distance < THRESHOLD) return
      busyRef.current = true
      setBusy(true)
      setMessage('Refreshing…')
      const shown = new Promise((resolve) => setTimeout(resolve, MIN_SPIN))
      void Promise.all([onRefresh(), shown]).then(() => {
        busyRef.current = false
        setBusy(false)
        setMessage('Updated.')
      })
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [onRefresh])

  const shown = busy || pull > 0
  const progress = Math.min(pull / THRESHOLD, 1)
  return (
    <>
      <div
        className={`pull-refresh ${busy ? 'busy' : ''} ${progress === 1 ? 'ready' : ''}`}
        aria-hidden="true"
        style={{
          opacity: shown ? (busy ? 1 : progress) : 0,
          transform: `translate(-50%, ${busy ? THRESHOLD : pull}px) rotate(${progress * 270}deg)`,
        }}
      >
        <Icon name="refresh" size={20} />
      </div>
      <span className="sr-only" role="status">{message}</span>
    </>
  )
}
