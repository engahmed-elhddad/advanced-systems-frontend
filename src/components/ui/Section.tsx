import * as React from 'react'
import { cn } from '@/lib/utils'

export type SectionTone = 'light' | 'dark'

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  as?: 'section' | 'div' | 'article' | 'main'
  spacing?: 'comfortable' | 'spacious' | 'md' | 'lg'
  title?: React.ReactNode
  description?: React.ReactNode
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4'
  actions?: React.ReactNode
  tone?: SectionTone
}

const spacingMap: Record<NonNullable<SectionProps['spacing']>, string> = {
  comfortable: 'py-12',
  spacious: 'py-16',
  md: 'py-16',
  lg: 'py-20',
}

export function Section({
  as = 'section',
  spacing = 'comfortable',
  title,
  description,
  titleAs: TitleTag = 'h2',
  actions,
  className,
  children,
  tone = 'dark',
  ...props
}: SectionProps) {
  const Comp = as
  const space = spacingMap[spacing] ?? spacingMap.comfortable
  const titleClass =
    tone === 'dark'
      ? 'text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl'
      : 'text-2xl font-bold tracking-tight text-white sm:text-3xl'
  const descClass = tone === 'dark' ? 'text-base leading-relaxed text-white/55 sm:text-lg' : 'text-sm text-white/60'

  return (
    <Comp className={cn(space, className)} {...props}>
      {title != null || description != null || actions != null ? (
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl space-y-3">
            {title != null ? <TitleTag className={titleClass}>{title}</TitleTag> : null}
            {description != null ? <p className={descClass}>{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </Comp>
  )
}
