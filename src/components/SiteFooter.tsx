import { BrandIcon, Wordmark } from './Brand.tsx'
import { InstallApp } from './InstallApp.tsx'

/** The owner's Ko-fi page, for the footer's support link. */
const KOFI_URL = 'https://ko-fi.com/soapod'

/** Site identity and the install and support pills. */
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <BrandIcon size={30} glass />
          <Wordmark height={22} />
        </div>
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
