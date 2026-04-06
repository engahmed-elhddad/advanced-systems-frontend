import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function BrandRedirectPage({ params }: Props) {
  const { slug } = await params
  redirect(`/brand/${encodeURIComponent(slug)}`)
}
