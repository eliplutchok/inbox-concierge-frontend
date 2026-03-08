# Inbox Concierge — Frontend Architecture

> **Keep this document up to date.** When you add, remove, or change components, contexts, types, API calls, or data flows, update the relevant sections here so this file stays accurate for future development.

## Overview

A React SPA that connects to a user's Gmail account and displays their email threads organized into AI-powered categories. Users can view, reclassify, and manage categories through a clean Gmail-inspired interface. Reclassifications feed back into the AI to improve future sorting.

**Stack:** React 19, TypeScript, Vite, CSS Modules, React Context API, `@dnd-kit/react` for drag-and-drop.

## Core Features

- **Google OAuth login** — one-click sign in, token stored in `localStorage`
- **Demo account** — "Try Demo Account" button for instant access without Google OAuth
- **AI-classified inbox** — emails sorted into user-defined categories (defaults provided)
- **Category management** — create, edit, delete categories via modal with "Save" and "Save & Recategorize" options
- **Reclassify feedback** — drag-and-drop or reclassify button to correct classifications; each correction teaches the AI
- **Standalone recategorize** — header button to re-run AI classification on all emails at any time
- **AI preference notes** — viewable/editable in the category modal; auto-generated from user corrections
- **Dirty-state tracking** — Save buttons are disabled when nothing has changed
- **Search** — filter emails by subject or sender
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
    ├── Layout/Layout.tsx      # Header + body shell, hamburger menu, recategorize button, overlay
    ├── Loader/Loader.tsx      # Bouncing dots loading animation
    ├── Toast/Toast.tsx        # Toast notification for feedback confirmations
    ├── Sidebar/
    │   ├── Sidebar.tsx        # Category tabs list + "Manage Categories" button
    │   └── CategoryTab.tsx    # Individual tab (drop target for drag-and-drop)
    ├── EmailList/
    │   ├── EmailList.tsx      # Filtered email list + tip banner
    │   └── EmailItem.tsx      # Single email row (draggable, reclassify menu, "New" badge)
    └── CategoryModal/
        └── CategoryModal.tsx  # Modal for editing categories + AI notes, with Save / Save & Recategorize
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
- Exposes `user`, `loading`, `login()`, `loginDemo()`, `logout()`
- `login()` redirects to the backend's OAuth endpoint
- `loginDemo()` calls the demo endpoint, stores the JWT, and fetches user info — no redirect needed
- `logout()` clears token from memory and storage

### EmailContext

Central state for all email and category data:

| State | Type | Purpose |
|---|---|---|
| `emails` | `EmailThread[]` | All fetched email threads |
| `categories` | `Category[]` | User's categories |
| `activeCategory` | `string` | Selected tab (`"all"` = All), persisted to `localStorage` |
| `searchQuery` | `string` | Search filter for email subject/sender |
| `toast` | `string \| null` | Toast notification message |
| `loading` | `boolean` | Loading state for data fetches |
| `error` | `string \| null` | Error message display |
| `sidebarOpen` | `boolean` | Mobile sidebar drawer state |

Key functions:

- **`fetchEmails()`** — calls `GET /api/emails`, which fetches from Gmail and classifies unclassified threads server-side
- **`fetchCategories()`** — loads categories, preserves active tab if it still exists, defaults to first category otherwise
- **`moveEmail(emailId, newCategoryId)`** — optimistic UI update (immediately moves the email in state), then calls `PATCH /api/emails/{id}/category`. Rolls back on failure. Shows a toast confirming feedback was received.
- **`updateCategories(cats, reclassify?)`** — saves categories via `PUT /api/categories`. If `reclassify` is true, follows up with `POST /api/emails/reclassify` and updates email state from the response.
- **`resetCategories()`** — resets categories via `POST /api/categories/reset`, then calls `POST /api/emails/reclassify` to reclassify all emails.
- **`reclassifyEmails()`** — calls `POST /api/emails/reclassify` directly, updates email state from the synchronous response. Used by the standalone Recategorize button.

## Components

### App

Acts as a gate: shows `Loader` while auth loads, `LoginButton` if unauthenticated, or `InboxView` if authenticated. The login page includes both a Google sign-in button and a "Try Demo Account" button. `InboxView` wires up `DragDropProvider` from `@dnd-kit/react` and handles the `onDragEnd` callback to trigger `moveEmail`.

### Layout

Renders the header (logo, hamburger menu on mobile, search bar, recategorize button, user email, sign out) and the body container. The **Recategorize** button triggers `reclassifyEmails()` and is disabled while loading. It includes a tooltip explaining its function. On mobile, only the icon shows (text is hidden). Manages the mobile overlay backdrop that closes the sidebar on tap.

### Sidebar

Renders an "All" tab (shows total email count) followed by category tabs with per-category counts. Each `CategoryTab` is a `useDroppable` target for drag-and-drop. Clicking a tab sets the active category and closes the sidebar on mobile. The "Manage Categories" button opens the `CategoryModal`.

### EmailList

Filters emails by `activeCategory` and `searchQuery`. Renders a dismissible tip banner (persisted via `localStorage`) that explains drag-and-drop and AI learning. Shows `Loader` during loading, error banner on failure, or "No emails" for empty categories.

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

Modal for managing categories and viewing/editing AI preference notes. Categories are initialized from context into local state (no `useEffect` — uses `useState` initializer since the modal always mounts fresh). Notes are fetched from `GET /api/categories/notes` on mount.

**Dirty-state tracking:** The modal compares current items and notes against their initial values. Both save buttons are disabled when nothing has changed.

**Two save actions:**
- **Save** — saves categories and notes without reclassifying. For quick edits where you don't need to re-sort.
- **Save & Recategorize** — saves categories and notes, then triggers full reclassification. The response includes the reclassified emails, so the UI updates immediately when complete.

### Toast

Transient notification bar that appears after user actions (e.g., reclassifying an email). Auto-dismisses after 4 seconds with a manual dismiss option.

## API Client (`services/api.ts`)

A thin wrapper around `fetch`:

- `request<T>(path, options)` — adds auth header, content-type, handles errors
- `setAuthToken(token)` — called by `AuthContext` to set/clear the bearer token

Endpoints:

| Method | Function | Description |
|---|---|---|
| `getLoginUrl()` | — | Returns the OAuth login URL |
| `getDemoToken()` | POST | Gets a JWT for the demo user |
| `getMe()` | GET | Current user info |
| `getEmails()` | GET | Fetch and classify emails |
| `reclassifyEmails()` | POST | Reclassify all emails, returns `EmailsResponse` |
| `updateEmailCategory()` | PATCH | Move a single email to a new category |
| `getCategories()` | GET | List categories |
| `updateCategories()` | PUT | Bulk update categories |
| `resetCategories()` | POST | Reset to defaults |
| `getNotes()` | GET | Get AI preference notes |
| `updateNotes()` | PUT | Update preference notes |

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
   - Toast confirms feedback was received
6. User opens "Manage Categories" → edits categories/notes → saves:
   - **Save:** categories and notes are saved via separate API calls, no reclassification
   - **Save & Recategorize:** saves, then calls `POST /api/emails/reclassify` which returns the reclassified emails synchronously
7. User clicks "Recategorize" button in the header:
   - Calls `POST /api/emails/reclassify` directly
   - Reclassified emails are returned in the response and the UI updates immediately

## Types (`types/index.ts`)

```typescript
User          { id, email, name }
Category      { id, name, description }
EmailThread   { id, gmail_thread_id, subject, sender, snippet, date,
                gmail_link, category_id, category_name, is_user_corrected,
                classified_at }
EmailsResponse { emails, classified_count, total_count }
CategoryUpdate { id?, name, description }  // id present = existing, absent = new
```
