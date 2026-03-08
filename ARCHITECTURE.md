# Inbox Concierge — Frontend Architecture

> **Keep this document up to date.** When you add, remove, or change components, contexts, types, API calls, or data flows, update the relevant sections here so this file stays accurate for future development.

## Overview

A React SPA that connects to a user's Gmail account and displays their email threads organized into AI-powered categories. Users can view, reclassify, and manage categories through a clean Gmail-inspired interface. Reclassifications feed back into the AI to improve future sorting.

**Stack:** React 19, TypeScript, Vite, CSS Modules, React Context API, `@dnd-kit/react` for drag-and-drop.

## Core Features

- **Google OAuth login** — one-click sign in, token stored in `localStorage`
- **Demo account** — "Try Demo Account" button for instant access without Google OAuth
- **AI-classified inbox** — emails sorted into user-defined categories (defaults provided)
- **Category management** — create, edit, delete categories via modal; triggers full reclassification
- **Reclassify feedback** — drag-and-drop or reclassify button to correct classifications; each correction teaches the AI
- **AI preference notes** — viewable/editable in the category modal; auto-generated from user corrections
- **Responsive design** — collapsible sidebar drawer on mobile, adapted email layout, touch-friendly interactions
- **Persistent state** — active category tab saved to `localStorage`

## Project Structure

```
src/
├── main.tsx                  # Entry point, renders provider tree
├── App.tsx                   # Root component, auth gate + inbox view
├── index.css                 # Global styles and CSS variables
├── types/index.ts            # Shared TypeScript interfaces
├── services/api.ts           # API client (fetch wrapper + all endpoints)
├── context/
│   ├── AuthContext.tsx        # Auth state, login/logout, token management
│   └── EmailContext.tsx       # Emails, categories, active tab, sidebar state
└── components/
    ├── Auth/LoginButton.tsx   # Google sign-in button (unauthenticated view)
    ├── Layout/Layout.tsx      # Header + body shell, hamburger menu, overlay
    ├── Loader/Loader.tsx      # Bouncing dots loading animation
    ├── Sidebar/
    │   ├── Sidebar.tsx        # Category tabs list + "Manage Categories" button
    │   └── CategoryTab.tsx    # Individual tab (drop target for drag-and-drop)
    ├── EmailList/
    │   ├── EmailList.tsx      # Filtered email list + tip banner
    │   └── EmailItem.tsx      # Single email row (draggable, reclassify menu, "New" badge)
    └── CategoryModal/
        └── CategoryModal.tsx  # Modal for editing categories + AI notes
```

## Provider Tree

```
AuthProvider
  └── EmailProvider
        └── App
```

`AuthProvider` wraps everything so auth state is globally available. `EmailProvider` sits inside it because email/category operations require authentication.

## Contexts

### AuthContext

Manages the authentication lifecycle:

- On mount, checks for a `?token=` URL param (redirect from OAuth callback) or an existing token in `localStorage`
- Validates the token by calling `GET /api/auth/me`
- Exposes `user`, `loading`, `login()`, `logout()`
- `login()` redirects to the backend's OAuth endpoint
- `loginDemo()` calls the demo endpoint, stores the JWT, and fetches user info — no redirect needed
- `logout()` clears token from memory and storage

### EmailContext

Central state for all email and category data:

| State | Type | Purpose |
|---|---|---|
| `emails` | `EmailThread[]` | All fetched email threads |
| `categories` | `Category[]` | User's categories |
| `activeCategory` | `string \| null` | Selected tab (`null` = "All"), persisted to `localStorage` |
| `loading` | `boolean` | Loading state for data fetches |
| `error` | `string \| null` | Error message display |
| `sidebarOpen` | `boolean` | Mobile sidebar drawer state |

Key functions:

- **`fetchEmails()`** — calls `GET /api/emails`, which fetches from Gmail and classifies unclassified threads server-side
- **`fetchCategories()`** — loads categories, preserves active tab if it still exists, defaults to "All" otherwise
- **`moveEmail(emailId, newCategoryId)`** — optimistic UI update (immediately moves the email in state), then calls `PATCH /api/emails/{id}/category`. Rolls back on failure.
- **`updateCategories(cats)`** / **`resetCategories()`** — updates/resets categories, then polls for reclassified emails after a 3-second delay (background reclassification runs server-side)

## Components

### App

Acts as a gate: shows `Loader` while auth loads, `LoginButton` if unauthenticated, or `InboxView` if authenticated. The login page includes both a Google sign-in button and a "Try Demo Account" button. `InboxView` wires up `DragDropProvider` from `@dnd-kit/react` and handles the `onDragEnd` callback to trigger `moveEmail`.

### Layout

Renders the header (logo, hamburger menu on mobile, user email, sign out) and the body container. Manages the mobile overlay backdrop that closes the sidebar on tap.

### Sidebar

Renders an "All" tab (shows total email count) followed by category tabs with per-category counts. Each `CategoryTab` is a `useDroppable` target for drag-and-drop. Clicking a tab sets the active category and closes the sidebar on mobile. The "Manage Categories" button opens the `CategoryModal`.

### EmailList

Filters emails by `activeCategory` (or shows all if `null`). Renders a dismissible tip banner (persisted via `localStorage`) that explains drag-and-drop and AI learning. Shows `Loader` during loading, error banner on failure, or "No emails" for empty categories.

### EmailItem

Each row is `useDraggable` for drag-and-drop. Features:

- **Sender, subject, snippet, date** — columnar layout with fixed-width sender and badge slot for alignment
- **"New" badge** — appears for emails classified in the last 30 seconds, auto-fades after 3 seconds
- **Category pill** — shown only in the "All" tab
- **Click to open** — entire row is clickable, opens the email in Gmail
- **Hover actions (desktop)** — date fades out, replaced by "Open in Gmail" button and reclassify icon
- **Reclassify dropdown** — lists other categories, triggers `moveEmail` on selection
- **Mobile layout** — sender + date on first line, subject on second line, no snippet, reclassify always visible, no "Open in Gmail" button (row click handles it)

### CategoryModal

Modal for managing categories and viewing/editing AI preference notes. Categories are initialized from context into local state (no `useEffect` — uses `useState` initializer since the modal always mounts fresh). Notes are fetched from `GET /api/categories/notes` on mount. Both are saved together when the user clicks Save.

## API Client (`services/api.ts`)

A thin wrapper around `fetch`:

- `request<T>(path, options)` — adds auth header, content-type, handles errors
- `setAuthToken(token)` — called by `AuthContext` to set/clear the bearer token

All endpoints are exported as `api.methodName()` with typed return values.

## Styling

- **CSS Modules** — scoped styles per component, no global class name conflicts
- **CSS Variables** — defined in `index.css` for colors, fonts, radii
- **Mobile breakpoint** — `768px`, used via `@media (max-width: 768px)` in component CSS
- **Design language** — minimalist, monochrome (grays/blacks), rounded corners, Gmail-inspired spacing and interactions

## Data Flow

1. User signs in → `AuthContext` stores JWT → `App` renders `InboxView`
2. `InboxView` mounts → calls `fetchCategories()` and `fetchEmails()` in parallel
3. Backend fetches Gmail threads, classifies unclassified ones, returns all
4. User clicks a category tab → `EmailList` filters by `activeCategory`
5. User drags an email to a tab (or uses reclassify button):
   - Frontend optimistically updates the email's category
   - Calls `PATCH /api/emails/{id}/category`
   - Backend updates DB and kicks off background AI feedback learning
6. User opens "Manage Categories" → edits categories/notes → saves:
   - Categories and notes are saved via separate API calls
   - Backend triggers background reclassification of all emails
   - Frontend polls for updated emails after a 3-second delay

## Types (`types/index.ts`)

```typescript
User          { id, email, name }
Category      { id, name, description }
EmailThread   { id, gmail_thread_id, subject, sender, snippet, date,
                gmail_link, category_id, category_name, is_user_corrected,
                classified_at }
EmailsResponse { emails }
CategoryUpdate { id?, name, description }  // id present = existing, absent = new
```
