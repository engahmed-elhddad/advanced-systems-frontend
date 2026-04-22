import path from 'node:path'
import dotenv from 'dotenv'

/** Candidate `.env` paths: cwd, `frontend/` under cwd, and a few parents (monorepo / worker cwd). */
function collectEnvFilePaths(): string[] {
  const out: string[] = []
  const cwd = process.cwd()

  out.push(
    path.join(cwd, '.env.local'),
    path.join(cwd, '.env'),
    path.join(cwd, 'frontend', '.env.local'),
    path.join(cwd, 'frontend', '.env'),
  )

  let dir = cwd
  for (let i = 0; i < 6; i++) {
    out.push(path.join(dir, '.env.local'), path.join(dir, '.env'))
    const next = path.dirname(dir)
    if (next === dir) break
    dir = next
  }

  return [...new Set(out)]
}

export function loadE2eEnv(): void {
  for (const p of collectEnvFilePaths()) {
    dotenv.config({ path: p, quiet: true })
  }
}

export function requireAdminLoginEnv(): { email: string; password: string } {
  loadE2eEnv()

  const email =
    process.env.ADMIN_LOGIN_EMAIL?.trim() ||
    process.env.E2E_ADMIN_EMAIL?.trim() ||
    process.env.PLAYWRIGHT_ADMIN_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim()

  const password =
    process.env.ADMIN_LOGIN_PASSWORD ??
    process.env.E2E_ADMIN_PASSWORD ??
    process.env.PLAYWRIGHT_ADMIN_PASSWORD ??
    process.env.ADMIN_PASSWORD

  if (!email) {
    throw new Error(
      'No admin email in env. Set ADMIN_LOGIN_EMAIL (or E2E_ADMIN_EMAIL) and ADMIN_LOGIN_PASSWORD (or E2E_ADMIN_PASSWORD) in frontend/.env.local.',
    )
  }
  if (password == null || String(password).length === 0) {
    throw new Error(
      'No admin password in env. Set ADMIN_LOGIN_PASSWORD (or E2E_ADMIN_PASSWORD) in frontend/.env.local.',
    )
  }
  return { email, password: String(password) }
}
