import AppKit
import CoreGraphics
import Foundation
import PDFKit

let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792)

let outputURL = URL(fileURLWithPath: "/Users/anthonyjones/Downloads/sample-audit-report-local.pdf")
let previewDir = URL(fileURLWithPath: "/tmp/sample_audit_preview", isDirectory: true)
let sourceAuditURL = URL(fileURLWithPath: "/Users/anthonyjones/Downloads/report-redacted-draft.pdf")
let logoURL = URL(fileURLWithPath: "/Users/anthonyjones/Web Design/Designed by Anthony/src/assets/FullLogo.png")

let bg = NSColor(calibratedRed: 0.04, green: 0.07, blue: 0.12, alpha: 1)
let bgAlt = NSColor(calibratedRed: 0.06, green: 0.10, blue: 0.16, alpha: 1)
let card = NSColor(calibratedRed: 0.08, green: 0.13, blue: 0.20, alpha: 1)
let cardSoft = NSColor(calibratedRed: 0.10, green: 0.16, blue: 0.25, alpha: 1)
let accent = NSColor(calibratedRed: 0.23, green: 0.51, blue: 0.96, alpha: 1)
let accentSoft = NSColor(calibratedRed: 0.58, green: 0.77, blue: 0.99, alpha: 1)
let text = NSColor.white
let muted = NSColor(calibratedRed: 0.77, green: 0.82, blue: 0.89, alpha: 1)
let subtle = NSColor(calibratedRed: 0.58, green: 0.65, blue: 0.74, alpha: 1)
let warning = NSColor(calibratedRed: 1.00, green: 0.66, blue: 0.20, alpha: 1)
let success = NSColor(calibratedRed: 0.20, green: 0.78, blue: 0.45, alpha: 1)

struct Metric {
  let label: String
  let value: String
  let tone: NSColor
}

struct Finding {
  let title: String
  let body: String
}

struct RoadmapItem {
  let step: String
  let title: String
  let body: String
}

func ensureDirectory(_ url: URL) throws {
  try? FileManager.default.removeItem(at: url)
  try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
}

func drawRoundedRect(_ rect: CGRect, radius: CGFloat, color: NSColor) {
  color.setFill()
  let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
  path.fill()
}

func drawStrokeRect(_ rect: CGRect, radius: CGFloat, color: NSColor, lineWidth: CGFloat = 1) {
  color.setStroke()
  let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
  path.lineWidth = lineWidth
  path.stroke()
}

func drawText(
  _ value: String,
  in rect: CGRect,
  font: NSFont,
  color: NSColor,
  alignment: NSTextAlignment = .left,
  lineHeight: CGFloat? = nil
) {
  let paragraph = NSMutableParagraphStyle()
  paragraph.alignment = alignment
  if let lineHeight {
    paragraph.minimumLineHeight = lineHeight
    paragraph.maximumLineHeight = lineHeight
  }

  let attributes: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: color,
    .paragraphStyle: paragraph,
  ]

  let attributed = NSAttributedString(string: value, attributes: attributes)
  attributed.draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading])
}

func drawPill(_ value: String, in rect: CGRect, fill: NSColor, stroke: NSColor, textColor: NSColor) {
  drawRoundedRect(rect, radius: rect.height / 2, color: fill)
  drawStrokeRect(rect, radius: rect.height / 2, color: stroke)
  drawText(
    value,
    in: rect.insetBy(dx: 12, dy: 7),
    font: NSFont.systemFont(ofSize: 10, weight: .bold),
    color: textColor,
    alignment: .center
  )
}

func drawMetricCard(_ metric: Metric, in rect: CGRect) {
  drawRoundedRect(rect, radius: 22, color: card)
  drawStrokeRect(rect, radius: 22, color: NSColor.white.withAlphaComponent(0.08))
  drawText(metric.label.uppercased(), in: CGRect(x: rect.minX + 18, y: rect.maxY - 28, width: rect.width - 36, height: 12), font: NSFont.systemFont(ofSize: 10, weight: .bold), color: subtle)
  drawText(metric.value, in: CGRect(x: rect.minX + 18, y: rect.minY + 28, width: rect.width - 36, height: 34), font: NSFont.systemFont(ofSize: 26, weight: .heavy), color: metric.tone)
}

func drawFindingCard(_ finding: Finding, in rect: CGRect) {
  drawRoundedRect(rect, radius: 20, color: cardSoft)
  drawStrokeRect(rect, radius: 20, color: NSColor.white.withAlphaComponent(0.06))
  drawText(finding.title, in: CGRect(x: rect.minX + 18, y: rect.maxY - 62, width: rect.width - 36, height: 34), font: NSFont.systemFont(ofSize: 15, weight: .semibold), color: text, lineHeight: 18)
  drawText(finding.body, in: CGRect(x: rect.minX + 18, y: rect.minY + 18, width: rect.width - 36, height: rect.height - 98), font: NSFont.systemFont(ofSize: 11.2, weight: .regular), color: muted, lineHeight: 16)
}

func drawRoadmapItem(_ item: RoadmapItem, in rect: CGRect) {
  drawRoundedRect(rect, radius: 18, color: card)
  drawStrokeRect(rect, radius: 18, color: NSColor.white.withAlphaComponent(0.06))

  let badge = CGRect(x: rect.minX + 18, y: rect.maxY - 42, width: 34, height: 22)
  drawPill(item.step, in: badge, fill: accent.withAlphaComponent(0.16), stroke: accent.withAlphaComponent(0.30), textColor: accentSoft)
  drawText(item.title, in: CGRect(x: rect.minX + 18, y: rect.maxY - 92, width: rect.width - 36, height: 40), font: NSFont.systemFont(ofSize: 14.5, weight: .semibold), color: text, lineHeight: 18)
  drawText(item.body, in: CGRect(x: rect.minX + 18, y: rect.minY + 18, width: rect.width - 36, height: rect.height - 124), font: NSFont.systemFont(ofSize: 11.2, weight: .regular), color: muted, lineHeight: 16)
}

func drawImageAspectFit(_ image: NSImage, in rect: CGRect) {
  let imageSize = image.size
  guard imageSize.width > 0, imageSize.height > 0 else { return }

  let scale = min(rect.width / imageSize.width, rect.height / imageSize.height)
  let drawSize = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
  let drawRect = CGRect(
    x: rect.midX - drawSize.width / 2,
    y: rect.midY - drawSize.height / 2,
    width: drawSize.width,
    height: drawSize.height
  )
  image.draw(in: drawRect)
}

func drawDivider(y: CGFloat) {
  let path = NSBezierPath()
  path.move(to: CGPoint(x: 48, y: y))
  path.line(to: CGPoint(x: pageRect.width - 48, y: y))
  NSColor.white.withAlphaComponent(0.08).setStroke()
  path.lineWidth = 1
  path.stroke()
}

func renderSourcePage(_ pageNumber: Int, scale: CGFloat = 1.5) -> NSImage? {
  guard let source = PDFDocument(url: sourceAuditURL),
        let page = source.page(at: pageNumber - 1) else {
    return nil
  }

  let bounds = page.bounds(for: .mediaBox)
  let pxWidth = Int(bounds.width * scale)
  let pxHeight = Int(bounds.height * scale)
  guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: pxWidth,
    pixelsHigh: pxHeight,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  ),
    let nsContext = NSGraphicsContext(bitmapImageRep: rep) else {
    return nil
  }

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = nsContext
  let ctx = nsContext.cgContext
  NSColor.white.setFill()
  ctx.fill(CGRect(x: 0, y: 0, width: pxWidth, height: pxHeight))
  ctx.saveGState()
  ctx.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: ctx)
  ctx.restoreGState()
  NSGraphicsContext.restoreGraphicsState()

  let image = NSImage(size: NSSize(width: pxWidth, height: pxHeight))
  image.addRepresentation(rep)
  return image
}

func savePreview(_ pdf: PDFDocument, pageNumber: Int, to url: URL) {
  guard let page = pdf.page(at: pageNumber - 1) else { return }
  let bounds = page.bounds(for: .mediaBox)
  let scale: CGFloat = 1.5
  let pxWidth = Int(bounds.width * scale)
  let pxHeight = Int(bounds.height * scale)

  guard let rep = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: pxWidth,
    pixelsHigh: pxHeight,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  ),
    let nsContext = NSGraphicsContext(bitmapImageRep: rep) else {
    return
  }

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = nsContext
  let ctx = nsContext.cgContext
  NSColor.white.setFill()
  ctx.fill(CGRect(x: 0, y: 0, width: pxWidth, height: pxHeight))
  ctx.saveGState()
  ctx.scaleBy(x: scale, y: scale)
  page.draw(with: .mediaBox, to: ctx)
  ctx.restoreGState()
  NSGraphicsContext.restoreGraphicsState()

  if let data = rep.representation(using: .png, properties: [:]) {
    try? data.write(to: url)
  }
}

let metrics = [
  Metric(label: "Performance", value: "73", tone: warning),
  Metric(label: "Accessibility", value: "75", tone: warning),
  Metric(label: "Best Practices", value: "92", tone: success),
  Metric(label: "SEO", value: "92", tone: success),
]

let findings = [
  Finding(
    title: "Technical bloat slows the first impression",
    body: "The site works, but it carries the weight you expect from a plugin-heavy builder stack. Large media files, render-blocking resources, and extra JavaScript slow the first impression."
  ),
  Finding(
    title: "Largest Contentful Paint is the biggest issue",
    body: "Largest Contentful Paint lands at 6.3 seconds, well outside the healthy target under 2.5. Image delivery plus heavy CSS and JavaScript are doing most of the damage."
  ),
  Finding(
    title: "The audit goes beyond speed alone",
    body: "The audit also surfaces accessibility and search issues: weak contrast, missing labels, heading-order problems, and no meta description."
  ),
]

let roadmap = [
  RoadmapItem(
    step: "01",
    title: "Replace oversized media with responsive formats",
    body: "Serve WebP or AVIF where possible, size images to the actual viewport, and stop sending desktop-scale media to small screens."
  ),
  RoadmapItem(
    step: "02",
    title: "Remove non-critical CSS and fonts from the critical path",
    body: "Inline what the first screen needs, defer secondary styles, and keep custom fonts from blocking the first render."
  ),
  RoadmapItem(
    step: "03",
    title: "Cut unused JavaScript and lighten main-thread work",
    body: "Trim page-level script loading, reduce plugin overhead, and make sure interactive code only runs where it adds value."
  ),
  RoadmapItem(
    step: "04",
    title: "Close accessibility and SEO gaps together",
    body: "Improve color contrast, label interactive elements clearly, fix heading order, and ship a stronger meta description."
  ),
]

func startPage(_ context: CGContext) {
  let mediaBox = pageRect
  context.beginPDFPage([kCGPDFContextMediaBox as String: mediaBox] as CFDictionary)
  let graphicsContext = NSGraphicsContext(cgContext: context, flipped: false)
  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = graphicsContext
  drawRoundedRect(pageRect, radius: 0, color: bg)
}

func finishPage(_ context: CGContext) {
  NSGraphicsContext.restoreGraphicsState()
  context.endPDFPage()
}

try? FileManager.default.removeItem(at: outputURL)
try ensureDirectory(previewDir)

guard let consumer = CGDataConsumer(url: outputURL as CFURL) else {
  fatalError("Could not create data consumer")
}

var mediaBox = pageRect
guard let context = CGContext(
  consumer: consumer,
  mediaBox: &mediaBox,
  [
    kCGPDFContextTitle as String: "Designed by Anthony Sample Audit Report",
    kCGPDFContextCreator as String: "Designed by Anthony",
    kCGPDFContextAuthor as String: "Designed by Anthony",
  ] as CFDictionary
) else {
  fatalError("Could not create PDF context")
}

let logo = NSImage(contentsOf: logoURL)

// Cover page
startPage(context)
drawRoundedRect(CGRect(x: 32, y: 32, width: pageRect.width - 64, height: pageRect.height - 64), radius: 34, color: bgAlt)
drawStrokeRect(CGRect(x: 32, y: 32, width: pageRect.width - 64, height: pageRect.height - 64), radius: 34, color: NSColor.white.withAlphaComponent(0.08))
drawPill("Sample Audit", in: CGRect(x: 54, y: 696, width: 106, height: 28), fill: accent.withAlphaComponent(0.14), stroke: accent.withAlphaComponent(0.30), textColor: accentSoft)
if let logo {
  drawImageAspectFit(logo, in: CGRect(x: 54, y: 588, width: 250, height: 82))
}
drawText("Website Audit Sample Report", in: CGRect(x: 54, y: 500, width: 500, height: 72), font: NSFont.systemFont(ofSize: 34, weight: .heavy), color: text)
drawText(
  "A branded example of how Designed by Anthony can package performance, accessibility, SEO, and stack findings into a clear, usable report.",
  in: CGRect(x: 54, y: 426, width: 500, height: 74),
  font: NSFont.systemFont(ofSize: 14.5, weight: .regular),
  color: muted,
  lineHeight: 22
)
let scopePills = [
  "BuiltWith stack review",
  "Lighthouse evidence",
  "Accessibility notes",
  "Prioritized roadmap",
]
for (index, item) in scopePills.enumerated() {
  let x = 54 + CGFloat(index % 2) * 210
  let y = 352 - CGFloat(index / 2) * 42
  drawPill(item, in: CGRect(x: x, y: y, width: 188, height: 28), fill: NSColor.white.withAlphaComponent(0.05), stroke: NSColor.white.withAlphaComponent(0.08), textColor: muted)
}
drawRoundedRect(CGRect(x: 54, y: 104, width: 504, height: 166), radius: 24, color: card)
drawStrokeRect(CGRect(x: 54, y: 104, width: 504, height: 166), radius: 24, color: NSColor.white.withAlphaComponent(0.06))
drawText("What this sample is", in: CGRect(x: 78, y: 224, width: 240, height: 24), font: NSFont.systemFont(ofSize: 17, weight: .semibold), color: text)
drawText(
  "This document uses a real redacted audit as source material, but it is reframed as a clean sample deliverable. Client identity, URLs, asset names, and tracking details have been removed so the focus stays on the quality of the audit itself.",
  in: CGRect(x: 78, y: 128, width: 456, height: 88),
  font: NSFont.systemFont(ofSize: 12.5, weight: .regular),
  color: muted,
  lineHeight: 19
)
drawText("Designed by Anthony", in: CGRect(x: 54, y: 58, width: 250, height: 18), font: NSFont.systemFont(ofSize: 11.5, weight: .semibold), color: accentSoft)
drawText("Local draft only • not for public use yet", in: CGRect(x: 312, y: 58, width: 246, height: 18), font: NSFont.systemFont(ofSize: 11.5, weight: .regular), color: subtle, alignment: .right)
finishPage(context)

// Executive summary page
startPage(context)
drawText("Executive Summary", in: CGRect(x: 48, y: 718, width: 300, height: 34), font: NSFont.systemFont(ofSize: 28, weight: .heavy), color: text)
drawText(
  "This sample site scores reasonably well in best practices and SEO, but performance and accessibility are held back by the kind of technical drag we often see in template-driven WordPress builds.",
  in: CGRect(x: 48, y: 650, width: 516, height: 66),
  font: NSFont.systemFont(ofSize: 13, weight: .regular),
  color: muted,
  lineHeight: 19
)

for (index, metric) in metrics.enumerated() {
  let x = 48 + CGFloat(index % 2) * 258
  let y = 510 - CGFloat(index / 2) * 116
  drawMetricCard(metric, in: CGRect(x: x, y: y, width: 234, height: 92))
}

drawText("Why it matters", in: CGRect(x: 48, y: 360, width: 220, height: 24), font: NSFont.systemFont(ofSize: 17, weight: .semibold), color: text)
drawText(
  "A slow first paint and a weak Largest Contentful Paint delay trust. On a real service-business page, that usually means more bounces, fewer calls, and a site that feels less credible before the content can do its job.",
  in: CGRect(x: 48, y: 286, width: 516, height: 70),
  font: NSFont.systemFont(ofSize: 12.5, weight: .regular),
  color: muted,
  lineHeight: 19
)

let findingRects = [
  CGRect(x: 48, y: 100, width: 164, height: 160),
  CGRect(x: 224, y: 100, width: 164, height: 160),
  CGRect(x: 400, y: 100, width: 164, height: 160),
]

for (rect, finding) in zip(findingRects, findings) {
  drawFindingCard(finding, in: rect)
}
drawText("Sample client details redacted", in: CGRect(x: 48, y: 78, width: 240, height: 16), font: NSFont.systemFont(ofSize: 11, weight: .semibold), color: accentSoft)
drawText("Metrics and observations preserved to show the audit style, not the client identity.", in: CGRect(x: 48, y: 58, width: 460, height: 16), font: NSFont.systemFont(ofSize: 10.5, weight: .regular), color: subtle)
finishPage(context)

// Roadmap page
startPage(context)
drawText("Priority Roadmap", in: CGRect(x: 48, y: 718, width: 300, height: 34), font: NSFont.systemFont(ofSize: 28, weight: .heavy), color: text)
drawText(
  "The strongest audits do more than list issues. They turn the messy details into a practical order of operations the client can understand and act on.",
  in: CGRect(x: 48, y: 650, width: 510, height: 60),
  font: NSFont.systemFont(ofSize: 13, weight: .regular),
  color: muted,
  lineHeight: 19
)
let roadmapRects = [
  CGRect(x: 48, y: 422, width: 248, height: 184),
  CGRect(x: 316, y: 422, width: 248, height: 184),
  CGRect(x: 48, y: 222, width: 248, height: 184),
  CGRect(x: 316, y: 222, width: 248, height: 184),
]
for (rect, item) in zip(roadmapRects, roadmap) {
  drawRoadmapItem(item, in: rect)
}

drawRoundedRect(CGRect(x: 48, y: 72, width: 516, height: 126), radius: 22, color: cardSoft)
drawStrokeRect(CGRect(x: 48, y: 72, width: 516, height: 126), radius: 22, color: NSColor.white.withAlphaComponent(0.06))
drawText("What the deliverable communicates", in: CGRect(x: 70, y: 152, width: 300, height: 24), font: NSFont.systemFont(ofSize: 16, weight: .semibold), color: text)
drawText(
  "1. The site has real, measurable bottlenecks.\n2. The issues are understandable without technical jargon overload.\n3. The next move is clear, prioritized, and tied to likely gains.",
  in: CGRect(x: 70, y: 92, width: 470, height: 52),
  font: NSFont.systemFont(ofSize: 12.5, weight: .regular),
  color: muted,
  lineHeight: 18
)
finishPage(context)

// Appendix intro page
startPage(context)
drawText("Technical Evidence Appendix", in: CGRect(x: 48, y: 718, width: 360, height: 34), font: NSFont.systemFont(ofSize: 28, weight: .heavy), color: text)
drawText(
  "The following pages are trimmed from the underlying Lighthouse export after redaction and flattening. They exist here to prove the audit is grounded in real evidence, not to force the reader through every raw diagnostic screen.",
  in: CGRect(x: 48, y: 640, width: 520, height: 72),
  font: NSFont.systemFont(ofSize: 13, weight: .regular),
  color: muted,
  lineHeight: 19
)
drawRoundedRect(CGRect(x: 48, y: 488, width: 516, height: 126), radius: 22, color: card)
drawStrokeRect(CGRect(x: 48, y: 488, width: 516, height: 126), radius: 22, color: NSColor.white.withAlphaComponent(0.06))
drawText("Appendix notes", in: CGRect(x: 70, y: 572, width: 180, height: 22), font: NSFont.systemFont(ofSize: 16, weight: .semibold), color: text)
drawText(
  "Client-specific details were removed and the source PDF was flattened so hidden text cannot be extracted. The screenshots are here to support the narrative, not replace it.",
  in: CGRect(x: 70, y: 516, width: 470, height: 56),
  font: NSFont.systemFont(ofSize: 12.5, weight: .regular),
  color: muted,
  lineHeight: 18
)

let appendixList = [
  "Score overview and top-level metrics",
  "Image-delivery findings",
  "Network and JavaScript dependency evidence",
  "Unused CSS and large network payloads",
  "Representative technical appendix pages only",
]

for (index, item) in appendixList.enumerated() {
  let y = 426 - CGFloat(index) * 44
  drawPill(String(format: "%02d", index + 1), in: CGRect(x: 48, y: y + 6, width: 34, height: 22), fill: accent.withAlphaComponent(0.14), stroke: accent.withAlphaComponent(0.28), textColor: accentSoft)
  drawText(item, in: CGRect(x: 94, y: y, width: 440, height: 22), font: NSFont.systemFont(ofSize: 13.2, weight: .medium), color: text)
}

drawRoundedRect(CGRect(x: 48, y: 78, width: 516, height: 112), radius: 22, color: cardSoft)
drawStrokeRect(CGRect(x: 48, y: 78, width: 516, height: 112), radius: 22, color: NSColor.white.withAlphaComponent(0.06))
drawText("For the website later", in: CGRect(x: 70, y: 146, width: 200, height: 22), font: NSFont.systemFont(ofSize: 16, weight: .semibold), color: text)
drawText(
  "This appendix is stronger as proof behind a sample audit section than as a downloadable raw report. On-page, it can be paired with polished summary cards and a simple benchmark panel for your own site.",
  in: CGRect(x: 70, y: 92, width: 470, height: 52),
  font: NSFont.systemFont(ofSize: 12.5, weight: .regular),
  color: muted,
  lineHeight: 18
)
finishPage(context)

let appendixPages = [
  (1, "Score overview"),
  (2, "Image delivery evidence"),
  (3, "Network dependency evidence"),
  (5, "Unused JavaScript overview"),
  (6, "Main-thread and script execution detail"),
  (7, "Unused CSS and long task evidence"),
  (12, "Large network payloads and WordPress overhead"),
]

for (pageNumber, caption) in appendixPages {
  startPage(context)
  drawText("Appendix", in: CGRect(x: 48, y: 728, width: 120, height: 18), font: NSFont.systemFont(ofSize: 11.5, weight: .bold), color: accentSoft)
  drawText(caption, in: CGRect(x: 48, y: 696, width: 420, height: 28), font: NSFont.systemFont(ofSize: 22, weight: .heavy), color: text)
  drawText("Redacted Lighthouse evidence page", in: CGRect(x: 48, y: 674, width: 220, height: 16), font: NSFont.systemFont(ofSize: 10.5, weight: .regular), color: subtle)
  drawDivider(y: 652)

  drawRoundedRect(CGRect(x: 48, y: 72, width: 516, height: 558), radius: 22, color: NSColor.white)
  drawStrokeRect(CGRect(x: 48, y: 72, width: 516, height: 558), radius: 22, color: NSColor.white.withAlphaComponent(0.05))

  if let image = renderSourcePage(pageNumber) {
    drawImageAspectFit(image, in: CGRect(x: 62, y: 88, width: 488, height: 526))
  }
  finishPage(context)
}

context.closePDF()

if let pdf = PDFDocument(url: outputURL) {
  for pageNumber in 1...min(pdf.pageCount, 4) {
    let previewURL = previewDir.appendingPathComponent("page_\(pageNumber).png")
    savePreview(pdf, pageNumber: pageNumber, to: previewURL)
    print(previewURL.path)
  }
}

print(outputURL.path)
