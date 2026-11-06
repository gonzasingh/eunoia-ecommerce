import { INSTAGRAM } from '../utils/constants';

export default function AnnouncementBar() {
  return (
    <div className="ann">
      Plata 925 legítima · Envíos por Andreani a todo el país · Seguinos en{' '}
      <a href={`https://www.instagram.com/${INSTAGRAM}/`} target="_blank" rel="noopener noreferrer" aria-label={`Instagram @${INSTAGRAM}`}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
        @{INSTAGRAM}
      </a>
    </div>
  );
}
