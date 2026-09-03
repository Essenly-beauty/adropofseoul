#import <Foundation/Foundation.h>
#import <Vision/Vision.h>
#import <CoreImage/CoreImage.h>

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    if (argc != 3) return 1;
    NSURL *inputURL = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[1]]];
    NSURL *outputURL = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[2]]];
    CIImage *input = [CIImage imageWithContentsOfURL:inputURL];
    if (!input) return 2;
    VNGenerateForegroundInstanceMaskRequest *request = [VNGenerateForegroundInstanceMaskRequest new];
    VNImageRequestHandler *handler = [[VNImageRequestHandler alloc] initWithCIImage:input options:@{}];
    NSError *error = nil;
    if (![handler performRequests:@[request] error:&error]) return 3;
    VNInstanceMaskObservation *observation = request.results.firstObject;
    if (!observation) return 4;
    CVPixelBufferRef buffer = [observation generateScaledMaskForImageForInstances:observation.allInstances
                                                               fromRequestHandler:handler
                                                                            error:&error];
    if (!buffer) return 5;
    CIImage *mask = [CIImage imageWithCVPixelBuffer:buffer];
    CIImage *clear = [[CIImage imageWithColor:[CIColor colorWithRed:0 green:0 blue:0 alpha:0]] imageByCroppingToRect:input.extent];
    CIFilter *blend = [CIFilter filterWithName:@"CIBlendWithMask"];
    [blend setValue:input forKey:kCIInputImageKey];
    [blend setValue:clear forKey:kCIInputBackgroundImageKey];
    [blend setValue:mask forKey:kCIInputMaskImageKey];
    CIImage *result = blend.outputImage;
    CIContext *context = [CIContext contextWithOptions:nil];
    CGColorSpaceRef cs = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    BOOL ok = [context writePNGRepresentationOfImage:result toURL:outputURL format:kCIFormatRGBA8 colorSpace:cs options:@{} error:&error];
    CGColorSpaceRelease(cs);
    CFRelease(buffer);
    return ok ? 0 : 6;
  }
}
