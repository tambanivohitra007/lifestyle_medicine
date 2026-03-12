# Shared Components

Reusable components used across multiple feature modules.

## Directory Structure

### `layout/`
The app shell — wraps every authenticated page.

| Component | Purpose |
|-----------|---------|
| `Layout.jsx` | Main layout wrapper — sidebar + header + content area. Handles responsive behavior. |
| `Header.jsx` | Top navigation bar — page title, user menu, notification bell |
| `Sidebar.jsx` | Left navigation menu — links to all features, collapsible on mobile |
| `BottomNav.jsx` | Mobile bottom navigation bar (replaces sidebar on small screens) |
| `Footer.jsx` | Footer with app version and links |
| `NotificationDropdown.jsx` | Notification bell dropdown showing recent alerts |

### `shared/`
Business-specific reusable components.

| Component | Purpose |
|-----------|---------|
| `AuditInfo.jsx` | Displays created_by/updated_by metadata with timestamps |
| `RevisionHistory.jsx` | Shows content version history list |
| `RevisionDiff.jsx` | Side-by-side diff viewer for comparing revisions |
| `RevisionTimeline.jsx` | Visual timeline of content changes |
| `StatusBadge.jsx` | Colored badge showing publishing status (draft/review/published/archived) |
| `PublishActions.jsx` | Action buttons for publishing workflow (submit, publish, archive, return to draft) |
| `AiSuggestions.jsx` | Panel showing AI-suggested scriptures/EGW references for a condition |
| `BodySystemSelect.jsx` | Dropdown to select a medical body system |
| `EvidenceSummaryEditor.jsx` | Form for editing evidence summaries |
| `EffectivenessRatingEditor.jsx` | UI for setting effectiveness and GRADE ratings |
| `InterventionRelationshipEditor.jsx` | Editor for synergy/conflict relationships between interventions |
| `MediaUploader.jsx` | Drag-and-drop media upload with preview and reordering |
| `ConditionWorkflowGuide.jsx` | Step-by-step guide for creating complete condition content |
| `RichTextPreview.jsx` | Read-only rendered view of rich text (HTML) content |
| `Breadcrumbs.jsx` | Breadcrumb navigation |
| `SlideOver.jsx` | Slide-over panel from the right edge of the screen |

### `relationships/`
Components for managing many-to-many relationships.

| Component | Purpose |
|-----------|---------|
| `SortableInterventionList.jsx` | Drag-and-drop sortable list of attached interventions |
| `EditInterventionMapping.jsx` | Edit pivot data for a condition-intervention relationship |
| `QuickAttachModal.jsx` | Modal for quickly searching and attaching related entities |

### `editor/`
| Component | Purpose |
|-----------|---------|
| `RichTextEditor.jsx` | TipTap-based rich text editor with toolbar (bold, italic, headings, lists, links) |

### `ui/`
Generic UI primitives — no business logic.

| Component | Purpose |
|-----------|---------|
| `Modal.jsx` | Modal dialog overlay with close button |
| `Pagination.jsx` | Page navigation controls |
| `SortableHeader.jsx` | Clickable table header for column sorting |
| `ViewModeToggle.jsx` | Toggle between table and card view modes |
| `LanguageSwitcher.jsx` | Language selection dropdown |

### `skeleton/`
Loading placeholder components (show while data is being fetched).

| Component | Purpose |
|-----------|---------|
| `SkeletonCard.jsx` | Card-shaped loading skeleton |
| `SkeletonList.jsx` | List-shaped loading skeleton |
| `SkeletonTable.jsx` | Table-shaped loading skeleton |

### Root
| Component | Purpose |
|-----------|---------|
| `ErrorBoundary.jsx` | Catches React rendering errors and shows fallback UI |
