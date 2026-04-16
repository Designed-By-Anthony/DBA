import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const site = 'https://designed-by-anthony.web.app/';

  console.log('Capturing landscape...');
  await page.setViewportSize({ width: 2880, height: 1800 });
  await page.goto(site, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Wait for animations
  await page.screenshot({ path: '/Users/anthonyjones/Desktop/landscape_image.png' });

  console.log('Capturing square...');
  await page.setViewportSize({ width: 1440, height: 1440 });
  await page.goto(site, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/anthonyjones/Desktop/square_image.png' });

  console.log('Capturing portrait...');
  await page.setViewportSize({ width: 1080, height: 1920 });
  await page.goto(site, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/Users/anthonyjones/Desktop/portrait_image.png' });

  await browser.close();
  console.log('Done!');
})();
