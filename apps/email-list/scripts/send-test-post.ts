import { config } from 'dotenv';
import { WordPressAPI } from '../src/services/wordpress-api';
import { HtmlRenderer } from '../src/services/renderers/html-renderer';
import { MarkdownRenderer } from '../src/services/renderers/markdown-renderer';
import { EmailAPI } from '../src/services/email-api';
import { RelatedPostsService } from '../src/services/related-posts';
import { EmailListMailer } from '../src/services/email-list-mailer';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

const logFile = path.join(process.cwd(), 'logs', 'send-test-post.log');

// Ensure logs directory exists
if (!fs.existsSync(path.dirname(logFile))) {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
}

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(logFile, logMessage + '\n');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1 || isNaN(parseInt(args[0]))) {
    log('Usage: pnpm run wp:send-test-post <postId>');
    process.exit(1);
  }

  const postId = parseInt(args[0]);

  if (!process.env.TEST_EMAIL) {
    log('TEST_EMAIL environment variable is not set');
    process.exit(1);
  }

  if (!process.env.RESEND_API_KEY) {
    log('RESEND_API_KEY environment variable is not set');
    process.exit(1);
  }

  if (!process.env.WP_API_URL) {
    log('WP_API_URL environment variable is not set');
    process.exit(1);
  }

  try {
    // Initialize services
    const wpApi = new WordPressAPI(process.env.WP_API_URL);
    const htmlRenderer = new HtmlRenderer();
    const markdownRenderer = new MarkdownRenderer();
    const emailApi = new EmailAPI();
    const relatedPostsService = new RelatedPostsService(wpApi);

    const mailer = new EmailListMailer(
      wpApi,
      htmlRenderer,
      markdownRenderer,
      emailApi,
      relatedPostsService
    );

    log(`Sending test email for post ID ${postId} to ${process.env.TEST_EMAIL}...`);

    const result = await mailer.sendPostToTestEmail(postId);

    if (result) {
      log('Email sent successfully!');
    } else {
      log('Email was not sent.');
    }
  } catch (error) {
    log(`Error sending test email: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();
