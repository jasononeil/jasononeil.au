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
- [ ] Create simple HTML/CSS templates with unit tests
- Add header and footer to both templates
  - Header with blog name
  - Footer with unsubscribe link and preference management
- [ ] Ensure basic responsive and sans-serif styling for HTML.

---

## Phase 2: Email Generation & Delivery

### 1. Content Parsing & Transformation

- [ ] Develop a parser to convert WordPress block content into email-friendly HTML and also plain text.
- [ ] Ensure conversion logic handles:
  - Common block types (headers, lists, blockquotes, etc.)
  - Embedded media and fallback for unsupported blocks
- [ ] Early Integration Test:
  - Use the manual trigger test to run the conversion process on all existing WordPress posts and report any parsing anomalies.
  - Write unit tests for each block type conversion scenario.

### 2. Email Composition

- [ ] Build an email composition system:
  - Integrate fetched post content, metadata (categories, tags, publish date, author)
  - Insert featured image if available
- [ ] Create a “More from the blog” section showing recent posts.
- [ ] Implement mobile-responsive design in the email template.
- [ ] Write unit tests to verify that all required content is correctly composed.

### 3. SendGrid Integration

- [ ] Integrate Twilio SendGrid for sending emails.
- [ ] Set up configuration for SendGrid API keys and endpoints.
- [ ] Implement sending functionality with robust error handling:
  - Retry logic for delivery failures
  - Logging of send status and errors
- [ ] Write integration tests for SendGrid endpoints (possibly in sandbox mode).

### 4. Email Triggering Mechanism

- [ ] Implement a trigger mechanism via:
  - Scheduled checks / WordPress hooks (via the API)
  - Manual endpoint `/api/trigger-email/:postId`
- [ ] Test triggering functionality through unit tests and early integration testing.

---

## Phase 3: Subscriber Management

### 1. Subscription Forms & API Endpoints

- [ ] Develop a basic subscribe form that can be embedded in WordPress (e.g. `<form><input type="email">...`).
- [ ] Create API endpoint: `/api/subscribe`
  - Validate input and add subscriber to the database
- [ ] Create API endpoint: `/api/preferences`
  - Update subscriber category preferences
- [ ] Create API endpoint: `/api/unsubscribe`
  - Mark subscriber status as unsubscribed
- [ ] Write unit tests for each endpoint to validate data handling and error conditions.

### 2. Subscription Pages

- [ ] Build frontend pages for:
  - Subscription Management
  - Subscriber Preferences
  - Unsubscribe confirmation
- [ ] Ensure secure handling of subscriber data.
- [ ] Write integration tests simulating full subscriber interactions.

---

## Phase 4: Analytics, Logging, and Testing

### 1. Logging & Error Handling

- [ ] Set up file-based logging for system operations and errors with timestamps and context.
- [ ] Implement fallback mechanisms for:
  - Unsupported WordPress blocks
  - Email delivery issues
- [ ] Write unit tests that simulate errors to ensure correct logging and recovery.

### 2. Comprehensive Testing

- [ ] End-to-End Tests:
  - Complete subscription flow (signup → email trigger → unsubscribe)
  - Test manual email triggering via `/api/trigger-email/:postId`
- [ ] Configure CI with GitHub Actions:
  - Linting, unit, and integration tests on every pull request.
- [ ] Plan for automated deployments and database migration tests.

---

## Phase 5: Refinement & Deployment

### 1. Template and Parsing Refinements

- [ ] Optimize parsing logic for complex cases identified during early integration tests.
- [ ] Enhance email templates for improved responsiveness and data display.
- [ ] Incorporate user feedback from initial tests and adjust as necessary.

### 2. Production Deployment

- [ ] Finalize environment settings on Digital Ocean VPS.
- [ ] Integrate deployment pipelines with GitHub Actions:
  - Automated deployment, database migration, and backup steps.
- [ ] Monitor detailed logging and scheduled integration tests post-deployment to catch any emerging issues.

---

## Future Considerations (Backlog)

- [ ] Support for multiple subscription types (daily, weekly digest, etc.)
- [ ] Enhanced analytics for open and click rates.
- [ ] A/B testing for variant email templates.
- [ ] Further integration with static site generation if blog architecture changes.
