export function ClayHeadphones({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background blob */}
      <ellipse cx="200" cy="210" rx="160" ry="155" fill="var(--clay-pink)" opacity="0.15" />

      {/* Headband */}
      <path
        d="M120 200 C120 120 280 120 280 200"
        stroke="var(--accent)"
        strokeWidth="18"
        strokeLinecap="round"
        fill="none"
        filter="url(#clay-shadow)"
      />

      {/* Headband highlight */}
      <path
        d="M130 195 C130 125 270 125 270 195"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      {/* Left ear cup */}
      <rect x="88" y="185" width="60" height="80" rx="28" fill="var(--accent)" />
      <rect x="92" y="189" width="52" height="72" rx="24" fill="var(--accent-strong)" />
      <ellipse cx="118" cy="225" rx="18" ry="22" fill="var(--accent)" opacity="0.6" />
      {/* Left cup highlight */}
      <rect x="96" y="192" width="20" height="8" rx="4" fill="white" opacity="0.4" />

      {/* Right ear cup */}
      <rect x="252" y="185" width="60" height="80" rx="28" fill="var(--accent)" />
      <rect x="256" y="189" width="52" height="72" rx="24" fill="var(--accent-strong)" />
      <ellipse cx="282" cy="225" rx="18" ry="22" fill="var(--accent)" opacity="0.6" />
      {/* Right cup highlight */}
      <rect x="260" y="192" width="20" height="8" rx="4" fill="white" opacity="0.4" />

      {/* Left cushion */}
      <ellipse cx="105" cy="225" rx="14" ry="28" fill="var(--clay-peach)" opacity="0.7" />

      {/* Right cushion */}
      <ellipse cx="295" cy="225" rx="14" ry="28" fill="var(--clay-peach)" opacity="0.7" />

      {/* Music notes floating */}
      <g opacity="0.9">
        {/* Note 1 */}
        <circle cx="320" cy="140" r="10" fill="var(--clay-pink)" />
        <rect x="328" y="105" width="4" height="35" rx="2" fill="var(--clay-pink)" />
        <path d="M328 105 C338 100 345 108 332 110" fill="var(--clay-pink)" />

        {/* Note 2 */}
        <circle cx="85" cy="150" r="8" fill="var(--clay-mint)" />
        <rect x="91" y="120" width="3.5" height="30" rx="1.75" fill="var(--clay-mint)" />
        <path d="M91 120 C100 116 105 122 94 124" fill="var(--clay-mint)" />

        {/* Note 3 - double */}
        <circle cx="340" cy="260" r="7" fill="var(--clay-peach)" />
        <circle cx="358" cy="255" r="7" fill="var(--clay-peach)" />
        <rect x="345" y="225" width="3" height="35" rx="1.5" fill="var(--clay-peach)" />
        <rect x="363" y="220" width="3" height="35" rx="1.5" fill="var(--clay-peach)" />
        <rect x="345" y="220" width="21" height="4" rx="2" fill="var(--clay-peach)" />
      </g>

      {/* Sound waves from left cup */}
      <path d="M75 210 C65 210 60 225 75 240" stroke="var(--clay-mint)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M65 200 C50 200 42 225 65 250" stroke="var(--clay-mint)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4" />

      {/* Sound waves from right cup */}
      <path d="M325 210 C335 210 340 225 325 240" stroke="var(--clay-mint)" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M335 200 C350 200 358 225 335 250" stroke="var(--clay-mint)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4" />

      {/* Decorative dots */}
      <circle cx="155" cy="310" r="5" fill="var(--clay-pink)" opacity="0.5" />
      <circle cx="245" cy="320" r="4" fill="var(--clay-mint)" opacity="0.5" />
      <circle cx="180" cy="330" r="3" fill="var(--accent)" opacity="0.4" />
      <circle cx="70" cy="280" r="4" fill="var(--clay-peach)" opacity="0.5" />
      <circle cx="330" cy="290" r="3.5" fill="var(--clay-pink)" opacity="0.4" />

      {/* Clay shadow filter */}
      <defs>
        <filter id="clay-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="3" dy="3" stdDeviation="4" floodColor="rgba(108,74,200,0.2)" />
        </filter>
      </defs>
    </svg>
  );
}
