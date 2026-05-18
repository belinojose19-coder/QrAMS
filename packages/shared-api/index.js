const fetchJson = async (url, opts = {}) => {
  const res = await fetch(url, opts)
  if (!res.ok) throw new Error('API error')
  return res.json()
}

module.exports = { fetchJson }
