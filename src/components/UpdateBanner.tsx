interface UpdateBannerProps {
  version: string | null
  onRefresh: () => void
  onDismiss: () => void
}

export function UpdateBanner({ version, onRefresh, onDismiss }: UpdateBannerProps) {
  return (
    <div className="update-banner">
      <span className="update-banner__text">
        New version{version ? ` (v${version})` : ''} available
      </span>
      <button type="button" className="update-banner__btn update-banner__btn--refresh" onClick={onRefresh}>
        Refresh
      </button>
      <button type="button" className="update-banner__btn update-banner__btn--dismiss" onClick={onDismiss} aria-label="Dismiss">
        &times;
      </button>
    </div>
  )
}
