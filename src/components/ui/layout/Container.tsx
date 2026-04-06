import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Container({ className, ...props }: ContainerProps) {
  return <div className={cn('mx-auto w-full max-w-[1200px] px-6', className)} {...props} />
}
