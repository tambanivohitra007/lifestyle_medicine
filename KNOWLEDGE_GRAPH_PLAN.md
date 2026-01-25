# Knowledge Graph Implementation Plan

## Overview

Implement a structured knowledge graph using React Flow to visualize relationships between conditions, interventions, scriptures, recipes, EGW references, and evidence entries.

---

## Graph Structure

The data model forms a **hub-and-spoke graph** with multiple connection types:

```
                    ┌─────────────┐
                    │ CareDomain  │
                    └──────┬──────┘
                           │ 1:N
                    ┌──────▼──────┐
    ┌───────────────┤ Intervention ├───────────────┐
    │               └──────┬──────┘               │
    │ N:M                  │ N:M                  │ 1:N
    │    ┌─────────────────┼─────────────────┐    │
    │    │                 │                 │    │
┌───▼────▼───┐    ┌───────▼───────┐    ┌────▼────▼────┐
│  Scripture  │    │   Condition   │    │ EvidenceEntry │
└─────────────┘    └───────┬───────┘    └───────┬───────┘
                           │ N:M                 │ N:M
              ┌────────────┼────────────┐       │
              │            │            │       │
        ┌─────▼─────┐ ┌────▼────┐ ┌────▼────┐ ┌─▼────────┐
        │  Recipe   │ │Scripture│ │EgwRef   │ │Reference │
        └───────────┘ └─────────┘ └─────────┘ └──────────┘
```

---

## Node Types

| Node Type | Color | Icon | Data Fields |
|-----------|-------|------|-------------|
| `condition` | Red (#ef4444) | AlertCircle | name, category, summary |
| `intervention` | Rose (#f43f5e) | Stethoscope | name, mechanism |
| `careDomain` | Blue (#3b82f6) | Shield | name, description |
| `scripture` | Indigo (#6366f1) | BookOpen | reference, theme |
| `egwReference` | Purple (#8b5cf6) | BookMarked | citation, topic |
| `recipe` | Amber (#f59e0b) | ChefHat | title, dietary_tags |
| `evidenceEntry` | Emerald (#10b981) | FileCheck | study_type, quality_rating |
| `reference` | Slate (#64748b) | ExternalLink | citation, year |
| `contentTag` | Cyan (#06b6d4) | Tag | tag |

---

## Edge Types

| Edge Type | Source → Target | Metadata | Line Style |
|-----------|-----------------|----------|------------|
| `domain-intervention` | CareDomain → Intervention | - | Solid |
| `condition-intervention` | Condition ↔ Intervention | strength_of_evidence, recommendation_level | **Animated**, colored by strength |
| `condition-scripture` | Condition ↔ Scripture | - | Dashed |
| `condition-recipe` | Condition ↔ Recipe | - | Dashed |
| `condition-egw` | Condition ↔ EgwReference | - | Dashed |
| `intervention-evidence` | Intervention → EvidenceEntry | - | Solid |
| `evidence-reference` | EvidenceEntry → Reference | - | Dotted |
| `intervention-scripture` | Intervention ↔ Scripture | - | Dashed |
| `intervention-recipe` | Intervention ↔ Recipe | - | Dashed |
| `tagged` | Any → ContentTag | - | Thin dotted |

---

## API Design

### Endpoints

```
GET /api/v1/knowledge-graph/condition/{id}?depth={1-3}
GET /api/v1/knowledge-graph/intervention/{id}?depth={1-3}
GET /api/v1/knowledge-graph/full?limit=100
```

### Response Structure

```json
{
  "nodes": [
    {
      "id": "condition-uuid-123",
      "type": "condition",
      "data": {
        "label": "Hypertension",
        "category": "Cardiovascular",
        "summary": "...",
        "entityId": "uuid-123"
      },
      "position": { "x": 0, "y": 0 }
    }
  ],
  "edges": [
    {
      "id": "edge-cond-int-123-456",
      "source": "condition-uuid-123",
      "target": "intervention-uuid-456",
      "type": "condition-intervention",
      "data": {
        "strength_of_evidence": "high",
        "recommendation_level": "core",
        "clinical_notes": "First-line therapy"
      }
    }
  ],
  "meta": {
    "centerNode": "condition-uuid-123",
    "depth": 2,
    "totalNodes": 25,
    "totalEdges": 40
  }
}
```

---

## Implementation Phases

### Phase 1: Backend API + Basic React Flow ✅ COMPLETE
- [x] Create KnowledgeGraphController
- [x] Add API route
- [x] Install React Flow dependencies
- [x] Create basic KnowledgeGraph component
- [x] Create KnowledgeGraphPage with routing
- [x] Add custom node components (BaseNode + 8 node types)
- [x] Add layout engine (Dagre + Radial)
- [x] Add Graph buttons to ConditionDetail and InterventionDetail
- [x] Add route in App.jsx

### Phase 2: Custom Node Components ✅ COMPLETE
- [x] ConditionNode with gradient styling, category badge, center indicator
- [x] InterventionNode with care domain badge
- [x] ScriptureNode with theme badge and text preview
- [x] RecipeNode with dietary tags (up to 3 shown)
- [x] EgwReferenceNode with topic and book badges
- [x] EvidenceEntryNode with quality rating (color-coded A-D) and study type
- [x] CareDomainNode with icon
- [x] ReferenceNode with year, citation preview, DOI/PMID/URL indicators

### Phase 3: Edge Styling & Metadata
- [ ] Color-coded edges by strength_of_evidence
- [ ] Animated edges for strong relationships
- [ ] Edge labels for recommendation_level
- [ ] Hover tooltips for clinical_notes

### Phase 4: Layout Algorithm
- [ ] Integrate Dagre for hierarchical layout
- [ ] Add layout toggle (hierarchical vs force-directed)
- [ ] Optimize node positioning
- [ ] Handle edge crossings

### Phase 5: Interactive Controls
- [ ] Filter panel (toggle node types)
- [ ] Depth slider (1-3)
- [ ] Search bar with autocomplete
- [ ] Legend panel

### Phase 6: Full Graph View
- [ ] Paginated full graph endpoint
- [ ] Lazy loading for large graphs
- [ ] Clustering for dense areas
- [ ] Performance optimization

### Phase 7: Export & Polish
- [ ] PNG/SVG export
- [ ] Share link generation
- [ ] Keyboard shortcuts
- [ ] Mobile responsiveness
- [ ] Dark mode support

---

## File Structure

```
admin-dashboard/src/
├── features/
│   └── knowledge-graph/
│       ├── KnowledgeGraph.jsx        # Main React Flow component
│       ├── KnowledgeGraphPage.jsx    # Page wrapper with controls
│       ├── index.js                  # Exports
│       ├── hooks/
│       │   └── useGraphData.js       # Data fetching hook
│       ├── nodes/
│       │   ├── index.js
│       │   ├── ConditionNode.jsx
│       │   ├── InterventionNode.jsx
│       │   ├── ScriptureNode.jsx
│       │   ├── RecipeNode.jsx
│       │   ├── EgwReferenceNode.jsx
│       │   ├── EvidenceNode.jsx
│       │   └── CareDomainNode.jsx
│       ├── edges/
│       │   ├── index.js
│       │   └── ConditionInterventionEdge.jsx
│       ├── controls/
│       │   ├── FilterPanel.jsx
│       │   ├── DepthSlider.jsx
│       │   └── SearchBar.jsx
│       └── utils/
│           ├── layoutEngine.js       # Dagre integration
│           └── graphTransformers.js  # Data transformation

app/Http/Controllers/Api/
└── KnowledgeGraphController.php      # Backend API
```

---

## Dependencies

```bash
# Frontend
cd admin-dashboard
npm install reactflow @dagrejs/dagre

# Optional (for advanced layouts)
npm install elkjs d3-force
```

---

## Performance Considerations

| Concern | Solution |
|---------|----------|
| Large graphs | Limit depth (max 3), pagination, lazy loading |
| Many edges | Edge bundling, hide weak connections by default |
| Rendering | Use React Flow's built-in virtualization |
| Data fetching | Cache graph data, incremental updates |
| Initial load | Start with depth=1, expand on demand |

**Recommended limits:**
- Default depth: 2
- Max nodes per query: 100
- Expand-on-click for deeper exploration

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1 | 2-3 days |
| Phase 2 | 1-2 days |
| Phase 3 | 1 day |
| Phase 4 | 1 day |
| Phase 5 | 1-2 days |
| Phase 6 | 2 days |
| Phase 7 | 1 day |
| **Total** | **9-12 days** |

---

## Usage Examples

### Condition-Centric View
```jsx
<KnowledgeGraph
  centerType="condition"
  centerId="uuid-123"
  depth={2}
/>
```

### Intervention-Centric View
```jsx
<KnowledgeGraph
  centerType="intervention"
  centerId="uuid-456"
  depth={2}
/>
```

### Full Graph Explorer
```jsx
<KnowledgeGraph
  mode="full"
  limit={100}
/>
```
