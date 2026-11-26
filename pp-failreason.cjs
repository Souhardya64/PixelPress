const http = require("http");
const { chromium } = require("playwright-core");
const WRAPPER = `<!doctype html><html><body style="margin:0">
<iframe id="pp" src="http://localhost:4000/tools/image-to-pdf"
  sandbox="allow-scripts allow-forms allow-downloads allow-popups"
  style="width:1280px;height:900px;border:0"></iframe></body></html>`;
const server = http.createServer((req, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end(WRAPPER); });
(async () => {
  await new Promise((r) => server.listen(4443, r));
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("requestfailed", (r) => console.log("REQFAILED:", r.resourceType(), r.failure() && r.failure().errorText, r.url().slice(0, 90)));
  page.on("requestfinished", (r) => { if (r.resourceType() === "fetch" || r.resourceType() === "xhr") console.log("REQ_OK:", r.resourceType(), r.url().slice(0, 90)); });
  await page.goto("http://localhost:4443/", { waitUntil: "domcontentloaded", timeout: 60000 });
  const frameEl = await page.waitForSelector("#pp", { timeout: 15000 });
  const frame = await frameEl.contentFrame();
  await frame.waitForSelector("input[type='file']", { timeout: 60000 });
  await page.waitForTimeout(2000);
  const out = await frame.evaluate(async () => {
    try { const r = await fetch(location.href); return "OK " + r.status; } catch (e) { return "ERR " + String(e); }
  });
  console.log("FETCH_RESULT:", out);
  await browser.close();
  server.close();
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
