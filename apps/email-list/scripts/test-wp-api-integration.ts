/**
 * WordPress API Integration Test
 *
 * This script fetches posts from a WordPress site and attempts to render them as markdown.
 * It logs any errors or unknown content types encountered during the process.
 *
 * Usage:
 *   WP_API_URL=https://example.com tsx scripts/test-wp-api-integration.ts         # Test all posts
 *   WP_API_URL=https://example.com tsx scripts/test-wp-api-integration.ts 123     # Test specific post ID
 */

import fs from 'fs';
import path from 'path';
import { WordPressAPI } from '../src/services/wordpress-api';
import { MarkdownRenderer } from '../src/services/renderers/markdown-renderer';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the WordPress API URL from the environment
if (!process.env.WP_API_URL) {
  console.error('Please provide a WordPress site URL');
  console.error('Usage: WP_API_URL=https://example.com tsx scripts/test-wp-api-integration.ts [postId]');
  process.exit(1);
}
const wpUrl = process.env.WP_API_URL;
const wpUsername = process.env.WP_API_USERNAME;
const wpPassword = process.env.WP_API_PASSWORD;

// Check if a specific post ID was provided
const specificPostId = process.argv[2] ? parseInt(process.argv[2], 10) : undefined;
if (specificPostId && isNaN(specificPostId)) {
  console.error('Invalid post ID. Please provide a valid number.');
  process.exit(1);
}

// Create output directory for markdown files
const outputDir = path.join(__dirname, '../test-output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create a log file
const logFile = path.join(outputDir, 'integration-test.log');
fs.writeFileSync(
  logFile,
  `WordPress API Integration Test\nSite: ${wpUrl}\nDate: ${new Date().toISOString()}\n\n`
);

// Function to log messages to console and file
function log(message: string) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

/**
 * Process a single post by ID
 */
async function processPost(api: WordPressAPI, renderer: MarkdownRenderer, postId: number): Promise<{
  success: boolean;
  unknownBlockTypes: string[];
}> {
  try {
    // Fetch the post by ID first to get basic info
    const post = await api.getPost(postId);
    log(`Processing post: ${post.id} - ${post.title.rendered}`);

    // Fetch full post data with metadata
    const postData = await api.getPostWithMetadata(post.id);

    // Render post to markdown
    const markdown = await renderer.renderPost(postData);

    // Save markdown to file
    const filename = `${post.id}-${post.slug}.md`;
    fs.writeFileSync(path.join(outputDir, filename), markdown);

    log(`  ✓ Successfully processed post ${post.id}`);
    return { success: true, unknownBlockTypes: [] };
  } catch (error) {
    log(`  ✗ Error processing post ${postId}: ${(error as Error).message}`);

    // Check if the error is related to unknown block types
    const unknownBlockTypes: string[] = [];
    const errorMessage = (error as Error).message;
    if (errorMessage.includes('Unknown block type')) {
      const match = errorMessage.match(/Unknown block type: (.+)/);
      if (match && match[1]) {
        unknownBlockTypes.push(match[1]);
      }
    }

    return { success: false, unknownBlockTypes };
  }
}

/**
 * Test a specific post by ID
 */
async function testSpecificPost(api: WordPressAPI, renderer: MarkdownRenderer, postId: number) {
  log(`Starting WordPress API integration test for post ID: ${postId}...`);

  try {
    const result = await processPost(api, renderer, postId);

    // Log summary
    log('\n--- Test Summary ---');
    log(`Post ID: ${postId}`);
    log(`Result: ${result.success ? 'Success' : 'Failed'}`);

    if (result.unknownBlockTypes.length > 0) {
      log('\nUnknown block types encountered:');
      result.unknownBlockTypes.forEach((blockType) => {
        log(`  - ${blockType}`);
      });
    }

    // Return non-zero exit code if there were any failures
    if (!result.success || result.unknownBlockTypes.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    log(`Fatal error: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Test all posts from the WordPress site
 */
async function testAllPosts(api: WordPressAPI, renderer: MarkdownRenderer) {
  let page = 1;
  let hasMorePosts = true;
  let totalPosts = 0;
  let successfulPosts = 0;
  let failedPosts = 0;
  const unknownBlockTypes = new Set<string>();

  log('Starting WordPress API integration test for all posts...');

  try {
    // Fetch all posts
    while (hasMorePosts) {
      log(`Fetching page ${page}...`);
      try {
        const posts = await api.getPosts({ page, perPage: 10 });

        if (posts.length === 0) {
          log(`No more posts found on page ${page}. Ending pagination.`);
          hasMorePosts = false;
          continue;
        }

        totalPosts += posts.length;

        // Process each post
        for (const post of posts) {
          const result = await processPost(api, renderer, post.id);

          if (result.success) {
            successfulPosts++;
          } else {
            failedPosts++;
          }

          // Add any unknown block types to our set
          result.unknownBlockTypes.forEach(blockType => unknownBlockTypes.add(blockType));
        }

        page++;
      } catch (error) {
        const errorMessage = (error as Error).message;

        // Check if this is a pagination error (we've gone beyond available pages)
        if (
          errorMessage.includes('rest_post_invalid_page_number') ||
          errorMessage.includes('larger than the number of pages available')
        ) {
          log(`Reached the end of available posts at page ${page}.`);
          hasMorePosts = false;
        } else {
          // For other errors, log more details
          log(`Error fetching page ${page}: ${errorMessage}`);
          log(`Request parameters: page=${page}, perPage=10`);
          log(`This could be due to API rate limiting or other issues.`);

          // Log the full error stack for debugging
          log(`\nFull error details:\n${(error as Error).stack || 'No stack trace available'}\n`);

          // Break the loop to avoid further errors
          hasMorePosts = false;
        }
      }
    }

    // Log summary
    log('\n--- Test Summary ---');
    log(`Total posts processed: ${totalPosts}`);
    log(`Successful: ${successfulPosts}`);
    log(`Failed: ${failedPosts}`);

    if (unknownBlockTypes.size > 0) {
      log('\nUnknown block types encountered:');
      Array.from(unknownBlockTypes).forEach((blockType) => {
        log(`  - ${blockType}`);
      });
    }

    // Return non-zero exit code if there were any failures
    if (failedPosts > 0 || unknownBlockTypes.size > 0) {
      process.exit(1);
    }
  } catch (error) {
    log(`Fatal error: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Main function to test the WordPress API integration
 */
async function testWordPressApiIntegration() {
  const api = new WordPressAPI(wpUrl, {username: wpUsername, password: wpPassword});
  const renderer = new MarkdownRenderer();

  if (specificPostId) {
    await testSpecificPost(api, renderer, specificPostId);
  } else {
    await testAllPosts(api, renderer);
  }
}

// Run the test
testWordPressApiIntegration().catch((error) => {
  log(`Unhandled error: ${error.message}`);
  process.exit(1);
});
