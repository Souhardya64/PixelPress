const { chromium } = require("playwright-core");

(async () => {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });

  for (const route of ["/", "/tools/image-to-pdf", "/about"]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const t0 = Date.now();
    await page.goto(`http://localhost:4000${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => {
      const el = document.querySelector(".pp-boot-overlay");
      if (!el) return true;
      const v = getComputedStyle(el);
      return v.visibility === "hidden" || parseFloat(v.opacity) < 0.05;
    }, { timeout: 30000 });
    const overlayGone = Date.now() - t0;
    const heroVisible = await page.evaluate(() => {
      const h = document.querySelector("h1, nav");
      return !!h && h.getBoundingClientRect().width > 0;
    });
    const clickable = await page.evaluate(() => {
      const a = document.querySelector("a[href='/tools']");
      if (!a) return true;
      const r = a.getBoundingClientRect();
      const el = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return el === a || a.contains(el);
    });
    console.log(`${route}: overlay cleared after ${overlayGone}ms, contentVisible=${heroVisible}, linksClickable=${clickable}, errors=${errors.length ? errors[0].slice(0, 80) : "none"}`);
    await page.close();
  }
  await browser.close();
  console.log("SPEED_TEST_DONE");
})().catch((e) => { console.error("TEST_FAILED:", e.message); process.exit(1); });
