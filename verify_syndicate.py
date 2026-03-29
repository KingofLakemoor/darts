import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            record_video_dir="verification/videos/"
        )
        page = await context.new_page()

        # Start at localhost:3000
        await page.goto("http://localhost:3000")

        # Click Syndicate Mode via Menu
        await page.click("button >> .lucide-menu")
        await page.wait_for_timeout(500)

        # Click the Syndicate Mode button
        await page.get_by_text("Syndicate Mode").click()
        await page.wait_for_timeout(1000)

        # Enter darts by specific class + text selection to avoid timeouts or strict mode errors
        buttons = await page.locator("button").all()
        for b in buttons:
            text = await b.inner_text()
            if text == "20":
                await b.click()
                break
        await page.wait_for_timeout(300)

        buttons = await page.locator("button").all()
        for b in buttons:
            text = await b.inner_text()
            if text == "T":
                await b.click()
                break
        await page.wait_for_timeout(300)

        buttons = await page.locator("button").all()
        for b in buttons:
            text = await b.inner_text()
            if text == "20":
                await b.click()
                break
        await page.wait_for_timeout(300)

        buttons = await page.locator("button").all()
        for b in buttons:
            text = await b.inner_text()
            if text == "D":
                await b.click()
                break
        await page.wait_for_timeout(300)

        buttons = await page.locator("button").all()
        for b in buttons:
            text = await b.inner_text()
            if text == "20":
                await b.click()
                break
        await page.wait_for_timeout(300)

        await page.screenshot(path="verification/screenshots/syndicate_scorer.png")

        await context.close()
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
