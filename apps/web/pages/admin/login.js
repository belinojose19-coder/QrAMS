import { useState } from 'react'
import { useRouter } from 'next/router'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      router.push('/admin')
    } catch (err) {
      setLoading(false)
      setError('Network error')
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h2>Organization Admin Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>
            Email: <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>
            Password: <input type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p style={{ marginTop: 12 }}>
        No org yet? <a href="/admin/register">Register an organization</a>
      </p>
    </main>
  )
}
