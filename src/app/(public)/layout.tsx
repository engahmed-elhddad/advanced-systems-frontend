import { SkipLink } from '@/components/shared/SkipLink'
import { RFQModalGlobal } from './RFQModalGlobal'

export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      {children}
      <RFQModalGlobal />
    </>
  )
}
