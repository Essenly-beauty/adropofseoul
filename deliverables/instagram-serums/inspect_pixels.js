const image = sips.images[0];
const canvas = new Canvas(image.size.width, image.size.height);
const ctx = canvas.getContext("2d");
ctx.drawImage(image, 0, 0);
const d = ctx.getImageData(0, 0, image.size.width, image.size.height).data;
print([d[0], d[1], d[2], d[3], d[40], d[41], d[42], d[43]].join(","));
