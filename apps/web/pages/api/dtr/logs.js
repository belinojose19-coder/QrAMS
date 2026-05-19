const prisma = require('../../../lib/prisma')
const { getUserFromRequest } = require('../../../lib/auth')

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await getUserFromRequest(req)
    if (!user) return res.status(401).json({ error: 'Authentication required' })

    // Find the employee record associated with this user
    const employee = await prisma.employee.findFirst({
      where: { user_id: user.id },
    })

    if (!employee) {
      return res.status(404).json({ error: 'Employee record not found' })
    }

    // Fetch logs for this employee, sorted by most recent
    const logs = await prisma.dTRLog.findMany({
      where: { employeeId: employee.id },
      orderBy: { logTimestamp: 'desc' },
      include: {
        qrSession: {
          select: { sessionDate: true, scanType: true }
        }
      }
    })

    return res.json({ 
      ok: true, 
      employee: {
        fullName: employee.fullName,
        empNumber: employee.empNumber
      },
      logs 
    })
  } catch (err) {
    console.error('Fetch Logs Error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
