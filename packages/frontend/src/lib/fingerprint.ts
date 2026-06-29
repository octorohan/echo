// Lightweight browser fingerprint for soft-ban behavioral scoring only.
// No PII stored. No tracking. Hash is one-way.
export async function getFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
  ].join('|')

  const encoded = new TextEncoder().encode(components)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
