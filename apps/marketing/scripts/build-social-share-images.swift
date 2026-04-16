import AppKit
import Foundation

struct CardSpec {
  let outputURL: URL
  let badge: String
  let title: String
  let body: String
  let pills: [String]
  let footer: String
  let warmAccent: Bool
}

let canvasSize = NSSize(width: 1200, height: 630)
let logoURL = URL(fileURLWithPath: "/Users/anthonyjones/Web Design/Designed by Anthony/src/assets/FullLogo.png")
let outputDirectory = URL(fileURLWithPath: "/Users/anthonyjones/Web Design/Designed by Anthony/public/images")

let cards = [
  CardSpec(
    outputURL: outputDirectory.appendingPathComponent("og-site-premium.png"),
    badge: "FOUNDER OFFER",
    title: "Premium websites for service businesses.",
    body: "10 approved brands get a complimentary custom build when they join the $100/mo growth plan.",
    pills: [
      "Google, Yelp and referral traffic",
      "10 local launch spots",
      "Built for trust, speed and calls",
    ],
    footer: "designedbyanthony.com",
    warmAccent: true
  ),
  CardSpec(
    outputURL: outputDirectory.appendingPathComponent("og-facebook-offer-premium.png"),
    badge: "INVITE ONLY",
    title: "Private Facebook Offer.",
    body: "$500 custom website build with the first 3 months of local SEO included. Reserved for direct outreach.",
    pills: [
      "Direct outreach only",
      "Founder-led reply",
      "Cleaner destination after the click",
    ],
    footer: "designedbyanthony.com/facebook-offer",
    warmAccent: false
  ),
]

let white = NSColor(calibratedRed: 0.95, green: 0.97, blue: 1.00, alpha: 1.0)
let softWhite = NSColor(calibratedRed: 0.83, green: 0.88, blue: 0.95, alpha: 1.0)
let muted = NSColor(calibratedRed: 0.56, green: 0.64, blue: 0.76, alpha: 1.0)
let lineColor = NSColor(calibratedRed: 0.58, green: 0.76, blue: 0.99, alpha: 0.18)
let blueA = NSColor(calibratedRed: 0.04, green: 0.08, blue: 0.15, alpha: 1.0)
let blueB = NSColor(calibratedRed: 0.06, green: 0.11, blue: 0.19, alpha: 1.0)
let blueC = NSColor(calibratedRed: 0.09, green: 0.15, blue: 0.27, alpha: 1.0)
let accentBlue = NSColor(calibratedRed: 0.35, green: 0.64, blue: 0.98, alpha: 1.0)
let badgeBlue = NSColor(calibratedRed: 0.76, green: 0.87, blue: 1.0, alpha: 1.0)
let badgeWarm = NSColor(calibratedRed: 0.96, green: 0.84, blue: 0.55, alpha: 1.0)
let pillFill = NSColor(calibratedRed: 1.0, green: 1.0, blue: 1.0, alpha: 0.05)
let pillStroke = NSColor(calibratedRed: 0.58, green: 0.76, blue: 0.99, alpha: 0.18)
let panelFill = NSColor(calibratedRed: 0.05, green: 0.08, blue: 0.14, alpha: 0.6)

func paragraphStyle(alignment: NSTextAlignment = .left, lineHeight: CGFloat? = nil) -> NSMutableParagraphStyle {
  let style = NSMutableParagraphStyle()
  style.alignment = alignment
  if let lineHeight {
    style.minimumLineHeight = lineHeight
    style.maximumLineHeight = lineHeight
  }
  return style
}

func drawRoundedRect(_ rect: CGRect, radius: CGFloat, fill: NSColor, stroke: NSColor? = nil, lineWidth: CGFloat = 1) {
  let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
  fill.setFill()
  path.fill()

  if let stroke {
    stroke.setStroke()
    path.lineWidth = lineWidth
    path.stroke()
  }
}

func drawGlow(in rect: CGRect, color: NSColor) {
  let path = NSBezierPath(ovalIn: rect)
  color.setFill()
  path.fill()
}

func drawText(_ text: String, rect: CGRect, font: NSFont, color: NSColor, lineHeight: CGFloat? = nil, alignment: NSTextAlignment = .left) {
  let attributes: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: color,
    .paragraphStyle: paragraphStyle(alignment: alignment, lineHeight: lineHeight),
  ]

  let attributed = NSAttributedString(string: text, attributes: attributes)
  attributed.draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading])
}

func pngData(from image: NSImage) -> Data? {
  guard let tiff = image.tiffRepresentation,
        let rep = NSBitmapImageRep(data: tiff) else {
    return nil
  }

  return rep.representation(using: .png, properties: [:])
}

let logoImage = NSImage(contentsOf: logoURL)

func renderCard(spec: CardSpec) throws {
  let image = NSImage(size: canvasSize)
  image.lockFocus()

  guard let context = NSGraphicsContext.current?.cgContext else {
    throw NSError(domain: "share-card", code: 1, userInfo: [NSLocalizedDescriptionKey: "Unable to create graphics context"])
  }

  let background = NSGradient(colors: [blueA, blueB, blueC])!
  background.draw(in: NSRect(origin: .zero, size: canvasSize), angle: 25)

  drawGlow(
    in: CGRect(x: -70, y: 330, width: 360, height: 360),
    color: NSColor(calibratedRed: 0.22, green: 0.51, blue: 0.98, alpha: 0.24)
  )
  drawGlow(
    in: CGRect(x: 850, y: -90, width: 320, height: 320),
    color: NSColor(calibratedRed: 0.06, green: 0.78, blue: 0.99, alpha: 0.16)
  )

  let shellRect = CGRect(x: 42, y: 42, width: 1116, height: 546)
  drawRoundedRect(
    shellRect,
    radius: 34,
    fill: NSColor(calibratedRed: 0.03, green: 0.05, blue: 0.09, alpha: 0.56),
    stroke: lineColor,
    lineWidth: 2
  )

  if let logoImage {
    let logoRect = CGRect(x: 86, y: 470, width: 108, height: 94)
    logoImage.draw(in: logoRect)
  }

  drawText(
    "DESIGNED BY ANTHONY",
    rect: CGRect(x: 208, y: 515, width: 400, height: 26),
    font: NSFont.systemFont(ofSize: 18, weight: .bold),
    color: badgeBlue
  )
  drawText(
    "Performance-first web studio",
    rect: CGRect(x: 208, y: 488, width: 360, height: 22),
    font: NSFont.systemFont(ofSize: 16, weight: .medium),
    color: muted
  )

  let badgeWidth = CGFloat(min(max(spec.badge.count * 12, 150), 280))
  let badgeRect = CGRect(x: shellRect.maxX - badgeWidth - 38, y: 490, width: badgeWidth, height: 42)
  drawRoundedRect(
    badgeRect,
    radius: 21,
    fill: spec.warmAccent
      ? NSColor(calibratedRed: 0.99, green: 0.80, blue: 0.49, alpha: 0.16)
      : NSColor(calibratedRed: 0.35, green: 0.64, blue: 0.98, alpha: 0.14),
    stroke: spec.warmAccent
      ? NSColor(calibratedRed: 0.99, green: 0.80, blue: 0.49, alpha: 0.34)
      : NSColor(calibratedRed: 0.58, green: 0.76, blue: 0.99, alpha: 0.30),
    lineWidth: 1.5
  )
  drawText(
    spec.badge,
    rect: badgeRect.insetBy(dx: 18, dy: 10),
    font: NSFont.systemFont(ofSize: 15, weight: .bold),
    color: spec.warmAccent ? badgeWarm : badgeBlue,
    lineHeight: 18,
    alignment: .center
  )

  context.setFillColor(panelFill.cgColor)
  let dividerRect = CGRect(x: 86, y: 448, width: 1028, height: 1)
  context.fill(dividerRect)

  drawText(
    spec.title,
    rect: CGRect(x: 86, y: 248, width: 760, height: 180),
    font: NSFont.systemFont(ofSize: 72, weight: .bold),
    color: white,
    lineHeight: 74
  )

  drawText(
    spec.body,
    rect: CGRect(x: 90, y: 150, width: 760, height: 92),
    font: NSFont.systemFont(ofSize: 28, weight: .regular),
    color: softWhite,
    lineHeight: 40
  )

  var pillX: CGFloat = 90
  let pillY: CGFloat = 94
  for pill in spec.pills {
    let pillWidth = CGFloat(min(max(pill.count * 11, 180), 340))
    let pillRect = CGRect(x: pillX, y: pillY, width: pillWidth, height: 42)
    drawRoundedRect(pillRect, radius: 21, fill: pillFill, stroke: pillStroke, lineWidth: 1.3)
    drawText(
      pill,
      rect: pillRect.insetBy(dx: 16, dy: 10),
      font: NSFont.systemFont(ofSize: 15, weight: .semibold),
      color: white,
      lineHeight: 18,
      alignment: .center
    )
    pillX += pillWidth + 12
  }

  drawText(
    spec.footer,
    rect: CGRect(x: 90, y: 58, width: 420, height: 22),
    font: NSFont.systemFont(ofSize: 17, weight: .medium),
    color: muted
  )

  let accentRect = CGRect(x: 880, y: 146, width: 210, height: 210)
  drawRoundedRect(
    accentRect,
    radius: 42,
    fill: NSColor(calibratedRed: 1.0, green: 1.0, blue: 1.0, alpha: 0.03),
    stroke: lineColor,
    lineWidth: 1.5
  )

  drawText(
    spec.warmAccent ? "Founding Spots" : "Private Offer",
    rect: CGRect(x: 914, y: 312, width: 144, height: 24),
    font: NSFont.systemFont(ofSize: 16, weight: .semibold),
    color: spec.warmAccent ? badgeWarm : badgeBlue,
    lineHeight: 20,
    alignment: .center
  )
  drawText(
    spec.warmAccent ? "10" : "$500",
    rect: CGRect(x: 900, y: 224, width: 170, height: 76),
    font: NSFont.systemFont(ofSize: spec.warmAccent ? 62 : 58, weight: .bold),
    color: white,
    lineHeight: spec.warmAccent ? 64 : 60,
    alignment: .center
  )
  drawText(
    spec.warmAccent ? "$100/mo growth" : "Invite-only",
    rect: CGRect(x: 908, y: 184, width: 154, height: 36),
    font: NSFont.systemFont(ofSize: 18, weight: .medium),
    color: softWhite,
    lineHeight: 24,
    alignment: .center
  )

  image.unlockFocus()

  guard let data = pngData(from: image) else {
    throw NSError(domain: "share-card", code: 2, userInfo: [NSLocalizedDescriptionKey: "Unable to encode PNG"])
  }

  try data.write(to: spec.outputURL)
}

for card in cards {
  try renderCard(spec: card)
  print("Wrote \(card.outputURL.path)")
}
