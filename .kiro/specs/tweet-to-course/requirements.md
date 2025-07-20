## Introduction

TweetToCourse (AI Course Alchemist) is a web application that automatically converts Twitter tweets and threads into well-structured mini-courses. The application targets solopreneurs, ghostwriters, coaches, and content creators who want to transform viral content into digital products, lead magnets, and sellable courses. The system processes tweet content using AI to generate organized lessons with summaries, takeaways, and export capabilities.

## Requirements

### Requirement 1

**User Story:** As a content creator, I want to input a tweet or thread URL so that I can convert it into a structured course format.

#### Acceptance Criteria

1. WHEN a user visits the homepage THEN the system SHALL display an input field for tweet/thread URL or manual text input
2. WHEN a user pastes a valid Twitter URL THEN the system SHALL extract and process the tweet content
3. WHEN a user enters manual text content THEN the system SHALL accept the input for processing
4. IF the input is invalid or empty THEN the system SHALL display an appropriate error message

### Requirement 2

**User Story:** As a user, I want the AI to automatically generate a 5-module course structure so that I can have organized, actionable content.

#### Acceptance Criteria

1. WHEN content is submitted for processing THEN the system SHALL use OpenAI GPT-4-turbo to analyze the content
2. WHEN AI processing is complete THEN the system SHALL generate exactly 5 course modules
3. WHEN each module is created THEN the system SHALL include a title, summary, and 1-3 actionable takeaways
4. WHEN the course is generated THEN the system SHALL create an auto-generated course title that is editable by the user
5. WHEN processing occurs THEN the system SHALL display a loading animation with "We're alchemizing your thread..." message

### Requirement 3

**User Story:** As a user, I want to export my generated course as a PDF so that I can use it as a digital product or lead magnet.

#### Acceptance Criteria

1. WHEN a course is successfully generated THEN the system SHALL display a "Download as PDF" button
2. WHEN the download button is clicked THEN the system SHALL generate a PDF using jsPDF library
3. WHEN a user is on the free plan THEN the system SHALL include a watermark on the PDF
4. WHEN a user is on a paid plan THEN the system SHALL generate a PDF without watermark

### Requirement 4

**User Story:** As a user, I want a freemium pricing model so that I can try the service before committing to a paid plan.

#### Acceptance Criteria

1. WHEN a new user accesses the service THEN the system SHALL allow 1 free course generation
2. WHEN a free user generates a course THEN the system SHALL include watermarks and limit features
3. WHEN a free user attempts a second generation THEN the system SHALL prompt for account signup
4. WHEN a user subscribes to Pro ($19/mo) THEN the system SHALL provide unlimited generations, remove watermarks, and enable Notion export

### Requirement 5

**User Story:** As a user, I want user authentication so that I can manage my account and access paid features.

#### Acceptance Criteria

1. WHEN a user clicks "Sign In" THEN the system SHALL provide authentication via Clerk or Supabase Auth
2. WHEN a user is authenticated THEN the system SHALL display a dashboard with their usage and plan status
3. WHEN a user accesses paid features THEN the system SHALL verify their subscription status
4. IF a user is not authenticated and tries to exceed free limits THEN the system SHALL redirect to sign-up

### Requirement 6

**User Story:** As a user, I want a clean, professional interface so that I can easily navigate and use the application.

#### Acceptance Criteria

1. WHEN a user visits the homepage THEN the system SHALL display a logo and tagline "Turn your threads into sellable courses in seconds"
2. WHEN the page loads THEN the system SHALL show a navigation bar with Logo, "How it Works", "Pricing", and "Sign In/Dashboard" links
3. WHEN a course is generated THEN the system SHALL display it in a clean, readable format with clear module separation
4. WHEN displaying results THEN the system SHALL include "Regenerate" and export buttons


### Requirement 8

**User Story:** As a paid user, I want to export courses to Notion so that I can integrate with my existing workflow.

#### Acceptance Criteria

1. WHEN a Pro or Lifetime user generates a course THEN the system SHALL display a "Download as Notion" button
2. WHEN the Notion export is clicked THEN the system SHALL use the Notion API to create a structured document
3. WHEN Notion export is complete THEN the system SHALL provide a link or confirmation of successful export
4. IF a free user attempts Notion export THEN the system SHALL display an upgrade prompt

### Requirement 9

**User Story:** As a business owner, I want payment processing so that I can monetize the application.

#### Acceptance Criteria

1. WHEN a user selects a paid plan THEN the system SHALL integrate with Stripe, LemonSqueezy, or Gumroad for payment processing
2. WHEN payment is successful THEN the system SHALL immediately upgrade the user's account
3. WHEN payment fails THEN the system SHALL display an appropriate error message and maintain free tier access
4. WHEN a subscription is active THEN the system SHALL track usage and billing cycles

