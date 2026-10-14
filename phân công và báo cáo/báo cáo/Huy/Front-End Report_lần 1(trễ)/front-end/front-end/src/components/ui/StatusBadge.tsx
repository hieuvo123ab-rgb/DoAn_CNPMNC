import type { DocumentStatus } from '@/types'
import { statusMap } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface StatusBadgeProps {
  status: DocumentStatus
  className?: string
  showDot?: boolean
}

export default function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = statusMap[status] || {
    label: status,
    bg: 'bg-gray-100 text-gray-700 border-gray-200',
    dot: 'bg-gray-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        config.bg,
        className
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />}
      {config.label}
    </span>
  )
}
