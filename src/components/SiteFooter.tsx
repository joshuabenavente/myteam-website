import { Wordmark } from './Brand.tsx'
import { InstallApp } from './InstallApp.tsx'

/** The owner's Ko-fi page, for the footer's support link. */
const KOFI_URL = 'https://ko-fi.com/soapod'

/** Site name, a support link, contact address and data credits. */
export function SiteFooter({ updatedAt }: { updatedAt?: string }) {
  // Put together in the browser, so the address isn't sitting in the page source for scrapers.
  const email = ['contact', 'myteam.fans'].join('@')
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <Wordmark height={22} className="footer-wordmark" />
        <InstallApp />
        <p className="support">
          myteam.fans is free and ad-free.{' '}
          <a className="support-link" href={KOFI_URL} target="_blank" rel="noreferrer">
            <span aria-hidden="true">🍺</span> Buy me a beer
          </a>
        </p>
        <p>
          <a href={`mailto:${email}`}>{email}</a>
        </p>
        <p>
          {updatedAt &&
            `Updated ${new Date(updatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}. `}
          Data from NBA.com, ESPN and{' '}
          <a href="https://www.basketball-reference.com" target="_blank" rel="noreferrer">
            Basketball-Reference.com
          </a>
          . Regular season and playoffs only. Not affiliated with the NBA or its teams.
        </p>
      </div>
    </footer>
  )
}
