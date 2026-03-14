"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { isAdminAuthenticated, clearAdminAuth, getAdminUser } from "@/lib/admin-auth"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLogin = pathname === "/admin/login"

  // Optional: redirect to login when no token. Kept off for backward compat with api-key.
  // useEffect(() => {
  //   if (!isLogin && !isAdminAuthenticated() && !process.env.NEXT_PUBLIC_ADMIN_API_KEY) {
  //     router.replace("/admin/login")
  //   }
  // }, [pathname, isLogin, router])

  if (isLogin) return <>{children}</>

  const user = getAdminUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/admin" className="text-lg font-bold text-gray-900">
            Admin Control
          </Link>
          <div className="flex items-center gap-4">
            {user && <span className="text-sm text-gray-600">{user.email}</span>}
            {isAdminAuthenticated() ? (
              <button
                onClick={() => {
                  clearAdminAuth()
                  router.push("/admin/login")
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            ) : (
              <Link href="/admin/login" className="text-sm text-primary-600 hover:underline">Login</Link>
            )}
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              ← Site
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
