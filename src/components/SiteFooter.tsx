
/** Site name, contact address and data credits. */
export function SiteFooter({ updatedAt }: { updatedAt?: string }) {
  // Put together in the browser, so the address isn't sitting in the page source for scrapers.
  const email = ['contact', 'myteam.fans'].join('@')
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p>
          <strong>myteam.fans</strong> · <a href={`mailto:${email}`}>{email}</a>
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
