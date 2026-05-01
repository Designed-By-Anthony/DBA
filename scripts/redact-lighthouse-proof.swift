import AppKit
import CoreGraphics
import Foundation
import PDFKit

let sourcePDFURL = URL(fileURLWithPath: "/Users/anthonyjones/Downloads/clean run.pdf")
let outputPDFURL = URL(fileURLWithPath: "/Users/anthonyjones/Downloads/clean-run-redacted-local.pdf")
let outputPNGURL = URL(fileURLWithPath: "/workspace/apps/web/public/images/audit-before-report.png")
let previewPNGURL = URL(fileURLWithPath: "/tmp/redacted-audit-before-preview.png")

let redactionFill = NSColor(calibratedRed: 0.04, green: 0.07, blue: 0.12, alpha: 0.98)
let redactionStroke = NSColor(calibratedRed: 0.58, green: 0.77, blue: 0.99, alpha: 0.35)
let redactionText = NSColor(calibratedRed: 0.86, green: 0.92, blue: 1.00, alpha: 1.0)

struct RedactionSpec {
  let x: CGFloat
  let y: CGFloat
  let width: CGFloat
  let height: CGFloat
  let label: String
}

let firstPageRedactions: [RedactionSpec] = [
  RedactionSpec(
    x: 0.058,
    y: 0.020,
    width: 0.205,
    height: 0.034,
    label: "URL REDACTED"
  ),
  RedactionSpec(
    x: 0.588,
    y: 0.182,
    width: 0.182,
    height: 0.218,
    label: "SITE PREVIEW REDACTED"
  ),
  RedactionSpec(
    x: 0.210,
    y: 0.532,
    width: 0.610,
    height: 0.090,
    label: "SCREENSHOT FILMSTRIP REDACTED"
  ),
  RedactionSpec(
    x: 0.173,
    y: 0.774,
    width: 0.435,
    height: 0.118,
    label: "CLIENT URLS REDACTED"
  ),
]

func render(page: PDFPage, scale: CGFloat) -> NSImage? {
  let bounds = page.bounds(for: .mediaBox)
  let pixelWidth = Int(bounds.width * scale)
  let pixelHeight = Int(bounds.height * scale)

  guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: pixelWidth,
    pixelsHigh: pixelHeight,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  ),
    let context = NSGraphicsContext(bitmapImageRep: rep) else {
    return nil
  }

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = context
  let cgContext = context.cgContext
  NSColor.white.setFill()
  cgContext.fill(CGRect(x: 0, y: 0, width: pixelWidth, height: pixelHeight))
  cgContext.saveGState()
  cgContext.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: cgContext)
  cgContext.restoreGState()
  NSGraphicsContext.restoreGraphicsState()

  let image = NSImage(size: NSSize(width: pixelWidth, height: pixelHeight))
  image.addRepresentation(rep)
  return image
}

func drawRedaction(_ spec: RedactionSpec, imageSize: NSSize) {
  let rect = CGRect(
    x: imageSize.width * spec.x,
    y: imageSize.height * (1 - spec.y - spec.height),
    width: imageSize.width * spec.width,
    height: imageSize.height * spec.height
  )

  let fillPath = NSBezierPath(roundedRect: rect, xRadius: 22, yRadius: 22)
  redactionFill.setFill()
  fillPath.fill()

  let strokePath = NSBezierPath(roundedRect: rect, xRadius: 22, yRadius: 22)
  redactionStroke.setStroke()
  strokePath.lineWidth = 4
  strokePath.stroke()

  let paragraph = NSMutableParagraphStyle()
  paragraph.alignment = .center
  paragraph.minimumLineHeight = 18
  paragraph.maximumLineHeight = 18

  let labelAttributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: min(rect.height * 0.12, 26), weight: .bold),
    .foregroundColor: redactionText,
    .paragraphStyle: paragraph,
  ]

  let label = NSAttributedString(string: spec.label, attributes: labelAttributes)
  let labelRect = rect.insetBy(dx: 28, dy: 18)
  label.draw(with: labelRect, options: [.usesLineFragmentOrigin, .usesFontLeading])
}

func redactImage(_ image: NSImage, specs: [RedactionSpec]) -> NSImage {
  let output = NSImage(size: image.size)
  output.lockFocus()
  image.draw(in: NSRect(origin: .zero, size: image.size))
  for spec in specs {
    drawRedaction(spec, imageSize: image.size)
  }
  output.unlockFocus()
  return output
}

func pngData(from image: NSImage) -> Data? {
  guard let tiff = image.tiffRepresentation,
        let rep = NSBitmapImageRep(data: tiff) else {
    return nil
  }
  return rep.representation(using: .png, properties: [:])
}

guard let sourcePDF = PDFDocument(url: sourcePDFURL) else {
  fatalError("Unable to open source PDF at \(sourcePDFURL.path)")
}

let pageCount = sourcePDF.pageCount
guard pageCount > 0 else {
  fatalError("Source PDF has no pages")
}

var renderedPages: [NSImage] = []
renderedPages.reserveCapacity(pageCount)

for index in 0..<pageCount {
  guard let page = sourcePDF.page(at: index),
        let rendered = render(page: page, scale: index == 0 ? 4.0 : 2.0) else {
    fatalError("Unable to render page \(index + 1)")
  }

  if index == 0 {
    renderedPages.append(redactImage(rendered, specs: firstPageRedactions))
  } else {
    renderedPages.append(rendered)
  }
}

if let png = pngData(from: renderedPages[0]) {
  try png.write(to: outputPNGURL)
  try png.write(to: previewPNGURL)
}

guard let consumer = CGDataConsumer(url: outputPDFURL as CFURL) else {
  fatalError("Unable to create PDF consumer")
}

var mediaBox = CGRect(x: 0, y: 0, width: 612, height: 792)
guard let pdfContext = CGContext(consumer: consumer, mediaBox: &mediaBox, nil) else {
  fatalError("Unable to create PDF context")
}

for (index, image) in renderedPages.enumerated() {
  guard let page = sourcePDF.page(at: index) else { continue }
  let bounds = page.bounds(for: .mediaBox)
  let pageBox = bounds
  pdfContext.beginPDFPage([kCGPDFContextMediaBox as String: pageBox] as CFDictionary)

  let imageRect = CGRect(origin: .zero, size: bounds.size)
  if let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) {
    pdfContext.draw(cgImage, in: imageRect)
  }

  pdfContext.endPDFPage()
}

pdfContext.closePDF()

print("Redacted PDF written to: \(outputPDFURL.path)")
print("Redacted PNG written to: \(outputPNGURL.path)")
print("Preview written to: \(previewPNGURL.path)")
