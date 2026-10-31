import { useEffect } from 'react'
import { glassColors, type TeamTheme } from '../lib/teamColors.ts'

/**
 * The glass app's background: the team's colors drifting behind the whole page (App.css,
 * .app-atmosphere), with the page's cards frosted over it (html.glass).
 */
export function AppAtmosphere({ theme }: { theme: TeamTheme }) {
  useEffect(() => {
    const root = document.documentElement
    const g = glassColors(theme)
    // App.css picks each mode's set (html.glass).
    const values: Record<string, string> = {
      '--glass-base': g.base,
      '--glass-glow': g.glow,
      '--glass-accent': g.accent,
      '--glass-base-light': g.baseLight,
      '--glass-glow-light': g.glowLight,
      '--glass-accent-light': g.accentLight,
      '--glass-link-dark': g.linkDark,
      '--glass-link-light': g.linkLight,
      '--glass-accent-text-dark': g.accentTextDark,
      '--glass-accent-text-light': g.accentTextLight,
      '--glass-on-accent-dark': g.onAccentDark,
      '--glass-on-accent-light': g.onAccentLight,
      '--glass-win-dark': g.winDark,
      '--glass-loss-dark': g.lossDark,
      '--glass-win-light': g.winLight,
      '--glass-loss-light': g.lossLight,
    }
    root.classList.add('glass')
    for (const [key, value] of Object.entries(values)) root.style.setProperty(key, value)
    return () => {
      root.classList.remove('glass')
      for (const key of Object.keys(values)) root.style.removeProperty(key)
    }
  }, [theme])

  return (
    <div className="app-atmosphere" aria-hidden="true">
      <span className="app-cloud app-cloud-main" />
      <span className="app-cloud app-cloud-light" />
      <span className="app-cloud app-cloud-accent" />
    </div>
  )
}
