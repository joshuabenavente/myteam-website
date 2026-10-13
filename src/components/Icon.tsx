import {
  Bandage,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  House,
  List,
  MonitorPlay,
  Palette,
  Plane,
  RotateCcw,
  Sparkles,
  Trophy,
  Tv,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useIconStyle } from '../lib/appearance.ts'

const ICONS = {
  games: [Trophy, 'sports_basketball'],
  players: [Users, 'groups'],
  list: [List, 'view_list'],
  calendar: [CalendarDays, 'calendar_month'],
  tv: [Tv, 'tv'],
  stream: [MonitorPlay, 'smart_display'],
  home: [House, 'home'],
  away: [Plane, 'flight'],
  injury: [Bandage, 'personal_injury'],
  preview: [Sparkles, 'auto_awesome'],
  updated: [Clock, 'schedule'],
  prev: [ChevronLeft, 'chevron_left'],
  next: [ChevronRight, 'chevron_right'],
  expand: [ChevronDown, 'expand_more'],
  palette: [Palette, 'palette'],
  close: [X, 'close'],
  reset: [RotateCcw, 'restart_alt'],
} satisfies Record<string, [LucideIcon, string]>

export type IconName = keyof typeof ICONS

interface Props {
  name: IconName
  size?: number
  /** Shown instead when icons are turned off. */
  fallback?: ReactNode
  /** Render even when icons are off (e.g. the picker's own button), using Lucide. */
  always?: boolean
}

export function Icon({ name, size = 18, fallback = null, always }: Props) {
  const style = useIconStyle()
  const [Lucide, material] = ICONS[name]
  if (style === 'material') {
    return (
      <span className="material-symbols-rounded icon" style={{ fontSize: size }} aria-hidden="true">
        {material}
      </span>
    )
  }
  if (style === 'lucide' || always) return <Lucide className="icon" size={size} strokeWidth={1.75} aria-hidden="true" />
  return <>{fallback}</>
}
