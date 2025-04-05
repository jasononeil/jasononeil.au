import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { WordPressAPI } from '../src/services/wordpress-api';

// Load environment variables
dotenv.config();

// Configuration
const wpUrl = process.env.WORDPRESS_API_URL || 'https://jasononeil.au/wp-json';
const wpUsername = process.env.WORDPRESS_API_USERNAME;
const wpPassword = process.env.WORDPRESS_API_PASSWORD;
const outputDir = path.join(__dirname, '../blocks-output');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Log file for tracking progress
const logFile = path.join(outputDir, 'extraction-log.txt');

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

async function extractBlockTypes() {
  log('Starting block type extraction...');

  // Initialize WordPress API client
  const api = new WordPressAPI(wpUrl, {
    username: wpUsername,
    password: wpPassword,
  });

  // Track unique block types
  const blockTypes = new Map<string, any>();

  try {
    // Fetch all posts
    let page = 1;
    let hasMorePosts = true;
    let totalPosts = 0;
    let processedPosts = 0;

    while (hasMorePosts) {
      log(`Fetching posts page ${page}...`);
      try {
        const posts = await api.getPosts({ page, perPage: 100 });

        if (posts.length === 0) {
          log(`No more posts found on page ${page}. Ending pagination.`);
          hasMorePosts = false;
          continue;
        }

      totalPosts += posts.length;
      log(`Found ${posts.length} posts on page ${page}`);

      // Process each post
      for (const post of posts) {
        try {
          log(`Processing post ID: ${post.id} - "${post.title.rendered}"`);

          // Fetch blocks for this post
          const response = await api.getPostBlocks(post.id);

          console.log("RESPONSE", response)

          if (!response || !("blocks" in response) || !Array.isArray(response.blocks)) {
            log(`No blocks found or invalid response for post ID: ${post.id}`);
            continue;
          }

          // Process each block
          for (const block of response.blocks) {
            if (!block || typeof block !== 'object') continue;

            const blockName = (block as any).name;
            if (!blockName) continue;

            // If we haven't seen this block type before, save it
            if (!blockTypes.has(blockName)) {
              log(`Found new block type: ${blockName}`);
              blockTypes.set(blockName, block);
            }
          }

          processedPosts++;
        } catch (error) {
          log(`Error processing post ID ${post.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      page++;
      } catch (error) {
        // Handle pagination errors (like requesting a page beyond what's available)
        log(`Error fetching page ${page}: ${error instanceof Error ? error.message : String(error)}`);
        log('Reached the end of available posts. Ending pagination.');
        hasMorePosts = false;
      }
    }

    // Save each block type to a separate file
    log(`\nSaving ${blockTypes.size} unique block types to ${outputDir}`);

    for (const [blockName, blockData] of blockTypes.entries()) {
      // Create a safe filename from the block name
      const safeFileName = blockName.replace(/\//g, '-').replace(/[^a-z0-9-]/gi, '_');
      const filePath = path.join(outputDir, `${safeFileName}.json`);

      // Write the block data to a JSON file
      fs.writeFileSync(filePath, JSON.stringify(blockData, null, 2));
      log(`Saved ${blockName} to ${filePath}`);
    }

    // Write a summary file with all block types
    const summaryPath = path.join(outputDir, 'block-types-summary.json');
    const summary = {
      totalPosts,
      processedPosts,
      uniqueBlockTypes: Array.from(blockTypes.keys()),
      extractedAt: new Date().toISOString(),
    };

    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    log(`Saved summary to ${summaryPath}`);

    log('\nExtraction complete!');
    log(`Found ${blockTypes.size} unique block types across ${processedPosts} posts.`);

  } catch (error) {
    log(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the extraction
extractBlockTypes().catch(error => {
  log(`Unhandled error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
