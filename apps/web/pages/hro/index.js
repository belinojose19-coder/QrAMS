import React from 'react'

export default function HroDashboard({ user }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>HRO Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <ul>
        <li><a href="#">Generate QR session</a></li>
        <li><a href="#">View employee DTR</a></li>
        <li><a href="#">Generate reports</a></li>
      </ul>
      <form method="post" action="/api/auth/logout">
        <button type="submit">Log out</button>
      </form>
    </main>
  )
}

export async function getServerSideProps(context) {
  const { req } = context
  const { getUserFromRequest } = require('../../lib/auth')
  const user = await getUserFromRequest(req)
  if (!user || (user.role !== 'hro' && user.role !== 'admin')) {
    return { redirect: { destination: '/hro/login', permanent: false } }
  }
  return { props: { user: { id: user.id, email: user.email, role: user.role } } }
}
