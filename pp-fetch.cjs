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
  await page.goto("http://localhost:4443/", { waitUntil: "domcontentloaded", timeout: 60000 });
  const frameEl = await page.waitForSelector("#pp", { timeout: 15000 });
  const frame = await frameEl.contentFrame();
  await frame.waitForSelector("input[type='file']", { timeout: 60000 });
  await page.waitForTimeout(3000);

  const res = await frame.evaluate(async () => {
    const out = {};
    try {
      const r = await fetch(window.location.href, { headers: { RSC: "1" }, credentials: "same-origin" });
      out.basic = { status: r.status, type: r.type };
    } catch (e) { out.basic = "ERR: " + String(e).slice(0, 120); }
    try {
      const r2 = await fetch("/tools/image-to-pdf", { headers: { RSC: "1", "Next-Router-State-Tree": "%5B%22%22%5D" }, credentials: "same-origin" });
      out.relative = { status: r2.status, type: r2.type };
    } catch (e) { out.relative = "ERR: " + String(e).slice(0, 120); }
    try {
      const r3 = await fetch("/tools/image-to-pdf", { credentials: "include" });
      out.credInclude = { status: r3.status };
    } catch (e) { out.credInclude = "ERR: " + String(e).slice(0, 120); }
    return out;
  }).catch((e) => ({ outer: e.message }));
  console.log("FETCH_PROBE:", JSON.stringify(res, null, 1));
  await browser.close();
  server.close();
  console.log("DONE");
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
