# Condition Mindmap Implementation Plan

## Overview

Transform the existing Knowledge Graph feature into a **condition-centric visual mindmap** (inspired by NotebookLM's mind map visualization) that displays branching connections from a selected health condition to its causes, complications, and lifestyle medicine solutions.

---

## Mindmap Concept

When a user selects a condition, the mindmap displays:

```
                         ┌─────────────────────────┐
                         │     RISK FACTORS        │
                         │ (Causes & Contributors) │
                         └───────────┬─────────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
   ┌────┴────┐                 ┌─────┴─────┐                ┌─────┴─────┐
   │CULINARY │                 │           │                │ SPIRITUAL │
   │MEDICINE │◄────────────────┤ CONDITION ├───────────────►│   CARE    │
   │         │                 │  (Center) │                │Bible & EGW│
   └────┬────┘                 └─────┬─────┘                └─────┬─────┘
        │                            │                            │
        │    ┌───────────────────────┼───────────────────────┐    │
        │    │           │           │           │           │    │
        ▼    ▼           ▼           ▼           ▼           ▼    ▼
   ┌────────────┐  ┌──────────┐ ┌────────┐ ┌─────────┐ ┌───────────┐
   │  Recipes   │  │ PHYSICAL │ │ WATER  │ │ MENTAL  │ │Scriptures │
   │            │  │ ACTIVITY │ │THERAPY │ │ HEALTH  │ │& EGW Refs │
   └────────────┘  └──────────┘ └────────┘ └─────────┘ └───────────┘
                                     │
                         ┌───────────┼───────────┐
                         │           │           │
                    ┌────┴────┐ ┌────┴────┐ ┌────┴────┐
                    │ STRESS  │ │MEDICATION│ │ HERBS & │
                    │MANAGEMENT│ │         │ │SUPPLEMENTS│
                    └─────────┘ └─────────┘ └──────────┘
                                     │
                         ┌───────────┴───────────┐
                         │    COMPLICATIONS      │
                         │ (Potential Outcomes)  │
                         └───────────────────────┘
```

---

## Core Mindmap Branches

### 1. **CAUSES / RISK FACTORS** (Top Branch)
- Modifiable risk factors (diet, sedentary lifestyle, stress)
- Non-modifiable risk factors (genetics, age, family history)
- Environmental factors
- Behavioral factors

### 2. **COMPLICATIONS** (Bottom Branch)
- Direct complications of the condition
- Secondary conditions that may develop
- Long-term health impacts

### 3. **SOLUTIONS** (Radial Branches by Care Domain)

| Branch | Care Domain | Content Types | Color |
|--------|-------------|---------------|-------|
| Culinary Medicine | Nutrition | Interventions → Recipes | Amber (#f59e0b) |
| Physical Activity | Exercise | Interventions, Guidelines | Green (#22c55e) |
| Water Therapy | Hydrotherapy | Interventions, Protocols | Cyan (#06b6d4) |
| Spiritual Care | Spiritual Care | Scriptures, EGW References | Indigo (#6366f1) |
| Mental Health | Mental Health | Interventions, Techniques | Teal (#14b8a6) |
| Stress Management | Stress Management | Interventions, Practices | Purple (#a855f7) |
| Medications | Pharmacotherapy | Drug Interventions | Slate (#64748b) |
| Herbs & Supplements | Natural Remedies | Herbal Interventions | Emerald (#10b981) |

---

## Data Model Changes

### New Database Tables

#### 1. `condition_risk_factors`
```sql
CREATE TABLE condition_risk_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    condition_id UUID NOT NULL REFERENCES conditions(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    risk_type ENUM('modifiable', 'non_modifiable', 'environmental', 'behavioral') NOT NULL,
    severity ENUM('high', 'moderate', 'low') DEFAULT 'moderate',
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

#### 2. `condition_complications`
```sql
CREATE TABLE condition_complications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_condition_id UUID NOT NULL REFERENCES conditions(id),
    complication_condition_id UUID REFERENCES conditions(id), -- Link to existing condition OR
    name VARCHAR(255) NOT NULL, -- Custom complication name
    description TEXT,
    likelihood ENUM('common', 'occasional', 'rare') DEFAULT 'occasional',
    timeframe VARCHAR(100), -- e.g., "5-10 years", "immediate"
    preventable BOOLEAN DEFAULT true,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);
```

#### 3. `intervention_recipes` (Link interventions to recipes)
```sql
CREATE TABLE intervention_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    intervention_id UUID NOT NULL REFERENCES interventions(id),
    recipe_id UUID NOT NULL REFERENCES recipes(id),
    relevance_note TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE(intervention_id, recipe_id)
);
```

### New Care Domains to Add

Ensure these care domains exist in the `care_domains` table:

| Name | Slug | Icon | Color |
|------|------|------|-------|
| Nutrition | nutrition | Utensils | #f59e0b |
| Exercise | exercise | Dumbbell | #22c55e |
| Hydrotherapy | hydrotherapy | Droplets | #06b6d4 |
| Spiritual Care | spiritual-care | BookHeart | #6366f1 |
| Mental Health | mental-health | Brain | #14b8a6 |
| Stress Management | stress-management | HeartPulse | #a855f7 |
| Pharmacotherapy | pharmacotherapy | Pill | #64748b |
| Natural Remedies | natural-remedies | Leaf | #10b981 |

---

## API Design

### New Endpoint: Condition Mindmap

```
GET /api/v1/conditions/{id}/mindmap
```

**Response Structure:**
```json
{
  "condition": {
    "id": "uuid",
    "name": "Type 2 Diabetes",
    "category": "Metabolic",
    "summary": "..."
  },
  "branches": {
    "riskFactors": [
      {
        "id": "uuid",
        "name": "Obesity",
        "riskType": "modifiable",
        "severity": "high",
        "description": "..."
      }
    ],
    "complications": [
      {
        "id": "uuid",
        "name": "Diabetic Neuropathy",
        "linkedConditionId": "uuid-or-null",
        "likelihood": "common",
        "timeframe": "5-10 years",
        "preventable": true
      }
    ],
    "solutions": {
      "nutrition": {
        "careDomain": { "id": "uuid", "name": "Nutrition", "color": "#f59e0b" },
        "interventions": [
          {
            "id": "uuid",
            "name": "Low Glycemic Diet",
            "strengthOfEvidence": "high",
            "recommendationLevel": "core",
            "recipes": [
              { "id": "uuid", "title": "Quinoa Buddha Bowl", "dietaryTags": ["vegan", "low-gi"] }
            ]
          }
        ]
      },
      "exercise": {
        "careDomain": { "id": "uuid", "name": "Exercise", "color": "#22c55e" },
        "interventions": [...]
      },
      "hydrotherapy": {
        "careDomain": { "id": "uuid", "name": "Hydrotherapy", "color": "#06b6d4" },
        "interventions": [...]
      },
      "spiritualCare": {
        "careDomain": { "id": "uuid", "name": "Spiritual Care", "color": "#6366f1" },
        "interventions": [...],
        "scriptures": [
          { "id": "uuid", "reference": "3 John 1:2", "theme": "Health & Wholeness" }
        ],
        "egwReferences": [
          { "id": "uuid", "citation": "Ministry of Healing, p. 127", "topic": "Natural Remedies" }
        ]
      },
      "mentalHealth": {...},
      "stressManagement": {...},
      "pharmacotherapy": {...},
      "naturalRemedies": {...}
    }
  },
  "meta": {
    "totalRiskFactors": 5,
    "totalComplications": 3,
    "totalInterventions": 24,
    "totalRecipes": 12,
    "totalScriptures": 8,
    "totalEgwReferences": 5
  }
}
```

---

## Frontend Implementation

### File Structure

```
admin-dashboard/src/features/knowledge-graph/
├── mindmap/
│   ├── ConditionMindmap.jsx          # Main mindmap component
│   ├── ConditionMindmapPage.jsx      # Page wrapper with condition selector
│   ├── hooks/
│   │   └── useConditionMindmap.js    # Data fetching hook
│   ├── nodes/
│   │   ├── CenterConditionNode.jsx   # Large center node with condition details
│   │   ├── BranchLabelNode.jsx       # Category labels (Risk Factors, Solutions, etc.)
│   │   ├── RiskFactorNode.jsx        # Risk factor items
│   │   ├── ComplicationNode.jsx      # Complication items
│   │   ├── SolutionCategoryNode.jsx  # Care domain group headers
│   │   └── SolutionItemNode.jsx      # Individual interventions
│   ├── edges/
│   │   ├── MindmapEdge.jsx           # Curved organic edges
│   │   └── BranchEdge.jsx            # Main branch connectors
│   ├── layouts/
│   │   └── mindmapLayout.js          # Radial/organic layout algorithm
│   └── controls/
│       ├── BranchToggle.jsx          # Show/hide branches
│       ├── DepthControl.jsx          # Expand/collapse depth
│       └── MindmapLegend.jsx         # Color-coded legend
└── index.js                          # Updated exports
```

### New Components

#### 1. CenterConditionNode.jsx
```jsx
// Large, prominent center node displaying:
// - Condition name (large text)
// - Category badge
// - Brief summary (truncated)
// - Visual indicator showing it's the center
// - Pulsing ring animation
```

#### 2. BranchLabelNode.jsx
```jsx
// Category header nodes for main branches:
// - "Risk Factors" (top)
// - "Solutions" (sides)
// - "Complications" (bottom)
// - Icon + label + count badge
```

#### 3. RiskFactorNode.jsx
```jsx
// Risk factor display:
// - Name
// - Risk type badge (modifiable/non-modifiable)
// - Severity indicator (color-coded)
// - Expandable description
```

#### 4. ComplicationNode.jsx
```jsx
// Complication display:
// - Name
// - Likelihood badge
// - Timeframe
// - Link to condition if exists
// - "Preventable" indicator
```

#### 5. SolutionCategoryNode.jsx
```jsx
// Care domain group node:
// - Domain name
// - Domain icon
// - Domain color
// - Intervention count
// - Expandable/collapsible
```

### Mindmap Layout Algorithm

```javascript
// mindmapLayout.js

export function applyMindmapLayout(data, options = {}) {
  const {
    centerX = 0,
    centerY = 0,
    branchSpacing = 300,
    nodeSpacing = 80,
    curveRadius = 150
  } = options;

  const nodes = [];
  const edges = [];

  // 1. Center Condition Node
  nodes.push({
    id: `condition-${data.condition.id}`,
    type: 'centerCondition',
    position: { x: centerX, y: centerY },
    data: {
      ...data.condition,
      isCenter: true
    }
  });

  // 2. Risk Factors Branch (Top - 12 o'clock)
  const riskFactorBranch = layoutBranch({
    items: data.branches.riskFactors,
    nodeType: 'riskFactor',
    angle: -90, // Top
    distance: branchSpacing,
    centerX, centerY,
    color: '#f97316',
    label: 'Risk Factors'
  });
  nodes.push(...riskFactorBranch.nodes);
  edges.push(...riskFactorBranch.edges);

  // 3. Complications Branch (Bottom - 6 o'clock)
  const complicationBranch = layoutBranch({
    items: data.branches.complications,
    nodeType: 'complication',
    angle: 90, // Bottom
    distance: branchSpacing,
    centerX, centerY,
    color: '#dc2626',
    label: 'Complications'
  });
  nodes.push(...complicationBranch.nodes);
  edges.push(...complicationBranch.edges);

  // 4. Solution Branches (Radial - around the sides)
  const solutionCategories = Object.entries(data.branches.solutions);
  const solutionAngles = distributeAngles(solutionCategories.length, {
    startAngle: -60,  // Upper right
    endAngle: 240,    // Lower left
    excludeTop: true, // Avoid risk factors area
    excludeBottom: true // Avoid complications area
  });

  solutionCategories.forEach(([key, categoryData], index) => {
    const solutionBranch = layoutSolutionBranch({
      category: categoryData,
      angle: solutionAngles[index],
      distance: branchSpacing,
      centerX, centerY,
      conditionId: data.condition.id
    });
    nodes.push(...solutionBranch.nodes);
    edges.push(...solutionBranch.edges);
  });

  return { nodes, edges };
}

function layoutBranch({ items, nodeType, angle, distance, centerX, centerY, color, label }) {
  // Convert angle to radians
  const rad = (angle * Math.PI) / 180;

  // Branch label position
  const labelX = centerX + Math.cos(rad) * (distance * 0.6);
  const labelY = centerY + Math.sin(rad) * (distance * 0.6);

  const nodes = [{
    id: `branch-${label}`,
    type: 'branchLabel',
    position: { x: labelX, y: labelY },
    data: { label, color, count: items.length }
  }];

  const edges = [{
    id: `edge-center-to-${label}`,
    source: 'condition-center',
    target: `branch-${label}`,
    type: 'mindmapEdge',
    data: { color }
  }];

  // Fan out items from the branch label
  const itemSpread = 40; // degrees between items
  const startAngle = angle - ((items.length - 1) * itemSpread) / 2;

  items.forEach((item, i) => {
    const itemAngle = startAngle + (i * itemSpread);
    const itemRad = (itemAngle * Math.PI) / 180;
    const itemDistance = distance + 100;

    nodes.push({
      id: `${nodeType}-${item.id}`,
      type: nodeType,
      position: {
        x: centerX + Math.cos(itemRad) * itemDistance,
        y: centerY + Math.sin(itemRad) * itemDistance
      },
      data: { ...item, color }
    });

    edges.push({
      id: `edge-${label}-to-${item.id}`,
      source: `branch-${label}`,
      target: `${nodeType}-${item.id}`,
      type: 'mindmapEdge',
      data: { color }
    });
  });

  return { nodes, edges };
}

function layoutSolutionBranch({ category, angle, distance, centerX, centerY, conditionId }) {
  const { careDomain, interventions, scriptures, egwReferences, recipes } = category;
  const rad = (angle * Math.PI) / 180;

  // Category node position
  const categoryX = centerX + Math.cos(rad) * distance;
  const categoryY = centerY + Math.sin(rad) * distance;

  const nodes = [{
    id: `category-${careDomain.id}`,
    type: 'solutionCategory',
    position: { x: categoryX, y: categoryY },
    data: {
      ...careDomain,
      interventionCount: interventions?.length || 0,
      scriptureCount: scriptures?.length || 0,
      egwCount: egwReferences?.length || 0
    }
  }];

  const edges = [{
    id: `edge-center-to-${careDomain.id}`,
    source: `condition-${conditionId}`,
    target: `category-${careDomain.id}`,
    type: 'mindmapEdge',
    data: { color: careDomain.color }
  }];

  // Sub-nodes for interventions, recipes, scriptures
  // ... (similar pattern, fanning out from category node)

  return { nodes, edges };
}
```

### Edge Styling (NotebookLM-inspired)

```jsx
// MindmapEdge.jsx
import { BaseEdge, getSmoothStepPath } from 'reactflow';

export function MindmapEdge({ sourceX, sourceY, targetX, targetY, data }) {
  // Create organic, curved paths (bezier curves)
  const [path] = getBezierPath({
    sourceX, sourceY,
    targetX, targetY,
    curvature: 0.3
  });

  return (
    <BaseEdge
      path={path}
      style={{
        stroke: data?.color || '#94a3b8',
        strokeWidth: 2,
        strokeLinecap: 'round'
      }}
    />
  );
}
```

---

## User Interface Design

### Mindmap Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Condition Mindmap                    [Search Conditions...] │ │
│ │ ─────────────────                                           │ │
│ │ Selected: Type 2 Diabetes            [Export] [Share]       │ │
│ └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────┐                                                   │
│  │ Branches │  ┌─────────────────────────────────────────────┐  │
│  │──────────│  │                                             │  │
│  │ ☑ Risk   │  │              [MINDMAP CANVAS]               │  │
│  │ ☑ Compli │  │                                             │  │
│  │ ☑ Nutri  │  │         Risk Factors                        │  │
│  │ ☑ Exerci │  │              │                              │  │
│  │ ☑ Hydro  │  │    ┌────────┼────────┐                      │  │
│  │ ☑ Spirit │  │    │        │        │                      │  │
│  │ ☑ Mental │  │  Culinary ──●── Spiritual                   │  │
│  │ ☑ Stress │  │    │    DIABETES    │                       │  │
│  │ ☑ Meds   │  │    │        │        │                      │  │
│  │ ☑ Herbs  │  │    └────────┼────────┘                      │  │
│  └──────────┘  │         Complications                       │  │
│                │                                             │  │
│  ┌──────────┐  └─────────────────────────────────────────────┘  │
│  │ Legend   │                                                   │
│  │──────────│                                                   │
│  │ ● Risk   │                                                   │
│  │ ● Compli │                                                   │
│  │ ● Nutri  │                                                   │
│  │ ...      │                                                   │
│  └──────────┘                                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Interactions

| Interaction | Behavior |
|-------------|----------|
| **Click condition** | Opens condition selector, recenters mindmap |
| **Click branch** | Expands/collapses branch items |
| **Click intervention** | Opens side panel with details + evidence |
| **Click recipe** | Opens recipe detail modal |
| **Click scripture** | Opens scripture with full text |
| **Hover node** | Highlights connected edges, shows tooltip |
| **Drag canvas** | Pan the mindmap |
| **Scroll** | Zoom in/out |
| **Double-click node** | Focus and zoom to node |
| **Toggle branch checkbox** | Show/hide entire branch |

### Mobile Responsive Design

- Collapsible branch panel (hamburger menu)
- Touch-friendly node sizes (min 48x48px)
- Pinch-to-zoom support
- Swipe to pan
- Bottom sheet for node details

---

## Implementation Phases

### Phase 1: Data Model & API (Backend)
**Effort: 3-4 days**

- [ ] Create `condition_risk_factors` table and migration
- [ ] Create `condition_complications` table and migration
- [ ] Create `intervention_recipes` table and migration
- [ ] Add new care domains if missing
- [ ] Create `ConditionRiskFactor` model with relationships
- [ ] Create `ConditionComplication` model with relationships
- [ ] Create `InterventionRecipe` model with relationships
- [ ] Implement `GET /api/v1/conditions/{id}/mindmap` endpoint
- [ ] Add request validation and error handling
- [ ] Write API tests

### Phase 2: Core Mindmap Component (Frontend)
**Effort: 4-5 days**

- [ ] Create `mindmap/` directory structure
- [ ] Implement `useConditionMindmap` hook for data fetching
- [ ] Create `ConditionMindmap.jsx` main component
- [ ] Implement `mindmapLayout.js` layout algorithm
- [ ] Create `CenterConditionNode.jsx`
- [ ] Create `BranchLabelNode.jsx`
- [ ] Create `MindmapEdge.jsx` with curved paths
- [ ] Register new node/edge types with React Flow
- [ ] Add basic pan/zoom controls

### Phase 3: Branch Node Components
**Effort: 3-4 days**

- [ ] Create `RiskFactorNode.jsx` with severity indicators
- [ ] Create `ComplicationNode.jsx` with likelihood badges
- [ ] Create `SolutionCategoryNode.jsx` (care domain headers)
- [ ] Create `SolutionItemNode.jsx` (interventions)
- [ ] Add expand/collapse functionality to branches
- [ ] Implement node tooltips
- [ ] Style nodes with care domain colors

### Phase 4: Recipe & Spiritual Integration
**Effort: 2-3 days**

- [ ] Add recipe sub-nodes under culinary interventions
- [ ] Add scripture sub-nodes under spiritual care
- [ ] Add EGW reference sub-nodes under spiritual care
- [ ] Create recipe detail modal
- [ ] Create scripture detail modal
- [ ] Implement drill-down navigation (intervention → recipes)

### Phase 5: Controls & UI Polish
**Effort: 2-3 days**

- [ ] Implement `BranchToggle.jsx` (show/hide branches)
- [ ] Implement `DepthControl.jsx` (1-3 levels)
- [ ] Create `MindmapLegend.jsx`
- [ ] Add condition search/selector dropdown
- [ ] Add export functionality (PNG/PDF)
- [ ] Implement keyboard shortcuts
- [ ] Add loading states and error handling

### Phase 6: Admin CRUD for New Entities
**Effort: 3-4 days**

- [ ] Risk Factors CRUD UI (add/edit/delete on condition detail)
- [ ] Complications CRUD UI (add/edit/delete on condition detail)
- [ ] Intervention-Recipe linking UI
- [ ] Bulk operations support
- [ ] Validation and error messages

### Phase 7: Testing & Optimization
**Effort: 2-3 days**

- [ ] Unit tests for layout algorithm
- [ ] Component tests for mindmap nodes
- [ ] E2E tests for mindmap interactions
- [ ] Performance optimization for large mindmaps
- [ ] Accessibility audit and fixes
- [ ] Cross-browser testing

---

## Technical Considerations

### Performance

| Concern | Solution |
|---------|----------|
| Large node counts | Limit visible depth, lazy-load sub-branches |
| Complex layouts | Cache layout calculations, debounce recalculations |
| Many edges | Use edge bundling for overlapping paths |
| Initial render | Show skeleton loader, progressive reveal |

### Accessibility

- Keyboard navigation between nodes
- Screen reader announcements for node content
- High contrast mode support
- Focus indicators
- ARIA labels for interactive elements

### State Management

```javascript
// Mindmap state structure
{
  conditionId: 'uuid',
  visibleBranches: ['riskFactors', 'complications', 'nutrition', ...],
  expandedNodes: ['category-uuid-1', 'category-uuid-2'],
  selectedNode: 'intervention-uuid-3',
  depth: 2,
  layout: 'radial', // or 'organic'
  zoom: 1.0,
  pan: { x: 0, y: 0 }
}
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Load time (initial render) | < 2 seconds |
| Interaction responsiveness | < 100ms |
| User engagement (time on mindmap) | > 3 minutes average |
| Conditions with complete mindmap data | > 80% |
| User satisfaction (feedback) | > 4.0/5.0 |

---

## Dependencies

### Frontend
```bash
# Already installed
reactflow
@dagrejs/dagre

# May need
d3-shape        # For curved edge paths
framer-motion   # For animations
```

### Backend
```bash
# No new dependencies needed
# Uses existing Laravel models and controllers
```

---

## Future Enhancements

1. **AI-Powered Suggestions**: Recommend missing risk factors or interventions
2. **Comparative View**: Show two conditions side-by-side
3. **Pathway Tracing**: Highlight cause → condition → complication chains
4. **Evidence Overlay**: Color nodes by strength of evidence
5. **Print-Friendly Export**: Optimized PDF layout for clinical use
6. **Collaborative Annotations**: Allow users to add notes to mindmap
7. **Version History**: Track changes to condition mindmaps over time
8. **Offline Support**: Cache mindmaps for offline viewing

---

## Appendix: Sample Mindmap Data

### Diabetes Type 2 Example

```json
{
  "condition": {
    "id": "uuid-diabetes",
    "name": "Type 2 Diabetes",
    "category": "Metabolic"
  },
  "branches": {
    "riskFactors": [
      { "name": "Obesity", "riskType": "modifiable", "severity": "high" },
      { "name": "Sedentary Lifestyle", "riskType": "modifiable", "severity": "high" },
      { "name": "Family History", "riskType": "non_modifiable", "severity": "moderate" },
      { "name": "Age > 45", "riskType": "non_modifiable", "severity": "moderate" },
      { "name": "Poor Diet", "riskType": "modifiable", "severity": "high" }
    ],
    "complications": [
      { "name": "Diabetic Neuropathy", "likelihood": "common", "timeframe": "5-10 years" },
      { "name": "Retinopathy", "likelihood": "common", "timeframe": "10-15 years" },
      { "name": "Nephropathy", "likelihood": "occasional", "timeframe": "10-20 years" },
      { "name": "Cardiovascular Disease", "likelihood": "common", "timeframe": "5-10 years" }
    ],
    "solutions": {
      "nutrition": {
        "careDomain": { "name": "Nutrition", "color": "#f59e0b" },
        "interventions": [
          {
            "name": "Low Glycemic Index Diet",
            "strengthOfEvidence": "high",
            "recipes": [
              { "title": "Quinoa Buddha Bowl" },
              { "title": "Lentil Soup" }
            ]
          },
          {
            "name": "Increased Fiber Intake",
            "strengthOfEvidence": "high",
            "recipes": [
              { "title": "Overnight Oats" }
            ]
          }
        ]
      },
      "spiritualCare": {
        "careDomain": { "name": "Spiritual Care", "color": "#6366f1" },
        "scriptures": [
          { "reference": "3 John 1:2", "theme": "Health & Wholeness" },
          { "reference": "1 Corinthians 6:19-20", "theme": "Body as Temple" }
        ],
        "egwReferences": [
          { "citation": "Ministry of Healing, p. 127", "topic": "Natural Remedies" },
          { "citation": "Counsels on Diet and Foods, p. 45", "topic": "Simple Diet" }
        ]
      }
    }
  }
}
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-03 | AI Assistant | Initial plan created |
