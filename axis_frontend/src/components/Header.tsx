import { cn } from '@/lib/utils'
import { Logo } from './Logo'

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  return (
    <header className={cn(
      "h-16 border-b border-gray-200 dark:border-gray-800",
      "bg-white dark:bg-gray-950",
      "flex items-center px-6",
      className
    )}>
      <div className="flex items-center justify-between w-full">
        <Logo size="md" showText={true} />
        <nav className="flex items-center gap-1">
          <button className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
            Dashboard
          </button>
          <button className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
            Clients
          </button>
          <button className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
            Contracts
          </button>
          <div className="ml-4 pl-4 border-l border-gray-200 dark:border-gray-800">
            <div className="h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">U</span>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}

