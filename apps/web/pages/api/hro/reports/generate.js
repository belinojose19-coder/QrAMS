const prisma = require('../../../../lib/prisma')
const { getUserFromRequest } = require('../../../../lib/auth')
const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await getUserFromRequest(req)
    if (!user || (user.role !== 'hro' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const { orgId, startDate, endDate, reportType, format } = req.body || {}
    if (!orgId || !startDate || !endDate || !reportType || !format) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Fetch logs for the organization within the date range
    const logs = await prisma.dTRLog.findMany({
      where: {
        orgId: orgId,
        logTimestamp: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        employee: {
          include: {
            org: true
          }
        },
        qrSession: true
      },
      orderBy: { logTimestamp: 'asc' },
    })

    if (logs.length === 0) {
      return res.status(404).json({ error: 'No logs found for the selected range' })
    }

    if (format === 'xlsx') {
      return await generateXlsx(res, logs, reportType)
    } else if (format === 'pdf') {
      return await generatePdf(res, logs, reportType)
    } else {
      return res.status(400).json({ error: 'Unsupported format' })
    }
  } catch (err) {
    console.error('Report Generation Error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function generateXlsx(res, logs, reportType) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Attendance Report')

  // Header
  worksheet.columns = [
    { header: 'Employee Name', key: 'name', width: 20 },
    { header: 'Employee Number', key: 'empNum', width: 15 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Time', key: 'time', width: 15 },
    { header: 'Type', key: 'type', width: 10 },
  ]

  logs.forEach(log => {
    worksheet.addRow({
      name: log.employee.fullName,
      empNum: log.employee.empNumber,
      date: log.logTimestamp.toLocaleDateString(),
      time: log.logTimestamp.toLocaleTimeString(),
      type: log.type.toUpperCase(),
    })
  })

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx')
  
  const buffer = await workbook.xlsx.writeBuffer()
  return res.send(buffer)
}

async function generatePdf(res, logs, reportType) {
  const doc = new PDFDocument()
  const stream = require('stream').PassThrough()
  
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'attachment; filename=report.pdf')
  doc.pipe(stream)
  stream.pipe(res)

  doc.fontSize(20).text('Attendance Report', { align: 'center' })
  doc.moveDown()
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`)
  doc.moveDown()

  logs.forEach((log, index) => {
    doc.text(`${index + 1}. ${log.employee.fullName} (${log.employee.empNumber}) - ${log.type.toUpperCase()} at ${log.logTimestamp.toLocaleString()}`)
    doc.moveDown(0.5)
  })

  doc.end()
  return Promise.resolve()
}
