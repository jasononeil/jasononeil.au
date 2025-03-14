# TODO Checklist for Email Delivery System Project

This checklist covers all the phases and steps required to build the project. Use it to track progress and ensure that no critical tasks are missed.

---

## Phase 1: Core Infrastructure

### Next.js Project Setup & Testing Framework
- [ ] Create a new Next.js project with the basic folder structure.
  - [ ] Scaffold directories (pages, public, components, lib, config, etc.)
  - [ ] Create essential files (package.json, next.config.js if needed)
- [ ] Install project dependencies:
  - [ ] Next.js and React
  - [ ] Jest and any testing libraries (e.g., @testing-library/react)
  - [ ] Other utilities (e.g., dotenv)
- [ ] Set up Jest configuration.
  - [ ] Create jest.config.js (or equivalent).
  - [ ] Ensure proper handling of Next.js environment.
- [ ] Write a “Hello World” test.
  - [ ] Create a sample test file (e.g., __tests__/hello.test.js).
  - [ ] Verify that tests run successfully and output expected results.
- [ ] Implement a basic API endpoint for health check.
  - [ ] Create pages/api/health.js that returns `{ "status": "ok" }`.
  - [ ] Write tests to verify the endpoint responds correctly.

### Database Integration & Subscriber Schema
- [ ] Set up MySQL connection configuration.
  - [ ] Create a configuration file (config/db.js) for managing MySQL connections.
  - [ ] Ensure environment variables and connection pooling are set up.
- [ ] Define the database schema:
  - [ ] Create the `subscribers` table with:
    - id (primary key)
    - email (unique)
    - name (optional)
    - status (active, unsubscribed)
    - created_at, updated_at timestamps
  - [ ] Create the `subscriber_preferences` table with:
    - id (primary key)
    - subscriber_id (foreign key)
    - category_id
    - created_at
  - [ ] Create the `sent_emails` table with:
    - id (primary key)
    - subscriber_id (foreign key)
    - post_id
    - status (sent, failed)
    - sent_at
    - error_message (nullable)
- [ ] Implement migrations or ORM models to create these tables.
- [ ] Write unit tests (or integration tests) to:
  - [ ] Verify database connection works.
  - [ ] Ensure that the schema is created correctly in a test environment.

### WordPress API Integration
- [ ] Create a WordPress integration module (lib/wordpress.js)
  - [ ] Implement a function to fetch blog posts from the WordPress REST API.
  - [ ] Parse and return basic metadata: post title, content, publication date, categories, tags, featured image.
  - [ ] Handle error cases and return a uniform error message.
- [ ] Create a sample API route to use this module.
  - [ ] Create pages/api/wp-posts.js to invoke the WordPress module.
- [ ] Write Jest tests for the WordPress module:
  - [ ] Use mocks to simulate WordPress API responses.
  - [ ] Test for error handling and valid data retrieval.

### Email Templating with Handlebars
- [ ] Set up Handlebars in a module (lib/templates.js)
  - [ ] Configure and initialize Handlebars.
  - [ ] Create a basic email template that contains:
    - Header (blog name/logo)
    - Placeholder for post title and content
    - Footer (unsubscribe link)
- [ ] Write renderEmailTemplate function to produce HTML from provided data.
- [ ] Write unit tests to:
  - [ ] Validate the rendered HTML contains key sections.
  - [ ] Ensure dynamic data is correctly inserted into the template.

### Integration of Core Components
- [ ] Build an API endpoint to compose an email (pages/api/compose-email.js)
  - [ ] Invoke the WordPress module to fetch a given post.
  - [ ] Use the Handlebars templating function to render the email.
  - [ ] Return the rendered HTML in a JSON response.
- [ ] Write integration tests to:
  - [ ] Mock the WordPress API call to return test post data.
  - [ ] Verify that the resulting HTML correctly incorporates the post data.
  - [ ] Ensure that the complete flow works end-to-end.

---

## Phase 2: Email Generation & Delivery

### Enhancing Email Templating & Content Parsing
- [ ] Extend the Handlebars email template:
  - [ ] Include dynamic data (post metadata, featured image, more-from-blog section, etc.)
- [ ] Create a function (e.g., parsePostContent) to convert WordPress block content into email-friendly HTML.
  - [ ] Support common blocks such as headers, lists, images, etc.
  - [ ] Implement fallback logic for unsupported blocks.
- [ ] Write unit tests for content parsing:
  - [ ] Ensure various block types are correctly converted.
  - [ ] Cover edge cases.

### SendGrid Integration for Email Delivery
- [ ] Set up a SendGrid integration module (lib/sendgrid.js)
  - [ ] Implement functions to send emails using the SendGrid API.
  - [ ] Include error handling and appropriate logging for delivery failures.
- [ ] Write tests to mimic SendGrid responses using mocks.
  - [ ] Validate that send functions correctly handle success and error cases.

### API Endpoint for Triggering Email Delivery
- [ ] Create an API endpoint (pages/api/trigger-email/[postId].js)
  - [ ] Accept a post ID, fetch the post using the WordPress API.
  - [ ] Parse and render the email template with the enhanced content.
  - [ ] Send the email using the SendGrid module.
  - [ ] Return a status response detailing delivery success/failure.
- [ ] Write unit and integration tests covering:
  - [ ] Content fetching and parsing
  - [ ] Template rendering with dynamic content
  - [ ] Email sending via SendGrid
  - [ ] Complete end-to-end API flow

---

## Phase 3: Subscriber Management

### API Endpoints for Subscriber Flows
- [ ] Create the `/api/subscribe` endpoint:
  - [ ] Validate incoming subscription data.
  - [ ] Insert new subscriber records into the database.
  - [ ] Return success/error messages.
- [ ] Create the `/api/preferences` endpoint:
  - [ ] Allow subscribers to update their preferences (e.g., content categories).
  - [ ] Validate input and update database records.
- [ ] Create the `/api/unsubscribe` endpoint:
  - [ ] Handle unsubscribe requests (mark subscriber as inactive or remove).
  - [ ] Ensure secure processing of unsubscribe requests.

### Frontend Forms for Subscription Management
- [ ] Develop embeddable HTML forms or React components:
  - [ ] Subscription form (with email input, etc.) for WordPress.
  - [ ] Preference management form.
  - [ ] Unsubscribe form.
- [ ] Write integration tests that:
  - [ ] Validate full subscriber lifecycle (subscribe, update preferences, unsubscribe).
  - [ ] Ensure endpoints handle form submissions correctly.

---

## Phase 4: Refinement & Deployment

### Error Handling, Logging, and Analytics
- [ ] Enhance error logging across all modules:
  - [ ] Implement file-based logging with timestamps and context.
  - [ ] Integrate logging into the API endpoints and external API calls.
- [ ] Record delivery information:
  - [ ] Update `/api/trigger-email` endpoint to log email send statuses (success, failure, error messages).
  - [ ] Insert send status into the `sent_emails` table.
- [ ] Refine email templates:
  - [ ] Ensure mobile-responsive design.
  - [ ] Validate inline CSS for responsiveness across devices.

### Deployment Preparations
- [ ] Create deployment artifacts:
  - [ ] Dockerfile(s) for containerization.
  - [ ] Environment configuration files (e.g., .env.example)
- [ ] Update documentation:
  - [ ] Deployment steps.
  - [ ] Configuration parameters and environment variables.
- [ ] Write final end-to-end integration tests:
  - [ ] Validate the complete flow in a production-like environment.
  - [ ] Ensure all components (Next.js, database, SendGrid, WordPress integration) are working together correctly.

---

## General & Additional Tasks
- [ ] Review inline documentation and ensure clarity.
- [ ] Verify that every module is covered by both unit and integration tests.
- [ ] Regularly update the TODO checklist as new tasks emerge from development and testing.

---

This checklist is designed to guide the development process and ensure incremental progress through small, manageable tasks. Mark items as complete upon successful implementation and testing of each step.
