# Kingdom of Chess client

Responsive React frontend for the Kingdom of Chess tournament platform.

## Requirements

- Node.js 22 or newer
- The sibling NestJS server running at the configured API and socket URLs

## Setup

```sh
npm install
Copy-Item .env.example .env
npm run dev
```

The server currently defaults to port `3000`; the checked-in server `.env` sets `PORT=8000`, so the client example uses port `8000` too. Set the client values to match your backend:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SOCKET_URL=http://localhost:8000
```

`VITE_API_BASE_URL` includes the `/api/v1` prefix. `VITE_SOCKET_URL` is the Socket.IO server origin without a namespace. Authenticated REST and socket connections send the server's HttpOnly `auth_token` cookie; the client never reads or stores the token.

## Scripts

```sh
npm run dev
npm run build
npm run lint
npm run preview
```

## Implemented flows

- Cookie-backed login, session verification, role guards, and logout.
- Student and coach dashboards, tournament discovery and details, joining, coach creation/editing/status changes/deletion, participants, and standings.
- Student matchmaking over the backend `/matchmaking` Socket.IO namespace.
- Live match recovery from the match REST endpoint and `/matches` socket namespace, authoritative move submissions, promotion selection, server-synchronized clocks, resignation, and game results.

The backend match response currently exposes player IDs rather than display names, and it does not provide a match-history list endpoint. The UI uses those IDs where necessary and does not fabricate recent-match data. Coach tournament lists are filtered by the `createdBy` value returned by the backend.

The backend does not expose a matchmaking queue-status or active-match discovery endpoint. After a full page reload while queued, the client cannot know the queue's authoritative state; selecting the same tournament and trying to queue again returns the backend's duplicate-queue error, after which the queue can be cancelled. If a match is created while the browser has no authenticated socket connected, the backend does not replay the missed match-found event on reconnect. A queue recovery endpoint or server replay would be needed to close those gaps.
