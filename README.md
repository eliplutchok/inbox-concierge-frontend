# Inbox Concierge — Frontend

React SPA for the Inbox Concierge email classification app. Provides a Gmail-inspired interface for viewing AI-classified emails, reclassifying them via drag-and-drop, managing categories, and editing AI preference notes.

## Quick Start

```bash
npm install
cp .env.example .env  # Set VITE_API_URL if backend is not at localhost:8000
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (default: `http://localhost:8000`) |

## Features

- **Google OAuth** and **demo account** login
- **AI-classified inbox** with drag-and-drop reclassification
- **Category management** modal with Save / Save & Recategorize options
- **AI preference notes** — auto-generated from corrections, fully editable
- **Standalone recategorize** button to re-run classification at any time
- **Search** by subject or sender
- **Responsive design** with mobile sidebar drawer

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical documentation.
