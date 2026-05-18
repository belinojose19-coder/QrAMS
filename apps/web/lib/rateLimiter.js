const mapKey = '__qrams_rate_limiter_map__'
const store = global[mapKey] = global[mapKey] || new Map()

function getIP(req) {
  const fwd = req.headers['x-forwarded-for'] || req.headers['x-real-ip']
  if (fwd) return String(fwd).split(',')[0].trim()
  if (req.socket && req.socket.remoteAddress) return req.socket.remoteAddress
  return 'unknown'
}

/**
 * Simple in-memory rate limiter (per-process). Not reliable for multi-instance production.
 * options: { key, windowMs, max }
 */
function rateLimit(req, res, options = {}) {
  const { key = 'default', windowMs = 60 * 1000, max = 10 } = options
  const ip = getIP(req)
  const k = `${key}:${ip}`
  const now = Date.now()
  const windowStart = now - windowMs
  const arr = (store.get(k) || []).filter((ts) => ts > windowStart)
  arr.push(now)
  store.set(k, arr)
  if (arr.length > max) {
    const retryAfter = Math.ceil((arr[0] + windowMs - now) / 1000)
    if (res && typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', String(retryAfter))
    }
    return { limited: true, retryAfter }
  }
  return { limited: false }
}

module.exports = { rateLimit, getIP }
