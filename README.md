# HiSpeed Mail - Superhuman Clone

A production-quality, keyboard-first email client built with Next.js, inspired by Superhuman's design and functionality.

## Features

- 🚀 **Ultra-fast performance** with optimistic UI updates
- ⌨️ **Keyboard-first navigation** with Gmail-like shortcuts
- 📧 **Multi-provider support** (Gmail, Outlook, IMAP)
- 📝 **Smart snippets** with team sharing
- ⏰ **Send later** and follow-up reminders
- 🔄 **Split inbox** with custom rules
- 🌙 **Dark/light themes**
- 🔗 **Shareable message views**
- 📱 **Responsive design**

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, TailwindCSS
- **Backend**: Next.js API routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Queue**: Redis + BullMQ
- **Email APIs**: Gmail API, Microsoft Graph, IMAP/SMTP
- **Auth**: Supabase Auth with OAuth

## Quick Start

1. **Clone and install**:
   \`\`\`bash
   git clone <repo-url>
   cd hispeed-mail
   npm install
   \`\`\`

2. **Set up environment variables**:
   \`\`\`bash
   cp .env.example .env.local
   # Fill in your API keys and database URLs
   \`\`\`

3. **Set up Supabase**:
   - Create a new Supabase project
   - Run the SQL schema from `scripts/001-initial-schema.sql`
   - Enable Google OAuth in Supabase Auth settings

4. **Set up Google OAuth**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Gmail API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs: `http://localhost:3000/auth/callback`

5. **Run development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

## Environment Variables

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback

# Gmail API
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft Graph API (for Outlook)
MICROSOFT_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_SECRET=your_microsoft_client_secret

# Redis (for job queue)
REDIS_URL=your_redis_url

# Database
DATABASE_URL=your_database_url
\`\`\`

## Keyboard Shortcuts

- `⌘K` / `Ctrl+K` - Command palette
- `C` - Compose new email
- `R` - Reply
- `A` - Reply all
- `F` - Forward
- `E` - Archive
- `S` - Snooze
- `G then I` - Go to inbox
- `G then S` - Go to sent
- `J/K` - Navigate up/down
- `Enter` - Open message
- `Esc` - Close/back

## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── inbox/             # Main inbox interface
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── email/            # Email-specific components
│   └── keyboard/         # Keyboard navigation
├── lib/                  # Utilities and services
│   ├── email/           # Email sync services
│   ├── jobs/            # Background job handlers
│   └── utils.ts         # Common utilities
└── scripts/             # Database migrations
\`\`\`

## Development Roadmap

- [x] Project foundation and auth
- [ ] Email sync pipeline (Gmail + Outlook)
- [ ] Core UI components (inbox, composer)
- [ ] Keyboard navigation system
- [ ] Advanced features (snippets, scheduling)
- [ ] Job system for reminders and send-later
- [ ] Performance optimization and testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
