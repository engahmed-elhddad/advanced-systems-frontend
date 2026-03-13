interface AdvancedSystemsLogoProps {
  className?: string
}

export function AdvancedSystemsLogo({ className }: AdvancedSystemsLogoProps) {
  return (
    <svg
      viewBox="0 0 160 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Advanced Systems"
      role="img"
      className={className}
    >
      <rect width="160" height="56" rx="10" fill="rgba(15,22,41,0.7)" />
      <circle cx="22" cy="28" r="10" stroke="#22c55e" strokeWidth="2" fill="none" />
      <path d="M17 28h10M22 23v10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <text
        x="38"
        y="23"
        fontFamily="'Outfit', Inter, system-ui, sans-serif"
        fontSize="13"
        fontWeight="700"
        fill="#f8fafc"
        letterSpacing="0.5"
      >
        Advanced
      </text>
      <text
        x="38"
        y="40"
        fontFamily="'Outfit', Inter, system-ui, sans-serif"
        fontSize="13"
        fontWeight="700"
        fill="#22c55e"
        letterSpacing="0.5"
      >
        Systems
      </text>
    </svg>
  )
}
