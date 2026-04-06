import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article' | 'main'
  spacing?: 'md' | 'lg'
}

const spacingClasses = {
  md: 'py-16',
  lg: 'py-20',
}

export function Section({
  as = 'section',
  spacing = 'md',
  className,
  children,
  ...props
}: SectionProps) {
  const Comp = as
  return (
    <Comp className={cn(spacingClasses[spacing], className)} {...props}>
      {children}
    </Comp>
  )
}
