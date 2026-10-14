import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface LoadingStateProps {
  message?: string
  className?: string
}

export default function LoadingState({
  message = 'Đang tải...',
  className,
}: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  )
}
