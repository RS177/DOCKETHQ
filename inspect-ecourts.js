/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require("playwright");

async function inspect() {
  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage();

  await page.setExtraHTTPHeaders({
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
});

 await page.goto("https://services.ecourts.gov.in/", {
  waitUntil: "commit",
  timeout: 120000,
});

  console.log("Opened eCourts");

  await page.waitForTimeout(8000);

  const inputs = await page.locator("input").evaluateAll((els) =>
    els.map((el) => ({
      type: el.getAttribute("type"),
      id: el.getAttribute("id"),
      name: el.getAttribute("name"),
      placeholder: el.getAttribute("placeholder"),
      value: el.getAttribute("value"),
    }))
  );

  const buttons = await page.locator("button, input[type='button'], input[type='submit']").evaluateAll((els) =>
    els.map((el) => ({
      text: el.textContent?.trim(),
      id: el.getAttribute("id"),
      name: el.getAttribute("name"),
      value: el.getAttribute("value"),
    }))
  );

  console.log("INPUTS:", inputs);
  console.log("BUTTONS:", buttons);

  await page.waitForTimeout(15000);
  await browser.close();
}

inspect();
