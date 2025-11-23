import { Logo } from './Logo'
import { useScrollProgress } from '@/hooks/useScrollProgress'

export function LandingHeader() {
  const { isScrolled } = useScrollProgress()

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 h-16 border-b transition-all duration-300 ${
        isScrolled 
          ? 'border-white/20 bg-black/95 backdrop-blur-md shadow-lg' 
          : 'border-white/10 bg-black/80 backdrop-blur-sm'
      }`}
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 h-full">
        <Logo size="md" showText={true} />
        <nav className="flex items-center gap-6">
          <a 
            href="#features" 
            className="text-sm text-gray-400 hover:text-white transition-colors relative group"
          >
            Features
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a 
            href="#services" 
            className="text-sm text-gray-400 hover:text-white transition-colors relative group"
          >
            Services
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
          </a>
          <a 
            href="#docs" 
            className="text-sm text-gray-400 hover:text-white transition-colors relative group"
          >
            Documentation
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
          </a>
          <button className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50">
            Sign In
          </button>
        </nav>
      </div>
    </header>
  )
}

