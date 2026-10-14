import {
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  FileCode,
  File,
} from 'lucide-react'
import { cn } from '@/utils/cn'

interface FileTypeIconProps {
  fileName?: string
  mimeType?: string
  className?: string
}

export default function FileTypeIcon({ fileName = '', mimeType = '', className }: FileTypeIconProps) {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''

  if (mimeType.includes('pdf') || ext === 'pdf') {
    return <FileText className={cn('h-5 w-5 text-rose-500', className)} />
  }

  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    ext === 'xlsx' ||
    ext === 'xls' ||
    ext === 'csv'
  ) {
    return <FileSpreadsheet className={cn('h-5 w-5 text-emerald-600', className)} />
  }

  if (
    mimeType.includes('word') ||
    ext === 'doc' ||
    ext === 'docx'
  ) {
    return <FileText className={cn('h-5 w-5 text-blue-600', className)} />
  }

  if (
    mimeType.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif'].includes(ext)
  ) {
    return <FileImage className={cn('h-5 w-5 text-purple-600', className)} />
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <FileArchive className={cn('h-5 w-5 text-amber-600', className)} />
  }

  if (['json', 'js', 'ts', 'html', 'css', 'sql'].includes(ext)) {
    return <FileCode className={cn('h-5 w-5 text-indigo-600', className)} />
  }

  return <File className={cn('h-5 w-5 text-gray-500', className)} />
}
