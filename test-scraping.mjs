// Test the scraping functionality directly
import { scrapeUrl } from './src/lib/scraping/playwright.ts';

console.log('🧪 Testing direct scraping functionality...\n');

async function testScraping() {
  const testUrls = [
    'https://github.com',
    'https://example.com',
    'https://news.ycombinator.com'
  ];

  for (const url of testUrls) {
    console.log(`\n📍 Testing URL: ${url}`);
    console.log('⏱️  Starting scraping...');

    const startTime = Date.now();

    try {
      const result = await scrapeUrl(url, { timeout: 30000 });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      if (result.success) {
        console.log(`✅ Success! Scraped in ${duration} seconds`);
        console.log('📋 Extracted data:');
        console.log(`  - Title: ${result.title || 'N/A'}`);
        console.log(`  - Description: ${result.description ? result.description.substring(0, 100) + '...' : 'N/A'}`);
        console.log(`  - Domain: ${result.domain}`);
        console.log(`  - OG Title: ${result.ogTitle || 'N/A'}`);
        console.log(`  - OG Description: ${result.ogDescription ? result.ogDescription.substring(0, 100) + '...' : 'N/A'}`);
        console.log(`  - Content length: ${result.scrapedContent ? result.scrapedContent.length : 0} chars`);
      } else {
        console.log(`❌ Failed in ${duration} seconds`);
        console.log(`  Error: ${result.error}`);
      }
    } catch (error) {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      console.log(`❌ Exception after ${duration} seconds`);
      console.log(`  Error: ${error.message}`);
    }

    console.log('---');
  }

  console.log('\n✨ Test complete!');
  console.log('Note: In the actual app, this scraping happens synchronously during link creation.');
  console.log('The user waits 5-10 seconds while metadata is fetched before the link is saved.');
}

testScraping().catch(console.error).finally(() => process.exit(0));