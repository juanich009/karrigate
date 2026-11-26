export function Barrier({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 200 120" className="barrier" aria-hidden="true">
      <rect x="12" y="50" width="30" height="62" rx="3" fill="currentColor" />
      <circle cx="27" cy="40" r="7" fill="currentColor" />
      <g style={{ transformOrigin: '34px 62px', transform: open ? 'rotate(-72deg)' : 'rotate(0deg)', transition: 'transform .45s cubic-bezier(.3,.7,.2,1)' }}>
        <rect x="34" y="56" width="162" height="12" rx="2" fill="currentColor" />
        <rect x="70" y="56" width="16" height="12" fill="var(--gate-stripe)" />
        <rect x="104" y="56" width="16" height="12" fill="var(--gate-stripe)" />
        <rect x="138" y="56" width="16" height="12" fill="var(--gate-stripe)" />
        <rect x="172" y="56" width="16" height="12" fill="var(--gate-stripe)" />
      </g>
      <rect x="0" y="112" width="200" height="4" fill="currentColor" opacity=".45" />
    </svg>
  );
}
