#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>
#import <ImageIO/ImageIO.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>

int main(int argc, const char *argv[]) {
  @autoreleasepool {
    if (argc != 3) return 1;
    NSURL *inURL = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[1]]];
    NSURL *outURL = [NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[2]]];
    CGImageSourceRef src = CGImageSourceCreateWithURL((__bridge CFURLRef)inURL, NULL);
    CGImageRef img = CGImageSourceCreateImageAtIndex(src, 0, NULL);
    size_t w = CGImageGetWidth(img), h = CGImageGetHeight(img), stride = w * 4;
    uint8_t *px = calloc(h, stride), *seen = calloc(w*h, 1);
    CGColorSpaceRef cs = CGColorSpaceCreateDeviceRGB();
    CGContextRef ctx = CGBitmapContextCreate(px, w, h, 8, stride, cs, kCGImageAlphaPremultipliedLast);
    CGContextDrawImage(ctx, CGRectMake(0, 0, w, h), img);
    size_t *queue = malloc(w*h*sizeof(size_t)); size_t head=0, tail=0;
    size_t corners[4] = {0, w-1, (h-1)*w, h*w-1};
    int br=0,bg=0,bb=0;
    for(int c=0;c<4;c++){size_t ii=corners[c]*4;br+=px[ii];bg+=px[ii+1];bb+=px[ii+2];}
    br/=4; bg/=4; bb/=4;
    #define BG(P) ({ size_t ii=(P)*4; int dr=(int)px[ii]-br,dg=(int)px[ii+1]-bg,db=(int)px[ii+2]-bb; dr*dr+dg*dg+db*db<900; })
    #define SEED(P) do { size_t pp=(P); if(!seen[pp] && BG(pp)){seen[pp]=1;queue[tail++]=pp;} } while(0)
    for(size_t x=0;x<w;x++){SEED(x);SEED((h-1)*w+x);} for(size_t y=0;y<h;y++){SEED(y*w);SEED(y*w+w-1);}
    while(head<tail){size_t p=queue[head++],x=p%w,y=p/w;if(x)SEED(p-1);if(x+1<w)SEED(p+1);if(y)SEED(p-w);if(y+1<h)SEED(p+w);}
    for(size_t p=0;p<w*h;p++) if(seen[p]) px[p*4]=px[p*4+1]=px[p*4+2]=px[p*4+3]=0;
    CGImageRef out = CGBitmapContextCreateImage(ctx);
    CGImageDestinationRef dst = CGImageDestinationCreateWithURL((__bridge CFURLRef)outURL, CFSTR("public.png"), 1, NULL);
    CGImageDestinationAddImage(dst, out, NULL); CGImageDestinationFinalize(dst);
    CFRelease(dst); CGImageRelease(out); CGContextRelease(ctx); CGColorSpaceRelease(cs); CGImageRelease(img); CFRelease(src); free(queue); free(seen); free(px);
  }
  return 0;
}
