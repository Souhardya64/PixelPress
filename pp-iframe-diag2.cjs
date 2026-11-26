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
  const failed = [];
  page.on("response", (r) => { if (r.status() >= 400) failed.push(r.status() + " " + r.url().slice(0, 110)); });
  page.on("pageerror", (e) => console.log("PAGEERROR:", String(e && e.stack || e).slice(0, 500)));

  await page.goto("http://localhost:4443/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(9000);
  console.log("FAILED_REQUESTS:\n" + [...new Set(failed)].join("\n"));

  const frameEl = await page.waitForSelector("#pp", { timeout: 15000 });
  const frame = await frameEl.contentFrame();
  const diag = await frame.evaluate(() => {
    const el = document.querySelector(".pp-boot-overlay");
    const cs = el ? getComputedStyle(el) : null;
    const btn = [...document.querySelectorAll("button")].find((b) => b.textContent.includes("Generate"));
    return {
      animName: cs ? cs.animationName : "no-el",
      animDur: cs ? cs.animationDuration : "-",
      animPlay: cs ? cs.animationPlayState : "-",
      reduceMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      hasGenerateBtn: !!btn,
      nextDataScript: !!document.getElementById("__NEXT_DATA__"),
      rootChildren: document.getElementById("__next") ? "pages-router" : "app-router",
      hydrationMarker: !!document.querySelector("[data-reactroot]"),
      scripts: [...document.scripts].map((s) => s.src.split("/").pop() || "inline").slice(0, 12),
    };
  }).catch((e) => ({ err: e.message }));
  console.log("DIAG2:", JSON.stringify(diag, null, 1));

  await page.screenshot({ path: "/tmp/pp-iframe-diag2.png" });
  await browser.close();
  server.close();
  console.log("DIAG2_DONE");
})().catch((e) => { console.error("TEST_FAILED:", e.message); process.exit(1); });
