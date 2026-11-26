const http = require("http");
const { chromium } = require("playwright-core");
const zlib = require("zlib");
const fs = require("fs");

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

const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/html" });
  res.end(WRAPPER);
});

(async () => {
  await new Promise((r) => server.listen(4443, r));
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push("IFRAME_PAGEERROR: " + e.message));

  await page.goto("http://localhost:4443/", { waitUntil: "domcontentloaded", timeout: 60000 });
  const frameEl = await page.waitForSelector("#pp", { timeout: 15000 });
  const frame = await frameEl.contentFrame();
  if (!frame) throw new Error("no frame");

  await frame.waitForSelector("input[type='file']", { timeout: 60000 });
  await frame.setInputFiles('input[type="file"]', [
    { name: "x.png", mimeType: "image/png", buffer: makePng(300, 200, [200, 60, 60]) },
    { name: "y.png", mimeType: "image/png", buffer: makePng(400, 300, [40, 80, 180]) },
  ]);
  await frame.waitForFunction(() => document.querySelectorAll('div[role="listitem"]').length === 2, { timeout: 30000 });
  console.log("UPLOAD_IN_SANDBOXED_IFRAME: ok");

  await frame.locator("button:has-text('Generate PDF')").click({ timeout: 30000 });
  console.log("GENERATE_CLICKED — waiting for job creation (hang-proof storage)…");

  let processSeen = false, downloadSeen = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 150000) {
    const u = frame.url();
    if (!processSeen && u.includes("/process/")) { processSeen = true; console.log("PROCESS_URL:", u.slice(0, 80)); }
    if (u.includes("/download/")) { downloadSeen = true; break; }
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!downloadSeen) throw new Error("Never reached download page. Frame url: " + frame.url());
  console.log("DOWNLOAD_URL:", frame.url().slice(0, 80));

  await frame.waitForFunction(() => document.body && document.body.textContent.includes("Success"), { timeout: 30000 });
  console.log("SUCCESS_SHOWN_IN_IFRAME: true");

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 30000 }),
    frame.locator("button:has-text('Download file')").click(),
  ]);
  const buf = fs.readFileSync(await download.path());
  console.log("PDF_MAGIC:", buf.slice(0, 5).toString(), "bytes:", buf.length);

  await browser.close();
  server.close();
  if (errors.length) console.log("PAGEERRORS:", errors.slice(0, 3));
  console.log(errors.length ? "IFRAME_TEST_PASSED_WITH_ERRORS" : "SANDBOXED_IFRAME_FLOW_PASSED");
})().catch((e) => {
  console.error("TEST_FAILED:", e.message);
  console.error("AT:", (e.stack || "").split("\n").slice(1, 4).join(" | "));
  process.exit(1);
});
