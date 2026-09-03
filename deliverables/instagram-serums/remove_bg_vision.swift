import Foundation
import Vision
import CoreImage

guard CommandLine.arguments.count == 3 else { exit(1) }
let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
guard let input = CIImage(contentsOf: inputURL) else { exit(2) }

let request = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: input)
try handler.perform([request])
guard let observation = request.results?.first else { exit(3) }
let maskBuffer = try observation.generateScaledMaskForImage(
  forInstances: observation.allInstances,
  from: handler
)
let mask = CIImage(cvPixelBuffer: maskBuffer)
let clear = CIImage(color: .clear).cropped(to: input.extent)
let result = input.applyingFilter("CIBlendWithMask", parameters: [
  kCIInputBackgroundImageKey: clear,
  kCIInputMaskImageKey: mask
])
let context = CIContext(options: [.useSoftwareRenderer: false])
let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
try context.writePNGRepresentation(of: result, to: outputURL, format: .RGBA8, colorSpace: colorSpace)
