export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:text-white"
    >
      Skip to main content
    </a>
  )
}
