# NextFlow - AI Workflow Builder

A pixel-perfect clone of Krea.ai’s workflow builder, built with Next.js, React Flow, and Trigger.dev. Create visual AI workflows with 6 node types, execute them via Google Gemini, and persist everything to PostgreSQL.

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/HarleenKaurML/nextApp.git
cd nextApp
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env.local
```

Edit `.env.local` with your keys:
- `DATABASE_URL` – PostgreSQL connection string (Neon recommended)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` – Clerk publishable key
- `CLERK_SECRET_KEY` – Clerk secret key
- `GOOGLE_GEMINI_API_KEY` – Google AI Studio key
- `TRIGGER_API_KEY` – Trigger.dev key
- `TRANSLOADIT_AUTH_KEY` – Transloadit auth key
- `TRANSLOADIT_AUTH_SECRET` – Transloadit secret

### 3. Database Setup
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Run Locally
```bash
npm run dev
```
Visit http://localhost:3000 and sign in with Clerk.

## 🌐 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add Environment Variables in Vercel dashboard
4. Deploy

### Environment Variables for Production
- `DATABASE_URL` – your production PostgreSQL
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `GOOGLE_GEMINI_API_KEY`
- `TRIGGER_API_KEY`
- `TRANSLOADIT_AUTH_KEY`
- `TRANSLOADIT_AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL` – e.g. `https://your-app.vercel.app`

## 📁 Project Structure

```
src/
├── components/
│   ├── workflow/          # React Flow components
│   ├── nodes/              # Custom node types
│   └── ui/                 # Reusable UI
├── lib/
│   ├── db/                 # Prisma client
│   ├── trigger/             # Trigger.dev client
│   ├── utils/               # Helpers, validation, DAG
│   └── validations/         # Zod schemas
├── stores/                 # Zustand state
├── types/                  # TypeScript definitions
└── app/                    # Next.js App Router
    ├── api/               # API routes
    └── (dashboard)/        # Protected pages
```

## 🛠️ Features

- **6 Node Types**: Text, Image, Video, LLM, Crop Image, Extract Frame
- **Real DAG Execution**: Topological sort with parallel processing
- **Trigger.dev Integration**: All processing tasks run on Trigger.dev
- **Type-Safe Connections**: Prevent invalid node connections
- **Persistence**: Workflows and execution history in PostgreSQL
- **Authentication**: Clerk with protected routes
- **Responsive Design**: Mobile-friendly with collapsible sidebars
- **Sample Workflow**: Pre-built demo showcasing all features

## 🔑 Getting API Keys

1. **Google Gemini**: [AI Studio](https://aistudio.google.com/app/apikey)
2. **Clerk**: [Dashboard](https://dashboard.clerk.com) → Create Application
3. **Trigger.dev**: [Dashboard](https://trigger.dev) → Create Project
4. **Transloadit**: [Dashboard](https://transloadit.com) → Get API Keys
5. **PostgreSQL**: [Neon](https://neon.tech) (free tier available)

## 📖 Usage

1. **Create Workflow**: Drag nodes from left sidebar
2. **Connect Nodes**: Drag from output handles to input handles
3. **Configure Nodes**: Click nodes to edit parameters
4. **Execute Workflow**: Click Execute button (runs DAG in parallel)
5. **View History**: Right sidebar shows execution history
6. **Import Sample**: Click "Import Sample Workflow" to load demo

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License – see LICENSE file for details.
