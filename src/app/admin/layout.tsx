"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { isAdminAuthenticated, clearAdminAuth, getAdminUser } from "@/lib/admin-auth"
import { AdminShell } from "@/components/admin/AdminShell"

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
  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] text-[var(--text-secondary)]">
        Loading…
      </div>
    )
  }

  const user = getAdminUser()

  return (
    <AdminShell
      userEmail={user?.email ?? null}
      onLogout={() => {
        clearAdminAuth()
        router.push("/admin/login")
      }}
    >
      {children}
    </AdminShell>
  )
}
