"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { isAdminAuthenticated, clearAdminAuth, getAdminUser } from "@/lib/admin-auth"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const isLogin = pathname === "/admin/login"

  useEffect(() => {
    if (isLogin) {
      setAuthChecked(true)
      return
    }
    if (typeof window === "undefined") return
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.replace("/admin/login")
      return
    }
    setAuthChecked(true)
  }, [pathname, isLogin, router])

  if (isLogin) return <>{children}</>
  if (!authChecked) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading…</div>

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
