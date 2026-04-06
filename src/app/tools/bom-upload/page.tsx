import { redirect } from 'next/navigation'

/** BOM Upload tool – redirect to full BOM Analyzer */
export default function BomUploadPage() {
  redirect('/bom-analyzer')
}
