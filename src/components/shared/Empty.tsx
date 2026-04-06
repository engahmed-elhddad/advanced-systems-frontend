export interface EmptyProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function Empty({ icon, title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-[var(--color-foreground-muted)]">
      {icon ? <div className="flex h-12 w-12 items-center justify-center text-[var(--color-foreground-muted)]">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h3>
      {description ? <p className="max-w-md text-sm">{description}</p> : null}
      {action ? (
        <button
          type="button"
          className="mt-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}
