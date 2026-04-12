export interface EmptyProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function Empty({ icon, title, description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-white/50">
      {icon ? <div className="flex h-12 w-12 items-center justify-center text-white/40">{icon}</div> : null}
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description ? <p className="max-w-md text-sm text-white/55">{description}</p> : null}
      {action ? (
        <button
          type="button"
          className="mt-2 rounded-xl bg-gradient-to-r from-[#FF7A00] to-[#FF5500] px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/50"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}
