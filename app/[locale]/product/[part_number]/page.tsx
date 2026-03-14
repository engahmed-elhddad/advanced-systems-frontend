import { notFound } from 'next/navigation'
import { getProductOrGenerate } from '@/lib/api'
import { ProductDetail } from '@/app/product/[part_number]/ProductDetail'

type Props = { params: Promise<{ locale: string; part_number: string }> }

export async function generateMetadata({ params }: Props) {
  const { part_number } = await params
  try {
    const product = await getProductOrGenerate(decodeURIComponent(part_number))
    const brand = product?.brand?.name || product?.manufacturer || 'Industrial'
    const pn = product?.part_number || part_number
    return {
      title: `${brand} ${pn} Datasheet and Availability | Advanced Systems`,
      description: `Find specifications, datasheet and availability for ${brand} ${pn}. Request a quote for industrial automation components.`,
    }
  } catch {
    return { title: 'Product Not Found' }
  }
}

export const revalidate = 3600

export default async function LocaleProductPage({ params }: Props) {
  const { part_number } = await params
  let product
  try {
    product = await getProductOrGenerate(decodeURIComponent(part_number))
  } catch {
    notFound()
  }
  if (!product) notFound()

  return (
    <div className="page-container py-8">
      <ProductDetail product={product} productBasePath="/product" />
    </div>
  )
}
