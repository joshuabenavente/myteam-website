// Readable channel names. The NBA feed combines Denver's local outlets into strings like
// "ALT/ALT+/KTVD"; split them into one entry per channel with a plain-English explanation.

import type { Broadcast } from './types.ts'

export interface Channel {
  label: string
  scope: Broadcast['scope']
  kind: Broadcast['kind']
  explain?: string
}

const LOCAL: { [code: string]: Omit<Channel, 'scope'> } = {
  ALT: { label: 'Altitude', kind: 'tv', explain: "Altitude Sports, Denver's regional sports channel on cable and satellite" },
  Altitude: { label: 'Altitude', kind: 'tv', explain: "Altitude Sports, Denver's regional sports channel on cable and satellite" },
  ALT2: { label: 'Altitude 2', kind: 'tv', explain: "Altitude's second channel, used when Altitude is showing another game" },
  'ALT+': { label: 'Altitude+', kind: 'stream', explain: "Altitude's streaming app (subscription)" },
  'Altitude+': { label: 'Altitude+', kind: 'stream', explain: "Altitude's streaming app (subscription)" },
  KTVD: { label: 'KTVD 20', kind: 'tv', explain: 'Free over-the-air TV in Denver, channel 20' },
  KUSA: { label: '9News', kind: 'tv', explain: 'Free over-the-air TV in Denver (KUSA, channel 9)' },
}

const STREAMING = ['Peacock', 'Prime Video', 'NBA League Pass']

export function channelsFor(broadcasts: Broadcast[]): Channel[] {
  const out: Channel[] = []
  for (const b of broadcasts) {
    const parts = b.scope === 'local' ? b.name.split('/').map((p) => p.trim()) : [b.name]
    for (const part of parts) {
      const known = b.scope === 'local' ? LOCAL[part] : undefined
      const channel: Channel = known
        ? { ...known, scope: b.scope }
        : { label: part, scope: b.scope, kind: STREAMING.includes(part) ? 'stream' : b.kind }
      if (!out.some((c) => c.label === channel.label)) out.push(channel)
    }
  }
  return out
}
