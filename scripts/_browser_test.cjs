const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto("http://localhost:3000/tts", { waitUntil: "networkidle", timeout: 30000 });
  await page.screenshot({ path: "C:/Users/HYH/Documents/视频智能体/screenshots/tts_page.png", fullPage: false });
  console.log("page loaded");
  
  // List all buttons
  const btns = await page.locator("button").allTextContents();
  console.log("buttons:", JSON.stringify(btns.slice(0, 20)));
  
  // Click online search tab
  const onlineTab = page.locator("button").filter({ hasText: /\u5728\u7ebf/ });
  const count = await onlineTab.count();
  console.log("online tab count:", count);
  if (count > 0) {
    await onlineTab.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: "C:/Users/HYH/Documents/视频智能体/screenshots/tts_online_tab.png", fullPage: false });
    console.log("clicked online tab");
    
    // Check if search input exists
    const inputs = await page.locator("input").all();
    console.log("input count:", inputs.length);
    
    // Try to search
    const searchInput = page.locator("input[placeholder*='\u641c\u7d22']");
    if (await searchInput.count() > 0) {
      await searchInput.fill("happy");
      const searchBtn = page.locator("button").filter({ hasText: /\u641c\u7d22/ }).first();
      if (await searchBtn.count() > 0) {
        await searchBtn.click();
        console.log("searching for happy...");
        await page.waitForTimeout(8000);
        await page.screenshot({ path: "C:/Users/HYH/Documents/视频智能体/screenshots/tts_search_results.png", fullPage: false });
        
        // Check results
        const results = await page.locator("[class*='rounded-xl'][class*='bg-gray-50']").count();
        console.log("result cards:", results);
      }
    } else {
      console.log("search input not found");
      // screenshot the current state
      const html = await page.content();
      console.log("has searchOnline:", html.includes("searchOnline"));
    }
  }
  
  await browser.close();
  console.log("done");
})();