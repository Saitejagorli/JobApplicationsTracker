from crawl4ai import AsyncWebCrawler


async def scrape(url):
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url)
        return result
