import { FileX } from 'lucide-react'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export default function EmptyState({
  title = 'Không có dữ liệu',
  description = 'Chưa có nội dung nào để hiển thị.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16', className)}>
      <div className="rounded-full bg-gray-100 p-4">
        <FileX className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mt-4 text-base font-medium text-gray-900">{title}</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
