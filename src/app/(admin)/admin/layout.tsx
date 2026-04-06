"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { isAdminAuthenticated, clearAdminAuth, getAdminUser } from "@/lib/admin-auth"
import { AdminLayout as AdminShellLayout } from "@/components/admin/layout/AdminLayout"

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
  if (!authChecked) return <div className="admin-shell flex items-center justify-center text-slate-500">Loading…</div>

  const user = getAdminUser()

  return (
    <AdminShellLayout userEmail={user?.email}>
      <div className="mb-4 flex items-center justify-end">
        {isAdminAuthenticated() ? (
          <button
            onClick={() => {
              clearAdminAuth()
              router.push("/admin/login")
            }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-200 backdrop-blur-xl transition-all duration-300 ease-in-out hover:bg-white/10 hover:shadow-lg"
          >
            Logout
          </button>
        ) : null}
      </div>
      {children}
    </AdminShellLayout>
  )
}
