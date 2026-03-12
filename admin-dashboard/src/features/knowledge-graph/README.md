# Knowledge Graph & Mindmap

The most complex feature module (~42 files). Provides interactive visualizations of the relationships between all entities in the platform.

## Two Visualization Modes

### 1. Knowledge Graph (Full Network)

`KnowledgeGraph.jsx` — displays all entities and their relationships as an interactive network graph.

**Data flow:**
```
GET /api/v1/knowledge-graph/full
    → Returns { nodes: [...], edges: [...] }
    → layoutEngine.js positions nodes using force-directed algorithm
    → React Flow renders with custom node/edge components
```

**Entity types shown:** Conditions, Interventions, Care Domains, Scriptures, Recipes, EGW References, Evidence Entries, References

**Relationship types shown:**
- Condition ↔ Intervention (with effectiveness ratings)
- Intervention ↔ Intervention (synergy/conflict)
- Condition ↔ Scripture/Recipe/EGW Reference
- Intervention → Care Domain

### 2. Condition Mindmap (Focused Tree)

`mindmap/ConditionMindmap.jsx` — displays a single condition as a radial/tree layout showing its sections, interventions, risk factors, and complications.

**Data flow:**
```
GET /api/v1/conditions/{id}/mindmap
    → Returns condition with all relationships
    → mindmapLayout.js / expandableMindmapLayout.js positions nodes in tree
    → React Flow renders with mindmap-specific node/edge components
```

## Directory Structure

```
knowledge-graph/
├── KnowledgeGraphPage.jsx      # Route page wrapper
├── KnowledgeGraph.jsx          # Main graph component (React Flow canvas)
├── FullGraphPage.jsx           # Full-screen graph view
│
├── nodes/                      # Custom React Flow node components
│   ├── ConditionNode.jsx       # Red/medical themed node
│   ├── InterventionNode.jsx    # Green/treatment themed node
│   ├── CareDomainNode.jsx      # Uses domain color
│   ├── ScriptureNode.jsx       # Scripture verse node
│   ├── EgwReferenceNode.jsx    # EGW reference node
│   ├── RecipeNode.jsx          # Recipe node
│   ├── ReferenceNode.jsx       # Academic reference node
│   ├── EvidenceEntryNode.jsx   # Evidence entry node
│   ├── GroupNode.jsx           # Grouping container node
│   └── index.jsx               # Exports nodeTypes map for React Flow
│
├── edges/                      # Custom React Flow edge components
│   ├── RelationshipEdge.jsx    # Generic relationship edge
│   ├── InterventionRelationshipEdge.jsx  # Synergy/conflict edge (color-coded)
│   ├── ConditionInterventionEdge.jsx     # Effectiveness-based edge
│   └── index.jsx               # Exports edgeTypes map
│
├── controls/                   # UI control panels
│   ├── FilterPanel.jsx         # Filter by entity type, domain, etc.
│   ├── SearchBar.jsx           # Search nodes in the graph
│   ├── ExportPanel.jsx         # Export graph as PNG/SVG
│   ├── NodeContextMenu.jsx     # Right-click menu on nodes
│   ├── KeyboardShortcutsHelp.jsx  # Keyboard shortcut reference
│   ├── NodeDetailsPanel.jsx    # Side panel showing selected node details
│   ├── InteractiveLegend.jsx   # Legend showing node/edge color meanings
│   └── index.js
│
├── hooks/                      # Custom hooks
│   ├── useKeyboardShortcuts.js # Graph keyboard shortcuts (zoom, pan, select)
│   ├── useLayoutPersistence.js # Save/restore graph layout to localStorage
│   └── index.js
│
├── utils/
│   └── layoutEngine.js         # Force-directed layout algorithm
│
└── mindmap/                    # Condition mindmap sub-feature
    ├── ConditionMindmap.jsx    # Main mindmap component
    ├── ConditionMindmapPage.jsx  # Route page wrapper
    │
    ├── nodes/                  # Mindmap-specific nodes
    │   ├── CenterConditionNode.jsx      # Central condition (root)
    │   ├── SectionBranchNode.jsx        # Section branch (overview, solutions)
    │   ├── SectionItemNode.jsx          # Individual section content
    │   ├── ExpandableInterventionNode.jsx  # Intervention with expand/collapse
    │   ├── InterventionMindmapNode.jsx  # Intervention leaf node
    │   ├── SolutionCategoryNode.jsx     # Solution category grouping
    │   ├── ComplicationNode.jsx         # Complication leaf
    │   ├── RiskFactorNode.jsx           # Risk factor leaf
    │   ├── LeafNode.jsx                 # Generic leaf node
    │   ├── BranchLabelNode.jsx          # Branch label
    │   ├── MasterNode.jsx               # Master grouping node
    │   └── index.js
    │
    ├── edges/
    │   ├── MindmapEdge.jsx     # Curved connection edges
    │   └── index.js
    │
    ├── controls/
    │   ├── NodeDetailsPanel.jsx  # Mindmap node detail panel
    │   └── index.js
    │
    ├── hooks/
    │   ├── useConditionMindmap.js  # Fetches condition data & builds mindmap
    │   └── index.js
    │
    └── utils/
        ├── mindmapLayout.js           # Tree/radial layout algorithm
        ├── expandableMindmapLayout.js  # Layout with expand/collapse support
        └── resolveCollisions.js        # Prevents node overlap
```

## How the Layout Algorithms Work

### Knowledge Graph Layout (`utils/layoutEngine.js`)
Uses a force-directed algorithm:
1. Places nodes with initial positions
2. Applies repulsion forces between all nodes (prevent overlap)
3. Applies attraction forces along edges (connected nodes stay close)
4. Iterates until stable

### Mindmap Layout (`mindmap/utils/mindmapLayout.js`)
Uses a tree layout:
1. Places the condition at the center
2. Branches radiate outward for each category (sections, interventions, risk factors, etc.)
3. Leaf nodes positioned at branch endpoints
4. `resolveCollisions.js` adjusts positions to prevent overlap

### Layout Persistence (`hooks/useLayoutPersistence.js`)
Node positions are saved to localStorage so the graph remembers its layout between visits.

## Key Interactions

- **Click node** → Opens detail panel
- **Right-click node** → Context menu (navigate to entity, expand relationships)
- **Drag node** → Reposition (saved to localStorage)
- **Mouse wheel** → Zoom in/out
- **Click + drag background** → Pan
- **Keyboard shortcuts** → See `KeyboardShortcutsHelp.jsx`
- **Filter panel** → Toggle visibility of entity types
- **Search** → Highlight and focus matching nodes
