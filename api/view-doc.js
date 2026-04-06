import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

export default async function handler(req, res) {
  const { url, email } = req.query

  if (!url || !email) {
    return res.status(400).json({ error: 'Missing url or email' })
  }

  const docUrl = decodeURIComponent(url)
  const userEmail = decodeURIComponent(email)

  try {
    const response = await fetch(docUrl)
    if (!response.ok) {
      return res.status(404).json({ error: 'Document not found' })
    }

    const contentType = response.headers.get('content-type') || ''
    const buffer = await response.arrayBuffer()
    const isPdf = contentType.includes('pdf') || docUrl.toLowerCase().includes('.pdf')

    if (isPdf) {
      // Load PDF and stamp the viewer's email across every page
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const pages = pdfDoc.getPages()

      for (const page of pages) {
        const { width, height } = page.getSize()

        // Tile the email diagonally across the page
        for (let row = 0; row < height + 200; row += 110) {
          for (let col = -100; col < width + 100; col += 280) {
            page.drawText(userEmail, {
              x: col,
              y: row,
              size: 11,
              font,
              color: rgb(0.45, 0.45, 0.45),
              opacity: 0.13,
              rotate: degrees(35),
            })
          }
        }

        // Extra solid watermark in the centre of each page
        page.drawText(userEmail, {
          x: width / 2 - (userEmail.length * 3.5),
          y: height / 2,
          size: 16,
          font,
          color: rgb(0.4, 0.4, 0.4),
          opacity: 0.18,
          rotate: degrees(35),
        })
      }

      const watermarked = await pdfDoc.save()

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'inline; filename="document.pdf"')
      res.setHeader('Cache-Control', 'no-store, no-cache, private')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      return res.send(Buffer.from(watermarked))
    }

    // Non-PDF (images etc.) — pass through inline
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('Cache-Control', 'no-store')
    return res.send(Buffer.from(buffer))

  } catch (err) {
    console.error('view-doc error:', err)
    res.status(500).json({ error: err.message })
  }
}
