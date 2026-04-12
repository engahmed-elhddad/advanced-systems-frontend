import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ brand: string }>
}

/** Legacy /brand/:slug → canonical /brands/:slug */
export default async function LegacyBrandRedirect({ params }: Props) {
  const { brand } = await params
  redirect(`/brands/${encodeURIComponent(brand)}`)
}
