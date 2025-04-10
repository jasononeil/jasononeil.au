# TODO: Email Delivery System for WordPress Blog

This file outlines the tasks and development phases for the email delivery system with a focus on de-risking early. In particular, we’re targeting:
• API Content Variability and Unforeseen Data Structures
• Integration Stability with WordPress API Versions
• Known risk: Unknown WP content types on your blog

Each section includes early testing steps (both unit and integration tests) to quickly identify any issues with API data or our conversion logic.

---

## Phase 1: Core Infrastructure

### 1. Project Setup

- [x] Initialize the Next.js application structure.
- [x] Configure repository structure
- [x] Set up linting, Prettier, and other code quality tools. Prefer Next.js defaults
- [x] Add early unit testing framework configuration (e.g. Vitest).
- [x] Define a basic health endpoint and example test.

### 2. Database Setup

- [x] Set up a local MySQL with devbox
- [x] Set up Drizzle ORM for MySQL database access
- [x] Define MySQL database configuration (shared with WordPress)
- [x] Create schema definitions for custom tables:
  - subscribers
  - subscriber_preferences
  - sent_emails
- [x] Write Drizzle migrations for schema creation
- [x] Create database utility functions for common operations
- [x] Add testing scripts for database connection and migrations
- [x] Implement repository pattern for subscriber management

### 3. WordPress API Integration

First, create the basic code:

- [x] Create a module to fetch posts via the WordPress REST API.
- [x] Implement methods to fetch these:
  - Posts (content, title, publication date)
  - Categories & tags
  - Featured images, media, and author information
- [x] Create a "renderer" type, and a first "markdown" renderer that takes a post and creates a markdown rendering of all the blocks in the post.
- [x] Write a manually triggerable integration test that fetches every blog post on the live server and attempts to parse each one, outputing a markdown file. Log any errors or unknown content types. After attempting all posts, return non-zero if there were errors or unknown content types.

Now create a test harness

- [x] Create a Next.js page `/app/preview-posts/` that has a 4 column layout
- [x] Use route parameters to keep track of the current state for pagination / selected post.
- [x] The first column is titled "Posts" should have a list item for each blog post. Use whatever pagination the API uses.
- [x] The second pane is titled "Web" and should have an iframe for the actual blog post.
- [x] The third pane is titled "Markdown" and should have a markdown rendering in a <pre> tag (but with word-wrapping)
- [x] The fourth pane is titled "HTML Email" and for now just renders "coming soon"

#### Fixing blocks

It turns out the Wordpress API doesn't support blocks by default.

- [x] Add vip-block-data-api to my website to support fetching this data. Note this requires manual installation from the zip file on the Github page.
- [x] Add to email-list README that this plugin is required.
- [x] Update Wordpress API helper for the fact that API versioning for the core is `/wp-json/[version]` and for plugins is `/wp-json/[plugin]/[version]`
- [x] Add Wordpress API helper for `/wp-json/vip-block-data-api/v1/posts/<post_id>/blocks` endpoint
- [x] Write a once off script to read blocks for every post in the database and save one example JSON response for each block type.
- [x] Use the script to save JSON examples of each block type
- [x] Create zod decoders and typescript types for blocks
- [x] Add tests for block decoders
- [x] Update block handling logic in the API and the renderer to use the new API and types
- [x] Run the test script to ensure we know all blocks that must be handled

### 4. Basic Email Templates

- [x] Create a general `Renderer` interface
- [x] Create a markdown renderer with unit tests
- [x] Create simple HTML/CSS templates with unit tests
- [x] Add header and footer to both templates
  - Header with blog name
  - Footer with unsubscribe link (placeholder for now)
- [x] Ensure basic responsive and sans-serif styling for HTML.

---

## Phase 2: Email Generation & Delivery

### 1. Content Parsing & Transformation

- [x] Develop a parser to convert WordPress block content into email-friendly HTML and also plain text.
- [x] Ensure conversion logic handles:
  - Common block types (headers, lists, blockquotes, etc.)
  - Embedded media and fallback for unsupported blocks
- [x] Early Integration Test:
  - Use the manual trigger test to run the conversion process on all existing WordPress posts and report any parsing anomalies.
  - Write unit tests for each block type conversion scenario.

### 2. More from the blog

- [x] Add a new service that uses the existing `wordpress-api` service that takes a Post ID, and fetches the 5 posts that came before it
- [x] Create a new `renderMoreFromTheBlog(posts: WPPost[])` method on the renderer interface
- [x] If the post is less than a certain threshold (say 100 words?) then render all the content (using `content.rendered`, not blocks). If it's longer then render the excerpt.
- [x] Implement for Markdown renderer including unit tests.
- [x] Implement for HTML renderer including unit tests.

Then split out the main post rendering from the overall document:

- [x] Create a new `renderEmail()` method on the renderer interface
- [x] In the Markdown renderer pull out the blog title and unsubscribe link to `renderEmail()`. Then have it call `renderPost()` and `renderMoreFromTheBlog()`
- [x] In the HTML renderer pull out the container, CSS, blog title and unsubscribe link to `renderEmail()`. Then have it call `renderPost()` and `renderMoreFromTheBlog()`

### 3. SendGrid Integration

Integrate Twilio SendGrid for sending emails.

- [x] Register an API key and set up environment variable `SENDGRID_API_KEY`.
- [x] Set DNS records to authenticate with SendGrid.
- [x] Create a new `sendgrid-api` service for sending email via Sendgrid. Something like `send(to, subject, plaintext, html)`. Ensure it never sends if `LOCAL_DEVELOPMENT` environment variable is set, except to the email `TEST_EMAIL`. Use `@sendgrid/mail`.
- [x] Create a new `email-list-mailer` service that will send the actual emails. Implement a `sendPostToTestEmail(postId)` that sends a post to the email address in the environment variable `TEST_EMAIL`.
- [x] Create a script `pnpm run wp:send-test-post <postid>` that uses `sendPostToTestEmail` from the command line.

### 4. Sending logic

Expand `subscriberRepository`:

- [x] `getActiveSubscribersForPost` that finds all the subscribers who will receive this post based on the post categories.

And a new table / repository `email_list_sent_posts`

- [x] Database table / schema. Should have `post_id`, `date`, `subject`, `plaintext` and `html`.
- [x] Add a repository as well.
- [x] Get `email_list_sent_emails` to link to this instead of `post_id`

Expand `email-list-mailer` with these functions:

- [ ] Get all current subscribers for a post based on its categories and their preferences (using the repository)
- [ ] A function to check for new posts that haven't been sent yet. (We may want a new DB table to track which posts have been sent generally, not just which posts to individual users)
- [ ] Send a particular post to all subscribers. (Ensure idempotency: check if we've sent that post to them already in the `email_list_sent_emails` table)

---

## Phase 3: Subscriber Management

### 1. Subscription Forms & API Endpoints

Ensure each of these APIs does not give the user's unmasked email address or other sensitive data!

Write unit tests for each endpoint to validate data handling and error conditions.

- [ ] expand `subscribers status to include pending, active, unsubscribed, bounced, spam_report, invalid
- [ ] Create API endpoint: `/api/subscribe`
  - Validate input and add subscriber to the database
  - Send an email to confirm
- [ ] Create API endpoint: `/api/confirm`
- [ ] Create API endpoint: `/api/preferences`
  - Update subscriber category preferences
- [ ] Create API endpoint: `/api/unsubscribe`
  - Mark subscriber status as unsubscribed
- [ ] Create API endpoint: `/api/webhooks/sendgrid` for handling bounce notifications and other events.
- [ ] Create API endpoint: `/api/webhooks/wordpress` for an XML-RPC ping (configured as "Update Services" in Wordpress). Uses `email-list-mailer` to identify new posts and send them.

### 2. Subscription Pages

- [ ] Develop a basic subscribe form structure that can be copy/pasted into WordPress (e.g. `<form><input type="email">...`). It should have category selection as a hidden field.
- [ ] Build frontend pages for:
  - Subscription Confirmation
  - Subscription Management (lets you choose categories, or unsubscribe)
  - Unsubscribe confirmation

### 3. Testing subscription flows

- [ ] Set up basic Playwright scaffolding against local Next.js server
- [ ] Find a way to mock emails for these tests
- [ ] Test basic HTML form -> sends email with confirm link
- [ ] Test click confirm link -> subscription updated
- [ ] Test subscription management -> updated in DB
- [ ] Test unsubscribe link -> updated in DB

---

## Phase 4: Refinement & Deployment

### 1. Production Deployment

- [ ] Finalize environment settings on Digital Ocean VPS.
- [ ] Integrate deployment pipelines with GitHub Actions:
  - Automated deployment, database migration, and backup steps.
- [ ] Monitor detailed logging and scheduled integration tests post-deployment to catch any emerging issues.

---

## Future Considerations (Backlog)

- [ ] Further integration with static site generation if blog architecture changes.
- [ ] Enhanced analytics for open and click rates. Sendgrid may have this data for us.
- [ ] Support for multiple subscription types (daily, weekly digest, etc.)
