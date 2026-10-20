import { Wordmark } from './Brand.tsx'
import { InstallApp } from './InstallApp.tsx'

/** The owner's Ko-fi page, for the footer's support link. */
const KOFI_URL = 'https://ko-fi.com/soapod'

/** The "Updated ..." time in the footer. Off while the owner decides how to show data freshness. */
const SHOW_UPDATED = false

/** Site name, data credits, and the install and support pills. */
export function SiteFooter({ updatedAt }: { updatedAt?: string }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Wordmark height={22} className="footer-wordmark" />
        <p>
          {SHOW_UPDATED && updatedAt &&
            `Updated ${new Date(updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}. `}
          Data from NBA.com, ESPN and{' '}
          <a href="https://www.basketball-reference.com" target="_blank" rel="noreferrer">
            Basketball-Reference.com
          </a>
          . Regular season and playoffs only. Not affiliated with the NBA or its teams.
        </p>
        <div className="footer-actions">
          <InstallApp />
          <a className="support-link" href={KOFI_URL} target="_blank" rel="noreferrer">
            <span aria-hidden="true">🍺</span> Buy me a beer
          </a>
        </div>
      </div>
    </footer>
  )
}
