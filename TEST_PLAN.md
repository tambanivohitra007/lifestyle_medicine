# Testing Checklist - Recent Improvements

> **Testing Date:** January 23, 2026
> **Features to Test:** Table Sorting, Loading States, View Mode Toggle, Bible API, Bug Fixes

---

## Pre-Test Setup

### Backend Server
- [ ] Laravel server running on http://localhost:8000
- [ ] Database connected (MySQL on port 3306)
- [ ] No migration errors
- [ ] Seeded data available

### Frontend Server
- [ ] React dev server running on http://localhost:5173 (or 5176)
- [ ] No build errors
- [ ] Dependencies installed (including date-fns)

### Login
- [ ] Can access http://localhost:5173
- [ ] Login page loads correctly
- [ ] Can login with demo credentials:
  - Email: admin@example.com
  - Password: password

---

## Feature 1: Table Sorting ✨

**Page:** Conditions (http://localhost:5173/conditions)

### Test Cases:

- [ ] **TC1.1:** Sort bar is visible below filters
  - Expected: "Sort by:" label with 4 sortable columns

- [ ] **TC1.2:** Sort by Name (A-Z)
  - Click "Name" header once
  - Expected: Conditions sorted alphabetically A-Z
  - Icon shows up arrow

- [ ] **TC1.3:** Sort by Name (Z-A)
  - Click "Name" header again
  - Expected: Conditions sorted reverse alphabetically Z-A
  - Icon shows down arrow

- [ ] **TC1.4:** Sort by Category
  - Click "Category" header
  - Expected: Conditions grouped by category

- [ ] **TC1.5:** Sort by Date Created
  - Click "Date Created" header
  - Expected: Newest conditions appear first

- [ ] **TC1.6:** Sort by Last Updated
  - Click "Last Updated" header
  - Expected: Most recently updated conditions first

- [ ] **TC1.7:** Active sort indicator
  - Expected: Active column is highlighted in primary color (red)
  - Other columns are gray

- [ ] **TC1.8:** Sort persists on search
  - Set sort to "Name (A-Z)"
  - Type search term
  - Expected: Search results are still sorted by name

**Backend Sorting:**
- [ ] **TC1.9:** Check Interventions page has sorting
- [ ] **TC1.10:** Check Recipes page has sorting
- [ ] **TC1.11:** Check Scriptures page has sorting
- [ ] **TC1.12:** Check EGW References page has sorting

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Feature 2: Better Loading States ✨

**Pages:** All list pages

### Test Cases:

- [ ] **TC2.1:** Skeleton screens on Conditions page
  - Refresh page (hard refresh: Ctrl+Shift+R)
  - Expected: 6 skeleton cards appear during loading
  - Skeleton cards have shimmer animation (pulse effect)
  - No generic spinner

- [ ] **TC2.2:** Skeleton structure matches content
  - Expected: Skeleton shows icon placeholder, title bar, text lines, footer
  - Layout matches actual condition cards

- [ ] **TC2.3:** Skeleton screens on Interventions page
  - Navigate to /interventions
  - Expected: Skeleton cards during load

- [ ] **TC2.4:** Skeleton screens on Recipes page
  - Navigate to /recipes
  - Expected: Skeleton cards during load

- [ ] **TC2.5:** Skeleton list on Scriptures page
  - Navigate to /scriptures
  - Expected: Skeleton list items (not cards)

- [ ] **TC2.6:** Skeleton list on EGW References page
  - Navigate to /egw-references
  - Expected: Skeleton list items during load

- [ ] **TC2.7:** Smooth transition from skeleton to content
  - Expected: No jarring layout shift
  - Content replaces skeletons smoothly

**Components:**
- [ ] **TC2.8:** LoadingButton component exists
  - Located at: `src/components/LoadingButton.jsx`

- [ ] **TC2.9:** InlineSpinner component exists
  - Located at: `src/components/InlineSpinner.jsx`

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Feature 3: View Mode Toggle ✨

**Page:** Conditions (http://localhost:5173/conditions)

### Test Cases:

- [ ] **TC3.1:** View mode toggle is visible
  - Location: Top right of sort bar
  - Expected: Three buttons (Grid | List | Table)
  - Icons visible on all screen sizes

- [ ] **TC3.2:** Default view is Grid
  - Expected: Grid button is highlighted (red background, white text)
  - Conditions displayed as cards in grid (3 columns on desktop)

- [ ] **TC3.3:** Switch to List view
  - Click "List" button
  - Expected: View changes to horizontal compact cards
  - List button becomes active (highlighted)
  - Grid button becomes inactive (gray)

- [ ] **TC3.4:** Switch to Table view
  - Click "Table" button
  - Expected: View changes to data table
  - Columns: Name | Category | Summary | Last Updated | Actions
  - Table button becomes active

- [ ] **TC3.5:** Table view features
  - Expected: Horizontal scroll on mobile if needed
  - Action buttons (eye, edit, trash) visible in last column
  - Hover effect on rows (gray background)

- [ ] **TC3.6:** List view features
  - Expected: Icon on left, title and category
  - Action buttons on right
  - "Updated X ago" timestamp at bottom

- [ ] **TC3.7:** All views have same functionality
  - In each view (Grid/List/Table):
    - Click "View Details" (eye icon) - should navigate to detail page
    - Click "Edit" (pencil icon) - should navigate to edit page
    - Click "Delete" (trash icon) - should show confirmation modal

- [ ] **TC3.8:** View preference persists
  - Switch to "Table" view
  - Refresh page (F5)
  - Expected: Still in Table view after reload

- [ ] **TC3.9:** localStorage key
  - Open DevTools > Application > Local Storage
  - Expected: Key `conditions_view_mode` exists
  - Value is "grid", "list", or "table"

- [ ] **TC3.10:** Date formatting works
  - Expected: "Last Updated" shows relative time
  - Examples: "2 hours ago", "3 days ago", "about 1 month ago"

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Feature 4: Bible API Integration ✨

**Test Bible API endpoints directly**

### Test Cases:

- [ ] **TC4.1:** API configuration exists
  - File: `.env`
  - Expected: `BIBLE_API_KEY` is set (not empty)

- [ ] **TC4.2:** Get Bible versions list
  - API: GET `/api/v1/bible/versions`
  - Expected: Returns list of available Bibles
  - Default Bible ID: `de4e12af7f28f599-02` (KJV)

- [ ] **TC4.3:** Search for verse "John 3:16"
  - API: GET `/api/v1/bible/search?query=John 3:16`
  - Expected: Returns search results with verse text

- [ ] **TC4.4:** Get specific verse
  - API: GET `/api/v1/bible/verse?reference=John 3:16`
  - Expected: Returns verse with ID, text, and reference

- [ ] **TC4.5:** BibleApiService exists
  - File: `app/Services/BibleApiService.php`
  - Methods: getBibles, searchVerses, getVerse, getPassage, parseReference

- [ ] **TC4.6:** BibleController exists
  - File: `app/Http/Controllers/Api/BibleController.php`
  - Routes configured in `routes/api.php`

**Frontend Integration:**
- [ ] **TC4.7:** API endpoints in frontend config
  - File: `admin-dashboard/src/lib/api.js`
  - Expected: bibleVersions, bibleSearch, bibleVerse, biblePassage endpoints defined

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Feature 5: Bug Fixes

### EGW References Page Fix

- [ ] **TC5.1:** EGW References page loads without error
  - Navigate to /egw-references
  - Expected: No 500 error
  - Page loads with list of references

- [ ] **TC5.2:** egw_reference_tag table exists
  - Check database: `SHOW TABLES LIKE 'egw_reference_tag';`
  - Expected: Table exists with columns: egw_reference_id, content_tag_id, created_at, updated_at, deleted_at, created_by, deleted_by

- [ ] **TC5.3:** EGW References can be tagged
  - Try creating/editing an EGW reference
  - Expected: Can associate content tags

### Gemini AI Service Fix

- [ ] **TC5.4:** Gemini service uses correct model
  - File: `app/Services/GeminiService.php`
  - Expected: Uses `gemini-2.5-flash` model

- [ ] **TC5.5:** SSL certificate fix for Windows
  - Expected: No SSL errors in Laravel logs when calling Gemini API
  - Uses Guzzle client with `verify: false` for local development

**Status:** ⬜ Not Tested | ✅ Passed | ❌ Failed

---

## Cross-Browser Testing

### Browsers to Test:

- [ ] **Chrome/Edge** (Latest)
  - All features work correctly

- [ ] **Firefox** (Latest)
  - All features work correctly

- [ ] **Safari** (if available)
  - All features work correctly

### Responsive Testing:

- [ ] **Mobile (375px)**
  - View toggle shows icons only (no labels)
  - Grid view shows 1 column
  - Table view scrolls horizontally
  - Skeleton screens look good

- [ ] **Tablet (768px)**
  - Grid view shows 2 columns
  - View toggle shows icons + labels

- [ ] **Desktop (1024px+)**
  - Grid view shows 3 columns
  - Table view shows all columns comfortably

---

## Performance Testing

- [ ] **Initial Page Load**
  - Time from navigation to content visible: < 2 seconds

- [ ] **Skeleton Display Time**
  - Skeleton appears immediately (no blank screen)

- [ ] **View Mode Switching**
  - Transition between views is instant (< 100ms)

- [ ] **Sorting**
  - Sort updates within 500ms

---

## Known Issues / Notes

### Issues Found:
(Document any bugs or issues discovered during testing)

1.
2.
3.

### Notes:
(Any observations or suggestions)

1.
2.
3.

---

## Test Summary

**Total Test Cases:** ~60
**Passed:** ___
**Failed:** ___
**Not Tested:** ___

**Pass Rate:** ___%

### Critical Issues:
(List any P0/P1 issues that block functionality)

-

### Minor Issues:
(List any P2/P3 issues that don't block functionality)

-

### Recommendations:
(What should be done next)

-

---

## Sign-off

**Tester:** ___________________
**Date:** 2026-01-23
**Status:** ⬜ Approved | ⬜ Needs Work | ⬜ Blocked
