const TOKEN_KEY = 'echo:token'
const EXPIRY_KEY = 'echo:token:expiry'
const EXPIRY_DAYS = 30

export function getOrCreateToken(): string {
  const existing = localStorage.getItem(TOKEN_KEY)
  const expiry = parseInt(localStorage.getItem(EXPIRY_KEY) ?? '0')

  if (existing && Date.now() < expiry) {
    // refresh expiry on use
    localStorage.setItem(EXPIRY_KEY, String(Date.now() + EXPIRY_DAYS * 86400_000))
    return existing
  }

  const token = crypto.randomUUID()
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + EXPIRY_DAYS * 86400_000))
  return token
}

export function exportToken(): string {
  const token = localStorage.getItem(TOKEN_KEY) ?? ''
  const expiry = localStorage.getItem(EXPIRY_KEY) ?? '0'
  return btoa(JSON.stringify({ token, expiry }))
}

export function importToken(encoded: string): boolean {
  try {
    const { token, expiry } = JSON.parse(atob(encoded))
    if (!token || Date.now() > parseInt(expiry)) return false
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(EXPIRY_KEY, expiry)
    return true
  } catch {
    return false
  }
}
