interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showText?: boolean
}

export function Logo({ size = 'md', className = '', showText = true }: LogoProps) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl'
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizes[size]} flex-shrink-0`}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Background circle with subtle gradient */}
          <circle cx="32" cy="32" r="30" fill="url(#bgGradient)" opacity="0.15"/>
          
          {/* Main 'A' letter with elegant design */}
          <path d="M32 14L24 46H28L30 38H34L36 46H40L32 14Z" fill="url(#mainGradient)"/>
          
          {/* Crossbar of A with gradient */}
          <path d="M29 30H35L32 22L29 30Z" fill="url(#crossbarGradient)"/>
          
          {/* Decorative alchemy elements (smaller, more subtle) */}
          <circle cx="16" cy="18" r="2.5" fill="url(#accentGradient)" opacity="0.5"/>
          <circle cx="48" cy="18" r="2.5" fill="url(#accentGradient)" opacity="0.5"/>
          <circle cx="16" cy="46" r="2.5" fill="url(#accentGradient)" opacity="0.5"/>
          <circle cx="48" cy="46" r="2.5" fill="url(#accentGradient)" opacity="0.5"/>
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" stopOpacity="1" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
              <stop offset="50%" stopColor="#ec4899" stopOpacity="1" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="crossbarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="1" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
            </linearGradient>
            <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="1" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showText && (
        <span className={`font-semibold text-white ${textSizes[size]}`}>Alchemy</span>
      )}
    </div>
  )
}

