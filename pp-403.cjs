const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const failed = new Map();
  page.on("response", (r) => {
    if (r.status() >= 400) {
      const req = r.request();
      failed.set(r.url(), `${r.status()} mode=${req.headers()["sec-fetch-mode"] || "-"} site=${req.headers()["sec-fetch-site"] || "-"} origin=${req.headers()["origin"] || "-"}`);
    }
  });
  await page.goto("http://localhost:4000/tools/image-to-pdf", { waitUntil: "networkidle", timeout: 90000 }).catch((e) => console.log("goto:", e.message.slice(0, 80)));
  await page.waitForTimeout(3000);
  console.log("TOP_LEVEL_403s:", failed.size ? [...failed.entries()].map(([u, d]) => d + "\n  " + u.slice(0, 120)).join("\n") : "none");
  await browser.close();
  console.log("DONE");
})().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
