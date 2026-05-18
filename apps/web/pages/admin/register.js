import { useState } from 'react'
import { useRouter } from 'next/router'

export default function AdminRegister() {
  const [orgName, setOrgName] = useState('')
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
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName, email, password }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) {
        setError(data.error || 'Registration failed')
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
      <h2>Register Organization</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>
            Organization name: <input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>
            Admin email: <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>
            Password: <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </label>
        </div>
        {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
        <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
      </form>
    </main>
  )
}
