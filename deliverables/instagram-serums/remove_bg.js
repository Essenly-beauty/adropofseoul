const image = sips.images[0];
const w = image.size.width;
const h = image.size.height;
const canvas = new Canvas(w, h);
const ctx = canvas.getContext("2d");
ctx.drawImage(image, 0, 0, w, h);
const frame = ctx.getImageData(0, 0, w, h);
const d = frame.data;
const seen = new Uint8Array(w * h);
const queue = [];

function looksLikeBackground(p) {
  const i = p * 4,
    r = d[i],
    g = d[i + 1],
    b = d[i + 2];
  return Math.max(r, g, b) > 208 && Math.max(r, g, b) - Math.min(r, g, b) < 28;
}
function seed(x, y) {
  const p = y * w + x;
  if (!seen[p] && looksLikeBackground(p)) {
    seen[p] = 1;
    queue.push(p);
  }
}
for (let x = 0; x < w; x++) {
  seed(x, 0);
  seed(x, h - 1);
}
for (let y = 0; y < h; y++) {
  seed(0, y);
  seed(w - 1, y);
}
for (let q = 0; q < queue.length; q++) {
  const p = queue[q],
    x = p % w,
    y = Math.floor(p / w);
  if (x) seed(x - 1, y);
  if (x + 1 < w) seed(x + 1, y);
  if (y) seed(x, y - 1);
  if (y + 1 < h) seed(x, y + 1);
}
for (let p = 0; p < seen.length; p++)
  if (seen[p]) {
    d[p * 4] = 0;
    d[p * 4 + 1] = 0;
    d[p * 4 + 2] = 0;
    d[p * 4 + 3] = 0;
  }
ctx.putImageData(frame, 0, 0);
new Output(
  ctx,
  image.name.replace(/\.[^.]+$/, "-cutout.png"),
  "public.png"
).addToQueue();
