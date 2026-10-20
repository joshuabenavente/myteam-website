import { useState } from 'react'
import { Icon } from './Icon.tsx'

/** No connection: say how old the saved data is. */
export function OfflineNote({ updatedAt }: { updatedAt: string }) {
  const [now] = useState(() => new Date())
  const when = new Date(updatedAt)
  const today = when.toDateString() === now.toDateString()
  const label = when.toLocaleString('en-US', today ? { timeStyle: 'short' } : { dateStyle: 'medium', timeStyle: 'short' })
  return (
    <p className="offline-note" role="status">
      <Icon name="offline" size={16} />
      Offline · showing data from {label}
    </p>
  )
}
