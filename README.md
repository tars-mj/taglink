# TagLink

Intelligent link management with AI-assisted tagging and search.

## About

TagLink is a web application for organizing and managing saved links. It automatically fetches page metadata, generates AI-powered descriptions, and suggests tags to make searching easier.

## Key Features

- **Link Management** - add, edit, delete, and rate links
- **Automatic Scraping** - fetch titles, descriptions, and metadata from pages
- **AI-Generated Descriptions** - automatic content descriptions using OpenRouter API
- **Tag System** - organize links with tags, including create, merge, and delete operations
- **Advanced Search** - filter by tags, ratings, and full-text search
- **Statistics** - view counts of links, tags, and ratings
- **Personalization** - display settings (list/grid), items per page
- **Keyboard Shortcuts** - quick navigation and actions

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router and Server Components
- **TypeScript** - static typing
- **Tailwind CSS** - styling
- **shadcn/ui** - UI components
- **React Query** - state management and data caching

### Backend
- **Supabase** - PostgreSQL database and authentication
- **Server Actions** - API endpoints in Next.js

### AI & Scraping
- **OpenRouter API** - AI description generation
- **Playwright** - web scraping for page metadata

### Testing & CI/CD
- **Playwright** - E2E tests (28 tests)
- **Vitest** - unit tests
- **GitHub Actions** - CI/CD pipeline
- **ESLint** - linting
- **TypeScript** - type checking

## Database Structure

- `users` - user data (Supabase Auth)
- `links` - saved links with metadata and AI status
- `tags` - tags for categorization
- `link_tags` - many-to-many relationship between links and tags
- `user_preferences` - user settings

## Local Development

### Requirements
- Node.js 20.x
- npm
- Supabase account
- OpenRouter API key (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/taglink-10x2devs.git
cd taglink-10x2devs

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# Fill in values in .env.local

# Run development server
npm run dev
```

Application will be available at `http://localhost:3000`

### Available Commands

```bash
npm run dev          # Run development server
npm run build        # Production build
npm run start        # Run production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm test             # Run unit tests
npm run test:e2e     # Run E2E tests
```

## CI/CD

The project uses GitHub Actions to automatically run:
- Code linting
- TypeScript type checking
- Unit tests
- E2E tests
- Application build

The `main` branch is protected - changes only possible through Pull Requests with passing tests.

## License

MIT

## Author

Maciej Judka
