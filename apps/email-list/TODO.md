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
- [ ] Set up Drizzle ORM for MySQL database access
- [ ] Define MySQL database configuration (shared with WordPress)
- [ ] Create schema definitions for custom tables:
  - subscribers
  - subscriber_preferences
  - sent_emails
- [ ] Write Drizzle migrations for schema creation
- [ ] Create database utility functions for common operations
- [ ] Add testing scripts for database connection and migrations
- [ ] Implement repository pattern for subscriber management

### 3. WordPress API Integration

- [ ] Create a module/service to fetch posts via the WordPress REST API.
- [ ] Implement methods to fetch:
  - Posts (content, title, publication date)
  - Categories & tags
  - Featured images, media, and author information
- [ ] Early Risk Mitigation:
  - Develop integration tests using historical and sample WordPress API responses to validate data formats.
  - Write a manually triggerable integration test that fetches every blog post on the live server and attempts to parse each one using our email template. Log any errors or unknown content types.
  - Consider mocking responses of different WordPress API versions (or known WP installations) to ensure stable handling across versions.
- [ ] Add support for MSW in Vitest so we can mock the WP API.
- [ ] Add unit tests for parsing functions and error handling.
- [ ] Implement robust error handling and retry logic on API calls.

### 4. Basic Handlebars Email Templates

- [ ] Set up Handlebars as the templating engine.
- [ ] Create simple HTML/CSS templates:
  - Header with blog name/logo
  - Footer with unsubscribe link and preference management
- [ ] Ensure basic responsive and sans-serif styling.
- [ ] Create unit tests validating template rendering with various sample data inputs.

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
