const http = require("http");
const { chromium } = require("playwright-core");
const zlib = require("zlib");

function crcTableGen() {
  const t = [];
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
}
const CRC = crcTableGen();
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  let crc = 0xffffffff;
  for (const b of Buffer.concat([t, data])) crc = CRC[(crc ^ b) & 0xff] ^ (crc >>> 8);
  crc = (crc ^ 0xffffffff) >>> 0;
  const crcB = Buffer.alloc(4); crcB.writeUInt32BE(crc);
  return Buffer.concat([len, t, data, crcB]);
}
function makePng(w, h, rgb) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w * 3); row[0] = 0;
    for (let x = 0; x < w; x++) { row[1 + x * 3] = rgb[0]; row[2 + x * 3] = rgb[1]; row[3 + x * 3] = rgb[2]; }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0))]);
}

const WRAPPER = `<!doctype html><html><body style="margin:0">
<iframe id="pp" src="http://localhost:4000/tools/image-to-pdf"
  sandbox="allow-scripts allow-forms allow-downloads allow-popups"
  style="width:1280px;height:900px;border:0"></iframe></body></html>`;
const server = http.createServer((req, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end(WRAPPER); });

(async () => {
  await new Promise((r) => server.listen(4443, r));
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("pageerror", (e) => console.log("PAGEERROR:", String(e && e.message || e).slice(0, 300)));
  page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE_ERR:", m.text().slice(0, 200)); });

  await page.goto("http://localhost:4443/", { waitUntil: "domcontentloaded", timeout: 60000 });
  const frameEl = await page.waitForSelector("#pp", { timeout: 15000 });
  const frame = await frameEl.contentFrame();
  await frame.waitForSelector("input[type='file']", { timeout: 60000 });
  await frame.setInputFiles('input[type="file"]', [
    { name: "x.png", mimeType: "image/png", buffer: makePng(300, 200, [200, 60, 60]) },
    { name: "y.png", mimeType: "image/png", buffer: makePng(400, 300, [40, 80, 180]) },
  ]);
  await frame.waitForFunction(() => document.querySelectorAll('div[role="listitem"]').length === 2, { timeout: 30000 });
  console.log("UPLOAD ok");
  await frame.locator("button:has-text('Generate PDF')").click({ timeout: 30000 });

  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    if (frame.url().includes("/download/")) break;
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log("FRAME_URL:", frame.url());

  const state = await frame.evaluate(() => ({
    heading: (document.querySelector("h1") || {}).textContent,
    stages: [...document.querySelectorAll("li, .pp-label")].map((e) => e.textContent.trim()).filter((t) => t && t.length < 60).slice(0, 14),
    bodyHasError: /went wrong|failed|error/i.test(document.body.textContent),
    toasts: [...document.querySelectorAll("[data-sonner-toast]")].map((t) => t.textContent.trim()),
  })).catch((e) => ({ err: e.message }));
  console.log("STATE:", JSON.stringify(state, null, 1));
  await page.screenshot({ path: "/tmp/pp-iframe-stuck.png" });
  await browser.close();
  server.close();
  console.log("PROBE_DONE");
})().catch((e) => { console.error("TEST_FAILED:", e.message); process.exit(1); });
