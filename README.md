# TweetToCourse - AI Course Alchemist

Transform Twitter threads and tweets into structured mini-courses with AI. Perfect for content creators, coaches, and solopreneurs.

## Features

- 🧠 **AI-Powered**: GPT-4 analyzes your content and creates structured 5-module courses
- 📄 **Export Ready**: Download as PDF or export to Notion for immediate use  
- ⚡ **Lightning Fast**: Generate professional courses in seconds, not hours
- 💰 **Freemium Model**: Free tier with 1 generation, Pro ($19/mo) plan
- 🔐 **Secure Authentication**: Powered by Clerk
- 📊 **Usage Tracking**: Monitor generations and exports

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase
- **AI**: OpenAI GPT-4
- **PDF Generation**: jsPDF
- **Export**: Notion API integration
- **Payments**: Stripe/LemonSqueezy integration ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Clerk account
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.local.example .env.local
   ```

4. Fill in your environment variables in `.env.local`

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Homepage
├── components/         # Reusable React components
├── lib/               # Utility functions and configurations
│   ├── config.ts      # App configuration
│   └── utils.ts       # Helper functions
└── types/             # TypeScript type definitions
```

## Environment Variables

See `.env.local.example` for all required environment variables including:

- OpenAI API key
- Clerk authentication keys
- Supabase configuration
- Payment provider keys
- Notion API key

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT License - see LICENSE file for details.