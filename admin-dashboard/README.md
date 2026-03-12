# Admin Dashboard

Standalone React SPA for managing the Lifestyle Medicine & Gospel Medical Evangelism Knowledge Platform content.

## Tech Stack

- **React 19** (JSX, no TypeScript)
- **Vite 7** — build tool and dev server
- **React Router 7** — client-side routing
- **Tailwind CSS 3** — utility-first styling
- **Axios** — HTTP client for API communication
- **React Flow** — interactive knowledge graph and mindmap visualizations
- **Recharts** — analytics charts
- **TipTap** — rich text editor
- **SweetAlert2** — toast notifications and confirmation dialogs
- **i18next** — internationalization
- **dnd-kit** — drag-and-drop (sortable lists)
- **Lucide React** — icons

## Getting Started

```bash
cd admin-dashboard
npm install
npm run dev       # Starts Vite dev server on :5173
```

**Login credentials** (after seeding):
- Email: admin@example.com
- Password: password

The dashboard connects to the Laravel API at the URL configured in `lib/api.js` (default: `http://localhost:8000/api/v1`).

**Prerequisites:**
1. Laravel API is running (`php artisan serve`)
2. Database is migrated and seeded
3. CORS is configured in Laravel

## Project Structure

```
src/
├── App.jsx                 # Root component — defines all routes
├── main.jsx                # Entry point — renders App with providers
├── contexts/               # React Context providers
│   ├── AuthContext.jsx      # Auth state, token, 30-min timeout
│   └── NotificationContext.jsx  # Toast notification system
├── features/               # Feature modules (one per domain entity)
│   ├── ai-generator/       # AI content generation wizard
│   ├── analytics/          # Dashboard charts and metrics
│   ├── auth/               # Login page
│   ├── bible/              # Bible verse explorer
│   ├── care-domains/       # NEWSTART+ domain management
│   ├── conditions/         # Medical condition CRUD + relationships
│   ├── content-tags/       # Tag management
│   ├── dashboard/          # Admin home dashboard
│   ├── egw-references/     # Ellen G. White reference management
│   ├── evidence/           # Evidence entry management
│   ├── import/             # Bulk data import
│   ├── interventions/      # Intervention CRUD + protocols
│   ├── knowledge-graph/    # Interactive graph + mindmap (~42 files)
│   ├── profile/            # User profile settings
│   ├── recipes/            # Recipe management
│   ├── references/         # Academic reference management
│   ├── scriptures/         # Scripture management
│   ├── search/             # Global search
│   └── users/              # User management (admin only)
├── components/             # Shared components
│   ├── layout/             # Layout shell (Header, Sidebar, Footer, BottomNav)
│   ├── shared/             # Reusable business components (StatusBadge, MediaUploader, etc.)
│   ├── relationships/      # Sortable relationship editors
│   ├── editor/             # TipTap rich text editor wrapper
│   ├── ui/                 # Generic UI primitives (Modal, Pagination, etc.)
│   └── skeleton/           # Loading skeleton components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   ├── api.js              # Axios instance with auth interceptors
│   ├── swal.js             # SweetAlert2 toast helpers
│   └── sanitize.js         # HTML sanitization for user content
└── i18n/                   # Internationalization locale files
```

See `src/features/README.md` and `src/components/README.md` for detailed documentation of each module and component.

## Key Patterns

### Authentication
`AuthContext` manages the Sanctum bearer token. On login, the token is stored in memory and localStorage. An inactivity timer (30 minutes) automatically logs the user out. The Axios instance in `lib/api.js` injects the token into every request header.

### Feature Module Convention
Each feature module follows this pattern:
- **List page** (e.g., `Conditions.jsx`) — table/card view with search, filters, pagination
- **Form page** (e.g., `ConditionForm.jsx`) — create/edit form, used for both operations
- **Detail page** (e.g., `ConditionDetail.jsx`) — read-only view with all relationships
- **`index.js`** — re-exports for clean imports
- **`components/`** — feature-specific sub-components (optional)

### API Communication
All API calls use the shared Axios instance from `lib/api.js`:
```js
import api from '../../lib/api';
const { data } = await api.get('/conditions', { params: { search, page } });
```

### Notifications
```js
import { useNotification } from '../../contexts/NotificationContext';
const { showSuccess, showError } = useNotification();

import { Toast } from '../../lib/swal';
Toast.fire({ icon: 'success', title: 'Saved!' });
```

### Color Scheme
Inspired by the Family & Lifestyle Medicine logo:
- **Primary (Red):** Buttons, accents, active states
- **Secondary (Blue):** Sidebar, secondary elements

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (:5173) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Run Prettier with auto-fix |
| `npm run format:check` | Check Prettier formatting |

---

Built for Family & Lifestyle Medicine Lansing
