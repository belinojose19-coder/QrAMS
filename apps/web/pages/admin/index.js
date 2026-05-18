import React from 'react'

export default function AdminDashboard({ user }) {
  return (
    <main style={{ padding: 24 }}>
      <h1>Organization Admin Dashboard</h1>
      <p>Welcome, {user.email}</p>
      <ul>
        <li><a href="#">Manage employees</a></li>
        <li><a href="#">Generate HRO accounts</a></li>
        <li><a href="#">View audit logs</a></li>
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
  if (!user || user.role !== 'admin') {
    return { redirect: { destination: '/admin/login', permanent: false } }
  }
  return { props: { user: { id: user.id, email: user.email, role: user.role } } }
}
