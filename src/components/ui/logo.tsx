interface LogoIconProps {
  size?: number
  color?: string
  className?: string
}

// Maintenance Cycle logomark — three arc+chevron segments rotated 120°
export function LogoIcon({ size = 24, color = '#e4a930', className }: LogoIconProps) {
  // Scale stroke weights based on size for legibility
  const arcStroke = size <= 20 ? 4 : size <= 32 ? 3 : 2.5
  const chevronStroke = size <= 20 ? 3 : size <= 32 ? 2.5 : 2

  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className={className}>
      <g transform="rotate(0, 22, 22)">
        <path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" fill="none" stroke={color} strokeWidth={arcStroke} strokeLinecap="round" />
        <path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" fill="none" stroke={color} strokeWidth={chevronStroke} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="rotate(120, 22, 22)">
        <path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" fill="none" stroke={color} strokeWidth={arcStroke} strokeLinecap="round" />
        <path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" fill="none" stroke={color} strokeWidth={chevronStroke} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="rotate(240, 22, 22)">
        <path d="M12.6 11.6 A14 14 0 0 1 31.4 11.6" fill="none" stroke={color} strokeWidth={arcStroke} strokeLinecap="round" />
        <path d="M30.1 6.2 L31.4 11.6 L25.9 10.9" fill="none" stroke={color} strokeWidth={chevronStroke} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
  className?: string
  iconOnly?: boolean
}

const sizeMap = {
  sm: { icon: 20, text: 'text-base' },
  md: { icon: 24, text: 'text-lg' },
  lg: { icon: 32, text: 'text-xl' },
}

export function Logo({ size = 'md', variant = 'light', className, iconOnly }: LogoProps) {
  const { icon, text } = sizeMap[size]
  const textColor = variant === 'light' ? 'text-primary-900' : 'text-primary-100'

  return (
    <span className={`inline-flex items-center gap-2 ${className || ''}`}>
      <LogoIcon size={icon} />
      {!iconOnly && (
        <span className={`font-semibold tracking-tight ${text} ${textColor}`}>
          formulate
        </span>
      )}
    </span>
  )
}
