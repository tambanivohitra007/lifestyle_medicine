# Lifestyle Medicine Admin Dashboard

Beautiful admin dashboard for managing the Lifestyle Medicine & Gospel Medical Evangelism Knowledge Platform.

## Features

- 🎨 Beautiful UI with logo-inspired color scheme (Primary Red & Secondary Blue)
- 🔐 Authentication system with protected routes
- 📊 Dashboard with statistics and quick actions
- ❤️ Condition management (CRUD operations)
- 🏥 Interventions, Evidence, References management
- 📖 Scripture and Recipe management
- 🏷️ Content tagging system
- 🔍 Search and filtering capabilities
- 📱 Responsive design

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5174 in your browser
```

**Login Credentials:**
- Email: admin@example.com
- Password: password

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- React Router
- Axios
- Lucide React Icons

## Project Structure

```
src/
├── components/Layout/  # Header, Sidebar, Layout
├── contexts/          # Auth context
├── lib/              # API client
├── pages/            # Page components
└── App.jsx           # Main app with routing
```

## Color Scheme

Inspired by the Family & Lifestyle Medicine logo:
- **Primary (Red):** Buttons, accents, active states
- **Secondary (Blue):** Sidebar, secondary elements

## Available Pages

- ✅ Dashboard - Overview with stats
- ✅ Conditions - List, search, filter, delete
- ✅ Login - Authentication
- 🚧 Other pages coming soon

## API Integration

Connects to Laravel API at `http://localhost:8000/api/v1`

Make sure:
1. Laravel API is running
2. Database is seeded
3. CORS is configured

## Development

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Customization

Edit `tailwind.config.js` to customize colors:

```js
theme: {
  extend: {
    colors: {
      primary: { /* your colors */ },
      secondary: { /* your colors */ },
    },
  },
}
```

## Next Steps

1. Implement CRUD forms for all entities
2. Add relationship management UI
3. Integrate with Laravel Sanctum
4. Add form validation
5. Implement role-based permissions

---

Built with ❤️ for Family & Lifestyle Medicine Lansing
