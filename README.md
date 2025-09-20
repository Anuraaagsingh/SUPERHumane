# SUPERHumane - Superhuman Clone

A production-quality, keyboard-first email client built with Next.js, inspired by Superhuman's design and functionality.

## 🚀 Live Demo

- **Production**: [super-humane-8rpq82ajw-anurags-projects-47784640.vercel.app](https://super-humane-8rpq82ajw-anurags-projects-47784640.vercel.app)
- **GitHub**: [github.com/Anuraaagsingh/SUPERHumane](https://github.com/Anuraaagsingh/SUPERHumane)

## ✨ Features

- 🚀 **Ultra-fast performance** with optimistic UI updates
- ⌨️ **Keyboard-first navigation** with Gmail-like shortcuts
- 📧 **Multi-provider support** (Gmail, Outlook, IMAP)
- 📝 **Smart snippets** with team sharing
- ⏰ **Send later** and follow-up reminders
- 🔄 **Split inbox** with custom rules
- 🌙 **Dark/light themes**
- 🔗 **Shareable message views**
- 📱 **Responsive design**

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Queue**: Redis + BullMQ
- **Email APIs**: Gmail API, Microsoft Graph, IMAP/SMTP
- **Auth**: Supabase Auth with OAuth

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/Anuraaagsingh/SUPERHumane.git
cd SUPERHumane
npm install
```

### 2. Environment Setup

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/login/callback

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
```

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `scripts/001-initial-schema.sql`
3. Enable Google OAuth in Supabase Auth settings
4. Add your domain to the allowed origins

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/login/callback` (development)
   - `https://your-domain.vercel.app/login/callback` (production)

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## ⌨️ Keyboard Shortcuts

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

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── inbox/             # Main inbox interface
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/                # Base UI components
│   ├── inbox/             # Email-specific components
│   └── keyboard/          # Keyboard navigation
├── lib/                   # Utilities and services
│   ├── email/             # Email sync services
│   ├── jobs/              # Background job handlers
│   └── utils.ts           # Common utilities
└── scripts/               # Database migrations
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Migrations

Run the SQL scripts in the `scripts/` directory in order:

1. `001-initial-schema.sql` - Core database schema
2. `002-jobs-schema.sql` - Job queue tables
3. `create-demo-user.sql` - Demo user data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [Superhuman](https://superhuman.com)
- Built with [Next.js](https://nextjs.org)
- UI components from [Radix UI](https://radix-ui.com)
- Styling with [Tailwind CSS](https://tailwindcss.com)

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

Made with ❤️ by [Anurag Singh](https://github.com/Anuraaagsingh)