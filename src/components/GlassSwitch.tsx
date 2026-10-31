import { glassOn, setGlass } from '../lib/glass.ts'

/**
 * The glass preview's on/off switch, in the installed app's footer (SiteFooter). In a browser,
 * ?glass=1 and ?glass=0 do the same.
 */
export function GlassSwitch() {
  const on = glassOn()
  return (
    <button className="glass-switch" role="switch" aria-checked={on} onClick={() => setGlass(!on)}>
      <span className="glass-switch-track" aria-hidden="true">
        <span className="glass-switch-thumb" />
      </span>
      Glass look (preview)
    </button>
  )
}
