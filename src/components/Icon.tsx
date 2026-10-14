import {
  ArrowLeftRight,
  Bandage,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  House,
  List,
  MonitorPlay,
  Plane,
  Search,
  Sparkles,
  Trophy,
  Tv,
  Users,
  type LucideIcon,
} from 'lucide-react'

const ICONS = {
  games: Trophy,
  players: Users,
  list: List,
  calendar: CalendarDays,
  tv: Tv,
  stream: MonitorPlay,
  home: House,
  away: Plane,
  injury: Bandage,
  preview: Sparkles,
  updated: Clock,
  prev: ChevronLeft,
  next: ChevronRight,
  expand: ChevronDown,
  switch: ArrowLeftRight,
  search: Search,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

/** A Lucide icon, decorative (the text beside it carries the meaning). */
export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const Lucide = ICONS[name]
  return <Lucide className="icon" size={size} strokeWidth={1.75} aria-hidden="true" />
}
