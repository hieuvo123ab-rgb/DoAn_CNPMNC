import { CheckCircle2, ShieldCheck, ShieldAlert, CircleDashed } from 'lucide-react'
import { cn } from '@/utils/cn'

interface SignatureBadgeProps {
  status?: 'unsigned' | 'signed' | 'verified' | 'invalid'
  className?: string
}

export default function SignatureBadge({ status = 'unsigned', className }: SignatureBadgeProps) {
  if (status === 'verified') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800',
          className
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        Đã ký số & Hợp lệ
      </span>
    )
  }

  if (status === 'signed') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800',
          className
        )}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
        Đã ký điện tử
      </span>
    )
  }

  if (status === 'invalid') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800',
          className
        )}
      >
        <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
        Chữ ký không hợp lệ
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600',
        className
      )}
    >
      <CircleDashed className="h-3.5 w-3.5 text-gray-400" />
      Chưa ký số
    </span>
  )
}
