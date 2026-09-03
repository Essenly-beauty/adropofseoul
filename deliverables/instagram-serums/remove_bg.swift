import Foundation
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
    fputs("usage: remove_bg input output\n", stderr)
    exit(1)
}

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
guard let source = CGImageSourceCreateWithURL(input as CFURL, nil),
      let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else { exit(2) }

let w = image.width, h = image.height, stride = w * 4
var pixels = [UInt8](repeating: 0, count: stride * h)
let cs = CGColorSpaceCreateDeviceRGB()
guard let ctx = CGContext(data: &pixels, width: w, height: h, bitsPerComponent: 8,
                          bytesPerRow: stride, space: cs,
                          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { exit(3) }
ctx.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))

func backgroundLike(_ i: Int) -> Bool {
    let r = Int(pixels[i]), g = Int(pixels[i+1]), b = Int(pixels[i+2])
    let hi = max(r, max(g,b)), lo = min(r, min(g,b))
    return hi > 208 && hi - lo < 28
}

var seen = [Bool](repeating: false, count: w * h)
var queue = [Int](); queue.reserveCapacity(w * 2 + h * 2)
func seed(_ x: Int, _ y: Int) {
    let p = y * w + x, i = y * stride + x * 4
    if !seen[p] && backgroundLike(i) { seen[p] = true; queue.append(p) }
}
for x in 0..<w { seed(x,0); seed(x,h-1) }
for y in 0..<h { seed(0,y); seed(w-1,y) }

var q = 0
while q < queue.count {
    let p = queue[q]; q += 1
    let x = p % w, y = p / w
    if x > 0 { seed(x-1,y) }; if x+1 < w { seed(x+1,y) }
    if y > 0 { seed(x,y-1) }; if y+1 < h { seed(x,y+1) }
}
for p in 0..<seen.count where seen[p] { pixels[(p / w) * stride + (p % w) * 4 + 3] = 0 }

guard let outCtx = CGContext(data: &pixels, width: w, height: h, bitsPerComponent: 8,
                             bytesPerRow: stride, space: cs,
                             bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
      let outImage = outCtx.makeImage(),
      let destination = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil) else { exit(4) }
CGImageDestinationAddImage(destination, outImage, nil)
guard CGImageDestinationFinalize(destination) else { exit(5) }
