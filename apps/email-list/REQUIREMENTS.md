# Email Delivery System for WordPress Blog

This document outlines the requirements and technical specifications for a headless email delivery system that integrates with a WordPress blog via the REST API.

## Project Overview

Create a standalone email delivery service that connects to WordPress via its REST API, allowing for customized HTML/CSS email templates and better control over email content and subscriber management.

## Architecture

- **Headless Architecture**: Separate JavaScript-based application that communicates with WordPress via REST API
- **Frontend**: Next.js application hosted on the same Digital Ocean VPS as the WordPress installation
- **Database**: Separate tables/schema on the existing database for subscriber management
- **Email Delivery**: Integration with Twilio SendGrid for sending emails
- **Templating**: Handlebars for email templates

## Core Requirements

### Content Management
1. Pull blog post content from WordPress via REST API
2. Support for different content types (long-form posts, blogmarks, etc.)
3. Process WordPress block editor content into email-friendly HTML
4. Extract metadata (categories, tags, featured images) for inclusion in emails
5. Handle edge cases for unsupported content blocks with appropriate fallbacks

### Email Templates
1. Custom HTML/CSS templates using Handlebars
2. Sans-serif font styling to match blog aesthetics
3. Support for featured images hosted on the WordPress server
4. "More from the blog" section showing recent posts since the last email
5. Include category and tag information in the email design
6. Mobile-responsive design for all email templates

### Subscriber Management
1. Custom database tables to store subscriber information
2. Store subscriber preferences for content categories
3. Basic subscribe form that can be embedded in WordPress (`<form><input type=email>`)
4. Separate pages for subscription management, preferences, and unsubscribes
5. Secure handling of subscriber data and preferences

### Email Triggering & Delivery
1. Automatic email generation based on WordPress categories/tags
2. Integration with WordPress hooks or scheduled checks via the API
3. Option to trigger emails via a simple HTTP call from WordPress
4. SendGrid integration for reliable delivery
5. Handling of bounces and delivery failures

### Analytics & Logging
1. File-based logging for system operations and errors
2. Basic tracking of send status for troubleshooting

## Technical Details

### WordPress Integration
1. Use WordPress REST API to fetch:
   - Post content, title, and publication date
   - Categories and tags
   - Featured images and media
   - Author information

2. Content Parsing:
   - Convert WordPress blocks to email-friendly HTML
   - Extract and handle embedded media
   - Maintain basic formatting (headers, lists, blockquotes, etc.)
   - Analyze existing content types to ensure comprehensive coverage

### Subscriber Database Schema
```
subscribers:
  - id (primary key)
  - email (unique)
  - name (optional)
  - status (active, unsubscribed)
  - created_at
  - updated_at

subscriber_preferences:
  - id (primary key)
  - subscriber_id (foreign key)
  - category_id
  - created_at

sent_emails:
  - id (primary key)
  - subscriber_id (foreign key)
  - post_id
  - status (sent, failed)
  - sent_at
  - error_message (nullable)
```

### Email Template Structure
1. Header with blog name/logo
2. Post title and metadata (date, categories, author)
3. Featured image (if available)
4. Post content (converted from WordPress blocks)
5. "More from the blog" section with recent posts
6. Footer with unsubscribe link and preference management

### API Endpoints
1. `/api/subscribe` - Handle new subscriptions
2. `/api/preferences` - Update subscriber preferences
3. `/api/unsubscribe` - Process unsubscribe requests
4. `/api/trigger-email/:postId` - Manual trigger for email sending

## Error Handling
1. Log all errors to files with timestamps and context
2. Graceful degradation for unsupported WordPress blocks
3. Retry logic for failed API calls to WordPress
4. Fallback mechanisms for email delivery issues

## Testing Plan

1. **Unit Tests**:
   - Content parsing and transformation
   - Template rendering
   - Email generation

2. **Integration Tests**:
   - WordPress API connectivity
   - Database operations
   - SendGrid integration

3. **End-to-End Tests**:
   - Full subscription flow
   - Email delivery workflow
   - Unsubscribe process

4. **Content Type Testing**:
   - Test with various WordPress block types
   - Edge case testing with complex/unusual content

5. **Local Development Testing**:
   - Mock WordPress API responses for local testing
   - Docker-based local environment with MySQL
   - Hot-reloading for template and code changes
   - Local SendGrid API sandbox mode
   - Test data generation scripts

6. **CI/CD with GitHub Actions**:
   - Automated test runs on pull requests
   - Linting and code quality checks
   - Type checking with TypeScript
   - Security scanning for dependencies
   - Build verification and deployment previews
   - Automated deployment to staging/production

## Future Considerations
1. Multiple subscription types (daily, weekly digest, etc.)
2. Enhanced analytics and tracking
3. A/B testing for email templates
4. Integration with static site generation if blog architecture changes

## Development Phases

### Phase 1: Core Infrastructure
- Set up Next.js application structure
- Create subscriber database schema
- Implement basic WordPress API integration
- Develop simple Handlebars templates

### Phase 2: Email Generation & Delivery
- Implement block content parsing
- Create email composition system
- Integrate with SendGrid
- Set up triggering mechanism

### Phase 3: Subscriber Management
- Build subscription forms and pages
- Implement preference management
- Create unsubscribe functionality
- Test full subscriber lifecycle

### Phase 4: Refinement & Deployment
- Optimize content parsing for all block types
- Refine email templates for responsiveness
- Implement logging and monitoring
- Deploy to production environment

## Technical Stack
- Next.js for the application framework
- Node.js for backend logic
- MySQL for database (shared with WordPress)
- Handlebars for email templates
- Twilio SendGrid for email delivery
- REST API for WordPress communication

This headless approach provides flexibility while leveraging the existing WordPress content management capabilities, meeting the requirement for improved email delivery with minimal friction in the content creation workflow.
