# Email Delivery System for jasononeil.au (a WordPress Blog)

## Project Overview

This is a small Next.js project to help deliver blog posts via email to people who have subscribed.

I want just enough custom functionality that an off-the-shelf wordpress plugin like MailPoet wasn't my preferred option.

## Requirements

### WordPress Plugins

#### VIP Block Data API
This application requires the [VIP Block Data API](https://github.com/Automattic/vip-block-data-api) WordPress plugin to access block data from posts.

Installation instructions:
1. Download the ZIP file from the [GitHub repository](https://github.com/Automattic/vip-block-data-api/releases)
2. In your WordPress admin panel, go to Plugins > Add New > Upload Plugin
3. Choose the downloaded ZIP file and click "Install Now"
4. After installation, activate the plugin

The plugin provides an API endpoint at `/wp-json/vip-block-data-api/v1/posts/<post_id>/blocks` that this application uses to retrieve block data for rendering posts.

## Project Goals

- **Improved Email Design:** Create customizable, mobile-responsive email templates that incorporate WordPress content in an email-friendly format.
- **Robust Subscription Management:** Facilitate seamless subscription, preference updates, and unsubscription through dedicated API endpoints and embeddable forms.
- **Headless Architecture:** Decouple email delivery functionality from the WordPress core, enabling independent evolution and scaling of the email system.
- **Enhanced Delivery Reliability:** Leverage SendGrid for efficient email distribution while handling bounces and failures gracefully.
- **Comprehensive Logging & Analytics:** Enable detailed tracking of system operations and email delivery statuses to support troubleshooting and future optimizations.

## Intended Architecture

- **Next.js Frontend & API Routes:**
  - The application uses Next.js to serve both the frontend and API endpoints.
  - It will host pages for subscribing, managing subscriptions, and unsubscribing.
  - It will host API routes for sending emails.
- **MySQL Database Integration:**
  - The system utilizes a MySQL database (shared with the WordPress instance) to manage subscriber information, preferences, and records of sent emails.
- **WordPress REST API Communication:**
  - A dedicated module handles communication with the WordPress REST API, ensuring blog post content, metadata, and media are fetched and transformed appropriately for email.
- **Handlebars Templating Engine:**
  - Handlebars is used for dynamic email content generation, allowing customizable and maintainable email templates.
- **SendGrid Email Delivery:**
  - Email sending is powered by Twilio SendGrid, because email sender reputations are hard.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
