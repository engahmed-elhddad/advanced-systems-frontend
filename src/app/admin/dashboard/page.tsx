import { redirect } from 'next/navigation'

/** Canonical admin home is `/admin`. This route remains for bookmarks only. */
export default function AdminDashboardLegacyRedirect() {
  redirect('/admin')
}
