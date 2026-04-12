export function resolveImage(src: string | null | undefined): string {
  const value = (src ?? '').trim()
  if (!value) {
    return '/placeholder.png'
  }
  return value
}

