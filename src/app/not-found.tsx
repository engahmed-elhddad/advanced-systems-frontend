import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-semibold text-[var(--color-foreground)]">Page not found</h1>
      <p className="mt-3 text-[var(--color-foreground-muted)]">
        The page you requested does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-[var(--radius-3)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
      >
        Back to home
      </Link>
    </section>
  )
}
