import puppeteer from "puppeteer";

(async () => {
	const browser = await puppeteer.launch({ headless: "new" });
	const page = await browser.newPage();
	await page.setViewport({ width: 1440, height: 900 });

	const sites = [
		{
			url: "https://landscape-demo.web.app/",
			file: "public/images/landscape_demo.png",
		},
		{
			url: "https://plumber-demo-404e2.web.app/",
			file: "public/images/plumber_demo.png",
		},
		{
			url: "https://roofer-demo.web.app/",
			file: "public/images/roofer_demo.png",
		},
	];

	for (const site of sites) {
		console.log(`Screenshotting ${site.url}...`);
		try {
			await page.goto(site.url, { waitUntil: "networkidle0", timeout: 30000 });
			// wait extra 2 seconds for animations to finish
			await new Promise((r) => setTimeout(r, 2000));
			await page.screenshot({ path: site.file });
			console.log(`Saved ${site.file}`);
		} catch (e) {
			console.error(`Failed on ${site.url}:`, e);
		}
	}

	await browser.close();
})();
