# Lifestyle Medicine & Gospel Medical Evangelism Knowledge Platform

A comprehensive web application for managing lifestyle medicine treatment protocols, integrating evidence-based interventions with spiritual guidance based on the NEWSTART+ health principles.

## Overview

This platform enables healthcare practitioners and health educators to create, manage, and share structured treatment guides for various health conditions. Each treatment protocol follows a systematic approach that includes:

- Risk factors and causes
- Underlying physiology
- Potential complications
- Evidence-based lifestyle interventions (organized by care domains)
- Scientific references and citations
- Biblical and Spirit of Prophecy guidance
- Therapeutic recipes

## Tech Stack

### Backend
- **PHP 8.2+**
- **Laravel 12** - PHP framework
- **Laravel Sanctum** - API authentication
- **MySQL/SQLite** - Database
- **Laravel DomPDF** - PDF generation
- **Maatwebsite Excel** - CSV/Excel import
- **Gemini API PHP Client** - AI content generation

### Frontend (Admin Dashboard)
- **React 19** - UI framework
- **Vite 7** - Build tool
- **Tailwind CSS 3** - Styling
- **React Router 7** - Navigation
- **TipTap** - Rich text editor
- **Recharts** - Data visualization charts
- **Lucide React** - Icons
- **Axios** - HTTP client
- **SweetAlert2** - Toast notifications and dialogs
- **date-fns** - Date formatting

## Features

### 1. Condition Management
Create and manage health conditions with structured documentation:
- **Basic Information**: Name, category, summary
- **Sections**: Risk factors, physiology, complications, lifestyle solutions, research ideas
- **Relationships**: Link interventions, scriptures, and recipes to conditions

### 2. Care Domains (NEWSTART+ Model)
Pre-configured lifestyle medicine care domains:

| Domain | Description |
|--------|-------------|
| Nutrition | Culinary medicine, plant-based nutrition |
| Exercise | Physical activity, fitness interventions |
| Water Therapy | Hydrotherapy, hydration |
| Sunlight | Light therapy, vitamin D optimization |
| Temperance | Avoiding harmful substances |
| Air | Fresh air, breathing exercises |
| Rest | Sleep hygiene, Sabbath rest |
| Trust in God | Spiritual care, faith-based healing |
| Mental Health | Stress management, emotional wellness |
| Supplements | Herbs, vitamins, natural supplements |
| Medications | Pharmaceutical interventions |

### 3. Intervention Management
- Create interventions with descriptions and mechanisms of action
- Organize by care domain
- Link to conditions with evidence strength and recommendation levels
- Attach media files (images and documents)

### 4. Evidence & References
- Document evidence entries with quality ratings (A-D)
- Study types: RCT, Meta-analysis, Systematic review, Observational, etc.
- Link scientific references with citations, DOIs, and publication details

### 5. Scripture & Spirit of Prophecy
- Store Bible verses and Ellen White quotes
- Categorize by theme
- Link to relevant conditions for spiritual guidance

### 6. Recipe Management
- Create therapeutic recipes with ingredients and instructions
- Track prep time, cook time, and servings
- Add dietary tags (vegan, gluten-free, etc.)
- Link to conditions for culinary medicine support

### 7. Treatment Guide Workflow
Visual progress tracker that guides users through creating complete treatment protocols:
- Step-by-step checklist for required sections
- Care domain coverage visualization
- Completion percentage tracking
- Quick action links to add missing content

### 8. Global Search
Search across all content types:
- Conditions
- Interventions
- Scriptures
- Recipes
- Evidence entries

### 9. Data Import/Export
- **Import**: Bulk import conditions and interventions from CSV/Excel files
- **Export**: Generate PDF treatment guides for individual conditions or summary reports

### 10. Media Management
- Upload images and documents to interventions
- Drag-and-drop file upload
- Image gallery with captions
- Document downloads

### 11. Content Tagging
- Create and manage content tags
- Tag interventions, recipes, and scriptures
- Filter content by tags

### 12. AI Content Generator
- Generate complete condition content using AI (Google Gemini integration)
- Auto-generates structured sections: risk factors, physiology, complications, solutions
- AI-powered Scripture suggestions for health topics
- AI-powered Ellen G. White reference suggestions
- Preview generated content before importing
- Markdown to rich text conversion
- Progress tracking during generation
- Error handling with retry capability

### 13. Analytics Dashboard
- **Overview Cards**: Real-time counts with weekly trends
- **Category Distribution**: Pie chart of conditions by category
- **Domain Distribution**: Bar chart of interventions by care domain
- **Growth Metrics**: Line chart showing content creation over time
- **Activity Timeline**: Recent create/update activity feed
- **Evidence Quality**: Distribution of evidence ratings
- **Content Completeness**: Scores for intervention completeness
- **Export Reports**: Download analytics as PDF

### 14. Notification System
- Real-time notifications for async operations
- AI content generation completion alerts
- Import success/failure notifications
- Notification bell with unread count badge
- Persistent notification history (localStorage)
- Quick links to relevant pages from notifications

### 15. Mobile-First Design (Capacitor-Ready)
- **Native App-Like Experience**: Optimized for Capacitor hybrid app builds
- **Fixed App Bar**: Branded header with dynamic page titles and back navigation
- **Bottom Navigation**: Quick access to Home, Conditions, Interventions, Search
- **Elegant "More" Menu**: Bottom sheet with organized grid sections
  - User profile card with role badge
  - Categorized navigation (Main, Content, Resources, Administration)
  - Gradient icon buttons with smooth animations
  - Horizontal scroll for resource sections
- **Touch-Optimized**:
  - Touch-manipulation CSS for 300ms tap delay removal
  - Active states with scale animations
  - Safe area support for iOS notch devices
- **Adaptive Layouts**:
  - View mode toggle (grid/list/table) per content type
  - Card-based table alternatives on small screens
  - Responsive typography and spacing
- **Seamless Navigation**:
  - Back button always accessible via fixed header
  - Route-aware page titles and subtitles
  - Smooth transitions between pages

## Installation

### Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- MySQL or SQLite

### Backend Setup

```bash
# Clone the repository
git clone <repository-url>
cd lifestyle_medicine

# Install PHP dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Configure database in .env file
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=lifestyle_medicine
# DB_USERNAME=root
# DB_PASSWORD=

# Configure Gemini for AI Content Generator (optional)
# GEMINI_API_KEY=your-api-key-here

# Run migrations
php artisan migrate

# Seed care domains
php artisan db:seed --class=CareDomainSeeder

# Create storage link for media uploads
php artisan storage:link

# Start the server
php artisan serve
```

### Frontend Setup

```bash
# Navigate to admin dashboard
cd admin-dashboard

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build
```

### Create Admin User

```bash
php artisan tinker
```

```php
App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => bcrypt('password'),
]);
```

### Mobile App Build (Capacitor)

The admin dashboard is designed to work as a native mobile app using Capacitor.

```bash
cd admin-dashboard

# Install Capacitor
npm install @capacitor/core @capacitor/cli
npx cap init "Lifestyle Medicine" "com.example.lifestylemedicine"

# Add platforms
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

# Build and sync
npm run build
npx cap sync

# Open in native IDE
npx cap open android  # Opens Android Studio
npx cap open ios      # Opens Xcode
```

**Mobile Features:**
- Fixed app bar with back navigation
- Bottom navigation bar
- Safe area support for notched devices
- Touch-optimized interactions
- Native-like page transitions

## API Documentation

### Authentication
All admin endpoints require Bearer token authentication via Laravel Sanctum.

```
POST /api/v1/login
POST /api/v1/logout
GET  /api/v1/user
```

### Public Endpoints (Read-only)

```
GET /api/v1/search?q={query}

GET /api/v1/conditions
GET /api/v1/conditions/{id}
GET /api/v1/conditions/{id}/sections
GET /api/v1/conditions/{id}/interventions
GET /api/v1/conditions/{id}/scriptures
GET /api/v1/conditions/{id}/recipes

GET /api/v1/interventions
GET /api/v1/interventions/{id}
GET /api/v1/interventions/{id}/evidence
GET /api/v1/interventions/{id}/conditions
GET /api/v1/interventions/{id}/media

GET /api/v1/care-domains
GET /api/v1/evidence-entries
GET /api/v1/references
GET /api/v1/scriptures
GET /api/v1/recipes
GET /api/v1/content-tags

GET /api/v1/export/conditions/{id}/pdf
GET /api/v1/export/conditions/summary/pdf
```

### Admin Endpoints (Authenticated)

```
POST   /api/v1/admin/conditions
PUT    /api/v1/admin/conditions/{id}
DELETE /api/v1/admin/conditions/{id}

POST   /api/v1/admin/interventions
PUT    /api/v1/admin/interventions/{id}
DELETE /api/v1/admin/interventions/{id}

POST   /api/v1/admin/interventions/{id}/media
PUT    /api/v1/admin/interventions/{id}/media/{mediaId}
DELETE /api/v1/admin/interventions/{id}/media/{mediaId}
POST   /api/v1/admin/interventions/{id}/media/reorder

POST   /api/v1/admin/import/conditions
POST   /api/v1/admin/import/interventions
GET    /api/v1/admin/import/templates

# Similar CRUD endpoints for:
# - condition-sections
# - care-domains
# - evidence-entries
# - references
# - scriptures
# - recipes
# - content-tags

# Relationship management
POST   /api/v1/admin/conditions/{id}/interventions/{interventionId}
DELETE /api/v1/admin/conditions/{id}/interventions/{interventionId}
POST   /api/v1/admin/conditions/{id}/scriptures/{scriptureId}
DELETE /api/v1/admin/conditions/{id}/scriptures/{scriptureId}
POST   /api/v1/admin/conditions/{id}/recipes/{recipeId}
DELETE /api/v1/admin/conditions/{id}/recipes/{recipeId}

# AI Content Generator
POST /api/v1/admin/ai/generate-condition

# Analytics
GET /api/v1/admin/analytics/overview
GET /api/v1/admin/analytics/conditions-by-category
GET /api/v1/admin/analytics/interventions-by-domain
GET /api/v1/admin/analytics/growth
GET /api/v1/admin/analytics/user-activity
GET /api/v1/admin/analytics/evidence-quality
GET /api/v1/admin/analytics/content-completeness
```

## Data Models

### Condition
- `id` (UUID)
- `name`
- `category`
- `summary`
- Relations: sections, interventions, scriptures, recipes

### ConditionSection
- `id` (UUID)
- `condition_id`
- `section_type` (risk_factors, physiology, complications, solutions, additional_factors, scripture, research_ideas)
- `title`
- `body` (rich text)
- `order_index`

### Intervention
- `id` (UUID)
- `care_domain_id`
- `name`
- `description`
- `mechanism`
- Relations: careDomain, conditions, evidenceEntries, media, tags

### CareDomain
- `id`
- `name`
- `description`
- `icon`
- `order_index`

### EvidenceEntry
- `id` (UUID)
- `intervention_id`
- `quality_rating` (A, B, C, D)
- `study_type` (rct, meta_analysis, systematic_review, observational, case_series, expert_opinion)
- `summary`
- `population`
- Relations: references

### Reference
- `id` (UUID)
- `citation`
- `authors`
- `title`
- `journal`
- `year`
- `volume`
- `pages`
- `doi`
- `url`

### Scripture
- `id` (UUID)
- `reference` (e.g., "Genesis 1:29")
- `text`
- `theme`
- `application`
- Relations: conditions, interventions

### Recipe
- `id` (UUID)
- `title`
- `description`
- `ingredients`
- `instructions`
- `prep_time`
- `cook_time`
- `servings`
- `dietary_tags` (JSON array)
- Relations: conditions, interventions

### Media
- `id` (UUID)
- `mediable_type` / `mediable_id` (polymorphic)
- `filename`
- `original_filename`
- `mime_type`
- `size`
- `path`
- `type` (image, document)
- `alt_text`
- `caption`
- `order_index`

## Project Structure

```
lifestyle_medicine/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/    # API controllers
│   │   │   ├── AnalyticsController.php
│   │   │   ├── AiGeneratorController.php
│   │   │   └── ...
│   │   └── Resources/          # API resources
│   ├── Imports/                # Excel/CSV import classes
│   ├── Services/               # Business logic services
│   │   └── GeminiService.php   # AI content generation
│   └── Models/                 # Eloquent models
├── database/
│   ├── migrations/             # Database migrations
│   └── seeders/                # Database seeders
├── resources/
│   └── views/exports/          # PDF templates
├── routes/
│   └── api.php                 # API routes
└── admin-dashboard/            # React frontend
    ├── src/
    │   ├── components/
    │   │   ├── layout/         # Layout, Header, Sidebar, BottomNav, Footer
    │   │   ├── shared/         # Breadcrumbs, AuditInfo, RichTextPreview
    │   │   ├── relationships/  # QuickAttachModal, EditInterventionMapping
    │   │   └── ui/             # Modal, ViewModeToggle, SortableHeader
    │   ├── contexts/
    │   │   ├── AuthContext.jsx
    │   │   └── NotificationContext.jsx
    │   ├── features/
    │   │   ├── ai-generator/   # AI Content Generator
    │   │   ├── analytics/      # Analytics dashboard & charts
    │   │   ├── conditions/     # Condition management
    │   │   ├── interventions/  # Intervention management
    │   │   ├── recipes/        # Recipe management
    │   │   ├── scriptures/     # Scripture management
    │   │   ├── import/         # Data import
    │   │   └── dashboard/      # Main dashboard
    │   └── lib/
    │       ├── api.js          # API client & endpoints
    │       └── swal.js         # Toast & dialog helpers
    └── public/
```

## Usage Guide

### Creating a Treatment Guide

1. **Create a Condition**
   - Navigate to Conditions → Add Condition
   - Enter name, category, and summary

2. **Add Sections**
   - Use the workflow guide to add required sections
   - Click "Add" next to each section type
   - Fill in title and content using the rich text editor

3. **Link Interventions**
   - Go to the Interventions tab
   - Click "Attach Intervention"
   - Select existing interventions or create new ones
   - Set evidence strength and recommendation level

4. **Add Evidence**
   - Edit each intervention to add evidence entries
   - Link scientific references

5. **Add Spiritual Guidance**
   - Go to the Scriptures tab
   - Attach relevant Bible verses and Spirit of Prophecy quotes

6. **Add Recipes (Optional)**
   - Link therapeutic recipes for culinary medicine support

7. **Export**
   - Click "Export PDF" to generate a formatted treatment guide

### AI Content Generator

1. Navigate to AI Generator in the sidebar
2. Enter a condition name (e.g., "Type 2 Diabetes")
3. Click "Generate Content"
4. Wait for AI to generate structured sections:
   - Risk factors and causes
   - Underlying physiology
   - Potential complications
   - Lifestyle solutions (organized by care domain)
5. Preview the generated content in the formatted view
6. Click "Import to Database" to create the condition with all sections
7. Edit and refine the content as needed

**Note:** Requires Gemini API key configured in `.env` file (`GEMINI_API_KEY`).

### Bulk Import

1. Navigate to Import Data
2. Download the template for conditions or interventions
3. Fill in your data following the template format
4. Upload the file and click Import

### Analytics Dashboard

1. Navigate to Analytics in the sidebar
2. View overview cards with content counts and weekly trends
3. Explore charts:
   - **Category Distribution**: See conditions by category
   - **Domain Distribution**: View interventions by care domain
   - **Growth Chart**: Track content creation over time
4. Monitor recent activity in the timeline
5. Check evidence quality distribution
6. Review content completeness scores
7. Export analytics report as PDF

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Based on the NEWSTART+ lifestyle medicine model
- Inspired by the health principles of the Seventh-day Adventist Church
- Built for healthcare practitioners and health educators worldwide
