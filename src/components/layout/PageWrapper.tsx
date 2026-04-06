import { cn } from '@/lib/utils'

export interface PageWrapperProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}

export function PageWrapper({ children, className, as: Tag = 'div' }: PageWrapperProps) {
  return (
    <Tag className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</Tag>
  )
}
