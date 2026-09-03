import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);
const out = path.join(root, "svg");
fs.mkdirSync(out, { recursive: true });

const esc = (s) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const lines = (items, x, y, size, gap, cls = "body") =>
  items
    .map(
      (t, i) =>
        `<text x="${x}" y="${y + i * gap}" class="${cls}" font-size="${size}">${esc(t)}</text>`
    )
    .join("");
const base = (n, inner, bg = "#F4EFE7") => `
<svg xmlns="http://www.w3.org/2000/svg" width="1350" height="1350" viewBox="0 0 1080 1350" preserveAspectRatio="none">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="22" stdDeviation="28" flood-color="#6D5545" flood-opacity=".18"/></filter>
    <filter id="maskBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="26"/></filter>
    <mask id="productFade" maskUnits="userSpaceOnUse" x="520" y="100" width="544" height="660"><ellipse cx="792" cy="430" rx="174" ry="264" fill="white" filter="url(#maskBlur)"/></mask>
    <mask id="coverFade1" maskUnits="userSpaceOnUse" x="70" y="790" width="212" height="230"><ellipse cx="176" cy="905" rx="68" ry="92" fill="white" filter="url(#maskBlur)"/></mask>
    <mask id="coverFade2" maskUnits="userSpaceOnUse" x="252" y="790" width="212" height="230"><ellipse cx="358" cy="905" rx="68" ry="92" fill="white" filter="url(#maskBlur)"/></mask>
    <mask id="coverFade3" maskUnits="userSpaceOnUse" x="434" y="790" width="212" height="230"><ellipse cx="540" cy="905" rx="68" ry="92" fill="white" filter="url(#maskBlur)"/></mask>
    <mask id="coverFade4" maskUnits="userSpaceOnUse" x="616" y="790" width="212" height="230"><ellipse cx="722" cy="905" rx="68" ry="92" fill="white" filter="url(#maskBlur)"/></mask>
    <mask id="coverFade5" maskUnits="userSpaceOnUse" x="798" y="790" width="212" height="230"><ellipse cx="904" cy="905" rx="68" ry="92" fill="white" filter="url(#maskBlur)"/></mask>
    <clipPath id="productCircle"><circle cx="792" cy="430" r="248"/></clipPath>
    <clipPath id="cover1"><circle cx="176" cy="905" r="92"/></clipPath>
    <clipPath id="cover2"><circle cx="358" cy="905" r="92"/></clipPath>
    <clipPath id="cover3"><circle cx="540" cy="905" r="92"/></clipPath>
    <clipPath id="cover4"><circle cx="722" cy="905" r="92"/></clipPath>
    <clipPath id="cover5"><circle cx="904" cy="905" r="92"/></clipPath>
    <radialGradient id="glow" cx="76%" cy="16%" r="72%"><stop offset="0" stop-color="#E9D6CF"/><stop offset="1" stop-color="${bg}"/></radialGradient>
    <style>
      .sans{font-family:'Apple SD Gothic Neo','Helvetica Neue',sans-serif;fill:#1C1C1C}.serif{font-family:'New York','Times New Roman',serif;fill:#1C1C1C}
      .eyebrow{font-family:'Helvetica Neue',sans-serif;font-weight:600;letter-spacing:5px;fill:#9A6B50}.body{font-family:'Apple SD Gothic Neo',sans-serif;fill:#4D4842}.bold{font-family:'Apple SD Gothic Neo',sans-serif;font-weight:700;fill:#1C1C1C}
    </style>
  </defs>
  <rect width="1080" height="1350" fill="url(#glow)"/>
  <text x="72" y="78" class="eyebrow" font-size="20">A DROP OF SEOUL · BEAUTY EDIT</text>
  <text x="1008" y="78" text-anchor="end" class="sans" font-size="19" fill="#8E857B">${String(n).padStart(2, "0")} / 08</text>
  ${inner}
  <line x1="72" y1="1274" x2="1008" y2="1274" stroke="#B78B62" stroke-width="2"/>
  <text x="72" y="1314" class="eyebrow" font-size="17">ADROPOFSEOUL.COM</text>
</svg>`;

const product = ({ n, file, brand, name, role, color, copy, limit, verdict }) =>
  base(
    n,
    `
  <image href="../assets/${file}" x="525" y="105" width="534" height="650" preserveAspectRatio="xMidYMid meet"/>
  <text x="72" y="190" class="eyebrow" font-size="19">0${n - 1} · ${esc(role.toUpperCase())}</text>
  <text x="72" y="260" class="serif" font-size="62" font-weight="600">${esc(brand)}</text>
  ${lines(name, 72, 314, 26, 35, "bold")}
  <rect x="72" y="690" width="936" height="2" fill="#C9BAA9"/>
  <text x="72" y="752" class="bold" font-size="25">BEST FOR</text>
  ${lines(copy, 72, 800, 29, 42)}
  <text x="72" y="948" class="bold" font-size="25">THE CATCH</text>
  ${lines(limit, 72, 996, 26, 38)}
  <rect x="72" y="1104" width="936" height="100" rx="50" fill="#1C1C1C"/>
  <text x="540" y="1166" text-anchor="middle" class="sans" font-size="25" style="fill:#FFFFFF" font-weight="700">${esc(verdict)}</text>
`,
    "#F4EFE7"
  );

const slides = [];
slides.push(
  base(
    1,
    `
  <text x="72" y="218" class="eyebrow" font-size="20">5 VIRAL BOTTLES, 5 DIFFERENT JOBS</text>
  <text x="72" y="320" class="serif" font-size="78" font-weight="600">5 viral serums</text>
  <text x="72" y="408" class="serif" font-size="78" font-weight="600">Which one is for you?</text>
  <text x="74" y="473" class="body" font-size="29">You do not need all five. Choose the one that fills</text>
  <text x="74" y="515" class="body" font-size="29">the missing job in your routine.</text>
  <circle cx="540" cy="905" r="322" fill="#E3D3C4" opacity=".72"/>
  <image href="../assets/cutouts/torriden.png" x="34" y="735" width="284" height="330" preserveAspectRatio="xMidYMid meet"/>
  <image href="../assets/cutouts/anua.png" x="216" y="735" width="284" height="330" preserveAspectRatio="xMidYMid meet"/>
  <image href="../assets/cutouts/mediheal.png" x="398" y="735" width="284" height="330" preserveAspectRatio="xMidYMid meet"/>
  <image href="../assets/cutouts/cosrx.png" x="580" y="735" width="284" height="330" preserveAspectRatio="xMidYMid meet"/>
  <image href="../assets/cutouts/innisfree.png" x="762" y="735" width="284" height="330" preserveAspectRatio="xMidYMid meet"/>
`
  )
);

slides.push(
  product({
    n: 2,
    file: "cutouts/torriden.png",
    brand: "Torriden",
    name: ["DIVE-IN Serum"],
    role: "EVERYDAY HYDRATION",
    color: "#B9DADF",
    copy: [
      "For tight, dehydrated skin that dislikes sticky layers.",
      "Easy under sunscreen and makeup.",
    ],
    limit: [
      "Hyaluronic acid does not replace moisturizer.",
      "On dry days, apply to damp skin and seal with cream.",
    ],
    verdict: "The safest first pick for light daily hydration",
  })
);
slides.push(
  product({
    n: 3,
    file: "cutouts/anua.png",
    brand: "Anua",
    name: ["PDRN Hyaluronic Acid", "Capsule 100 Serum"],
    role: "INSTANT DEWY GLOW",
    color: "#A9D8D2",
    copy: [
      "For a quick plump, glossy finish before makeup.",
      "A lightweight way to make dull skin look fresher.",
    ],
    limit: [
      "It is not an at-home version of an injectable.",
      "May look too shiny on oily skin; contains salmon-derived PDRN.",
    ],
    verdict: "Choose it for the finish, not the PDRN fantasy",
  })
);
slides.push(
  product({
    n: 4,
    file: "cutouts/mediheal.png",
    brand: "Mediheal",
    name: ["Madecassoside", "Blemish Repair Serum"],
    role: "POST-BREAKOUT CARE",
    color: "#AFCBC6",
    copy: [
      "For the visible mark and redness left after a spot",
      "has flattened and the angry stage is over.",
    ],
    limit: [
      "Not a treatment for cystic or inflammatory acne.",
      "Patch test if fragrance or botanicals often bother you.",
    ],
    verdict: "A calmer route for post-breakout care",
  })
);
slides.push(
  product({
    n: 5,
    file: "cutouts/cosrx.png",
    brand: "COSRX",
    name: ["The 6 Peptide", "Skin Booster Serum"],
    role: "WEIGHTLESS FIRST STEP",
    color: "#DED9CF",
    copy: [
      "For a toner-light first layer after cleansing.",
      "Adds hydration without crowding a layered routine.",
    ],
    limit: [
      "It does not strongly target one single concern.",
      "A simple hydrating toner may suit minimal routines just as well.",
    ],
    verdict: "The connector in a routine, not the main event",
  })
);
slides.push(
  product({
    n: 6,
    file: "cutouts/innisfree.png",
    brand: "innisfree",
    name: ["Retinol Cica", "Moisture Recovery Serum"],
    role: "BEGINNER RETINOL",
    color: "#D8E4D7",
    copy: [
      "For beginners ready to address texture and mild breakouts",
      "without jumping straight to a strong retinol.",
    ],
    limit: [
      "Start every other night or less often.",
      "Do not stack with acids immediately; wear SPF by day.",
    ],
    verdict: "An approachable place to begin with retinol",
  })
);

slides.push(
  base(
    7,
    `
  <text x="72" y="210" class="serif" font-size="72" font-weight="600">Which one should you buy?</text>
  <text x="74" y="272" class="body" font-size="28">Choose by the missing function, not the product name.</text>
  ${[
    ["Tight, dehydrated skin", "Torriden DIVE-IN Serum", "#B9DADF"],
    ["Fast glow before makeup", "Anua PDRN Capsule 100 Serum", "#A9D8D2"],
    [
      "A lingering post-breakout mark",
      "Mediheal Blemish Repair Serum",
      "#AFCBC6",
    ],
    ["A weightless first layer", "COSRX The 6 Peptide Booster", "#DED9CF"],
    ["Texture + first retinol", "innisfree Retinol Cica Serum", "#D8E4D7"],
  ]
    .map(
      (r, i) =>
        `<g transform="translate(72 ${350 + i * 150})"><rect width="936" height="118" rx="26" fill="#FCFAF6" stroke="#D7CEC3"/><circle cx="62" cy="59" r="32" fill="${r[2]}"/><text x="116" y="47" class="bold" font-size="25">${r[0]}</text><text x="116" y="87" class="eyebrow" font-size="20" style="letter-spacing:3px">${r[1]}</text></g>`
    )
    .join("")}
  <text x="72" y="1158" class="bold" font-size="27">If two sound right:</text>
  <text x="72" y="1200" class="body" font-size="25">Start with the gentler hydrator. Add one thing at a time.</text>
`
  )
);

slides.push(
  base(
    8,
    `
  <text x="72" y="210" class="serif" font-size="72" font-weight="600">Add a serum without chaos</text>
  <text x="74" y="272" class="body" font-size="28">Even good products become confusing when added all at once.</text>
  <path d="M160 432 H865" stroke="#B78B62" stroke-width="3"/>
  ${[
    ["1", "After cleansing", "and toner"],
    ["2", "A few drops or", "1–2 pumps"],
    ["3", "One new product", "at a time"],
    ["4", "Finish daytime", "with sunscreen"],
  ]
    .map(
      (r, i) =>
        `<g transform="translate(${120 + i * 235} 395)"><circle cx="40" cy="40" r="40" fill="#1C1C1C"/><text x="40" y="51" text-anchor="middle" class="sans" style="fill:#fff" font-size="29" font-weight="600">${r[0]}</text>${lines([r[1], r[2]], -20, 126, 23, 34, "sans")}</g>`
    )
    .join("")}
  <rect x="72" y="720" width="936" height="336" rx="38" fill="#E9D6CF"/>
  <text x="120" y="794" class="eyebrow" font-size="18">THE HONEST TAKE</text>
  <text x="120" y="875" class="serif" font-size="49" font-weight="600">The best serum is not the one</text>
  <text x="120" y="938" class="serif" font-size="49" font-weight="600">with the longest ingredient list</text>
  <text x="120" y="1004" class="body" font-size="28">It is the one your routine has a clear job for</text>
  <text x="72" y="1144" class="bold" font-size="28">Read the full edit at adropofseoul.com</text>
  <text x="72" y="1190" class="body" font-size="24">Save this before your next serum purchase.</text>
`
  )
);

slides.forEach((svg, i) =>
  fs.writeFileSync(path.join(out, `${String(i + 1).padStart(2, "0")}.svg`), svg)
);
console.log(`Generated ${slides.length} SVG cards in ${out}`);
