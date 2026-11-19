/** Required configuration. No fallbacks: a missing secret must stop the request, not silently use a default. */
export function required(name) {
  const v = process.env[name]
  if (!v || v.length === 0) {
    throw new Error(`Missing required environment variable ${name}`)
  }
  return v
}

export const isProd = () => process.env.NODE_ENV === 'production'

