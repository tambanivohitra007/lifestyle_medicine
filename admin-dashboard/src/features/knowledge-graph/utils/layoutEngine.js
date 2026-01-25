import dagre from 'dagre';

// Node dimensions by type (width, height)
const NODE_DIMENSIONS = {
  condition: { width: 200, height: 80 },
  intervention: { width: 200, height: 80 },
  careDomain: { width: 160, height: 60 },
  scripture: { width: 180, height: 90 },
  egwReference: { width: 180, height: 90 },
  recipe: { width: 180, height: 80 },
  evidenceEntry: { width: 160, height: 80 },
  reference: { width: 140, height: 70 },
  default: { width: 180, height: 70 },
};

// Node type grouping for radial layout (inner to outer rings)
const NODE_TYPE_RINGS = {
  condition: 0,      // Center
  intervention: 1,   // First ring
  careDomain: 1,     // First ring
  scripture: 2,      // Second ring
  egwReference: 2,   // Second ring
  recipe: 2,         // Second ring
  evidenceEntry: 2,  // Second ring
  reference: 3,      // Third ring
};

/**
 * Get node dimensions based on type
 */
function getNodeDimensions(node) {
  const type = node.type || 'default';
  return NODE_DIMENSIONS[type] || NODE_DIMENSIONS.default;
}

/**
 * Apply Dagre layout algorithm with optimized settings.
 */
export function applyDagreLayout(nodes, edges, direction = 'TB') {
  if (nodes.length === 0) return nodes;

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR' || direction === 'RL';

  // Optimized graph settings
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: isHorizontal ? 60 : 80,   // Horizontal spacing between nodes
    ranksep: isHorizontal ? 120 : 100, // Vertical spacing between ranks
    marginx: 40,
    marginy: 40,
    acyclicer: 'greedy',  // Better handling of cycles
    ranker: 'network-simplex', // Better edge crossing minimization
  });

  // Add nodes with dynamic dimensions
  nodes.forEach((node) => {
    const dims = getNodeDimensions(node);
    dagreGraph.setNode(node.id, {
      width: dims.width,
      height: dims.height,
    });
  });

  // Add edges with weights for better positioning
  edges.forEach((edge) => {
    // Give higher weight to condition-intervention edges for better grouping
    const weight = edge.type === 'condition-intervention' ? 2 : 1;
    dagreGraph.setEdge(edge.source, edge.target, { weight });
  });

  // Run layout
  dagre.layout(dagreGraph);

  // Apply positions to nodes
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const dims = getNodeDimensions(node);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - dims.width / 2,
        y: nodeWithPosition.y - dims.height / 2,
      },
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
    };
  });
}

/**
 * Apply radial layout with node type grouping.
 * Nodes are arranged in concentric rings based on their type and connection depth.
 */
export function applyRadialLayout(nodes, edges) {
  if (nodes.length === 0) return nodes;

  // Find center node
  const centerNode = nodes.find((n) => n.data?.isCenter) || nodes[0];

  // Build adjacency map for BFS
  const adjacency = new Map();
  nodes.forEach(n => adjacency.set(n.id, []));

  edges.forEach((edge) => {
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
  });

  // BFS to determine node depth from center
  const nodeDepths = new Map();
  const visited = new Set();
  const queue = [{ id: centerNode.id, depth: 0 }];

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    if (visited.has(id)) continue;

    visited.add(id);
    nodeDepths.set(id, depth);

    const neighbors = adjacency.get(id) || [];
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        queue.push({ id: neighborId, depth: depth + 1 });
      }
    });
  }

  // Group nodes by depth
  const nodesByDepth = new Map();
  nodes.forEach(node => {
    const depth = nodeDepths.get(node.id) ?? 99;
    if (!nodesByDepth.has(depth)) {
      nodesByDepth.set(depth, []);
    }
    nodesByDepth.get(depth).push(node);
  });

  // Layout parameters
  const centerX = 500;
  const centerY = 400;
  const baseRadius = 220;
  const radiusIncrement = 180;
  const minAngleSpacing = 0.3; // Minimum radians between nodes

  // Position nodes by depth ring
  const positionedNodes = nodes.map(node => {
    const depth = nodeDepths.get(node.id) ?? 0;

    if (depth === 0) {
      // Center node
      return { ...node, position: { x: centerX, y: centerY } };
    }

    const nodesAtDepth = nodesByDepth.get(depth) || [];
    const nodeIndex = nodesAtDepth.findIndex(n => n.id === node.id);
    const totalAtDepth = nodesAtDepth.length;

    // Calculate radius for this depth
    const radius = baseRadius + (depth - 1) * radiusIncrement;

    // Calculate angle with even distribution
    const angleSpan = Math.min(2 * Math.PI, totalAtDepth * minAngleSpacing);
    const startAngle = -Math.PI / 2 - angleSpan / 2;
    const angle = startAngle + (angleSpan * nodeIndex) / Math.max(1, totalAtDepth - 1);

    // For full circle when many nodes
    const finalAngle = totalAtDepth > 6
      ? (2 * Math.PI * nodeIndex) / totalAtDepth - Math.PI / 2
      : angle;

    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(finalAngle),
        y: centerY + radius * Math.sin(finalAngle),
      },
    };
  });

  return positionedNodes;
}

/**
 * Apply force-directed layout simulation.
 * Uses simple physics simulation for organic node placement.
 */
export function applyForceLayout(nodes, edges, iterations = 100) {
  if (nodes.length === 0) return nodes;

  // Initialize positions randomly in a bounded area
  const width = 1200;
  const height = 800;

  const positions = new Map();
  const velocities = new Map();

  // Find center node for initial positioning
  const centerNode = nodes.find(n => n.data?.isCenter) || nodes[0];

  nodes.forEach((node, index) => {
    if (node.id === centerNode.id) {
      positions.set(node.id, { x: width / 2, y: height / 2 });
    } else {
      // Spread nodes around center initially
      const angle = (2 * Math.PI * index) / nodes.length;
      const radius = 200 + Math.random() * 100;
      positions.set(node.id, {
        x: width / 2 + radius * Math.cos(angle),
        y: height / 2 + radius * Math.sin(angle),
      });
    }
    velocities.set(node.id, { x: 0, y: 0 });
  });

  // Build edge lookup
  const edgeSet = new Set();
  edges.forEach(e => {
    edgeSet.add(`${e.source}-${e.target}`);
    edgeSet.add(`${e.target}-${e.source}`);
  });

  // Simulation parameters
  const repulsionStrength = 5000;
  const attractionStrength = 0.05;
  const damping = 0.85;
  const minDistance = 100;

  // Run simulation
  for (let iter = 0; iter < iterations; iter++) {
    const temperature = 1 - iter / iterations; // Cooling

    // Calculate forces
    nodes.forEach(node1 => {
      const pos1 = positions.get(node1.id);
      let fx = 0, fy = 0;

      // Repulsion from all nodes
      nodes.forEach(node2 => {
        if (node1.id === node2.id) return;

        const pos2 = positions.get(node2.id);
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);

        if (distance < minDistance * 3) {
          const force = (repulsionStrength * temperature) / (distance * distance);
          fx += (dx / distance) * force;
          fy += (dy / distance) * force;
        }
      });

      // Attraction along edges
      edges.forEach(edge => {
        let otherId = null;
        if (edge.source === node1.id) otherId = edge.target;
        else if (edge.target === node1.id) otherId = edge.source;

        if (otherId) {
          const pos2 = positions.get(otherId);
          if (pos2) {
            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            fx += dx * attractionStrength * temperature;
            fy += dy * attractionStrength * temperature;
          }
        }
      });

      // Center gravity (weak)
      const centerGravity = 0.01 * temperature;
      fx += (width / 2 - pos1.x) * centerGravity;
      fy += (height / 2 - pos1.y) * centerGravity;

      // Update velocity with damping
      const vel = velocities.get(node1.id);
      vel.x = (vel.x + fx) * damping;
      vel.y = (vel.y + fy) * damping;
    });

    // Update positions
    nodes.forEach(node => {
      // Keep center node fixed
      if (node.id === centerNode.id) return;

      const pos = positions.get(node.id);
      const vel = velocities.get(node.id);

      pos.x = Math.max(50, Math.min(width - 50, pos.x + vel.x));
      pos.y = Math.max(50, Math.min(height - 50, pos.y + vel.y));
    });
  }

  // Apply final positions
  return nodes.map(node => ({
    ...node,
    position: positions.get(node.id),
  }));
}

/**
 * Apply cluster layout - groups nodes by type with inter-cluster spacing.
 */
export function applyClusterLayout(nodes, edges) {
  if (nodes.length === 0) return nodes;

  // Group nodes by type
  const clusters = new Map();
  nodes.forEach(node => {
    const type = node.type || 'default';
    if (!clusters.has(type)) {
      clusters.set(type, []);
    }
    clusters.get(type).push(node);
  });

  // Cluster order and positions
  const clusterOrder = [
    'condition',
    'intervention',
    'careDomain',
    'evidenceEntry',
    'scripture',
    'egwReference',
    'recipe',
    'reference',
  ];

  const positions = new Map();
  let currentY = 50;
  const clusterSpacing = 40;
  const nodeSpacingX = 220;
  const nodeSpacingY = 100;

  clusterOrder.forEach(type => {
    const clusterNodes = clusters.get(type);
    if (!clusterNodes || clusterNodes.length === 0) return;

    const cols = Math.ceil(Math.sqrt(clusterNodes.length * 2));

    clusterNodes.forEach((node, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      positions.set(node.id, {
        x: 100 + col * nodeSpacingX,
        y: currentY + row * nodeSpacingY,
      });
    });

    const rows = Math.ceil(clusterNodes.length / cols);
    currentY += rows * nodeSpacingY + clusterSpacing;
  });

  return nodes.map(node => ({
    ...node,
    position: positions.get(node.id) || { x: 0, y: 0 },
  }));
}

/**
 * Medical grouped layout - organizes nodes into logical medical categories
 * with visible container boxes.
 *
 * Layout structure:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                         CONDITION (Center)                       │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                           SOLUTIONS                              │
 * │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
 * │  │ Culinary │ │ Physical │ │  Water   │ │ Spiritual│           │
 * │  │ Medicine │ │ Activity │ │ Therapy  │ │   Care   │           │
 * │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
 * │  ┌──────────┐ ┌──────────┐                                      │
 * │  │  Mental  │ │Meds/Herbs│                                      │
 * │  │  Health  │ │          │                                      │
 * │  └──────────┘ └──────────┘                                      │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                    RESEARCH / EVIDENCE                          │
 * └─────────────────────────────────────────────────────────────────┘
 */
export function applyMedicalGroupedLayout(nodes, edges) {
  if (nodes.length === 0) return nodes;

  const positions = new Map();

  // Layout dimensions
  const startX = 100;
  const centerX = 600;
  const nodeSpacingX = 220;
  const nodeSpacingY = 110;
  const groupSpacingY = 200;
  const columnWidth = 260;
  const groupPadding = 30;
  const nodeWidth = 200;
  const nodeHeight = 80;

  // Find center condition node
  const centerNode = nodes.find(n => n.data?.isCenter) || nodes.find(n => n.type === 'condition') || nodes[0];

  // Map care domains to solution categories
  const careDomainToCategory = {
    'nutrition': 'culinary',
    'exercise': 'physical',
    'water therapy': 'water',
    'hydrotherapy': 'water',
    'sunlight': 'physical',
    'temperance': 'mental',
    'air': 'physical',
    'rest': 'mental',
    'trust in god': 'spiritual',
    'mental health': 'mental',
    'supplements': 'medication',
    'medications': 'medication',
  };

  // Define solution category columns with styling
  const solutionCategories = [
    { id: 'culinary', label: 'Culinary Medicine', icon: '🥗', color: '#f59e0b', bgColor: '#fffbeb', borderColor: '#fcd34d' },
    { id: 'physical', label: 'Physical Activity', icon: '🏃', color: '#10b981', bgColor: '#ecfdf5', borderColor: '#6ee7b7' },
    { id: 'water', label: 'Water Therapy', icon: '💧', color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#93c5fd' },
    { id: 'mental', label: 'Mental Health', icon: '🧠', color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#c4b5fd' },
    { id: 'spiritual', label: 'Spiritual Care', icon: '✝️', color: '#6366f1', bgColor: '#eef2ff', borderColor: '#a5b4fc' },
    { id: 'medication', label: 'Medication/Herbs', icon: '💊', color: '#ec4899', bgColor: '#fdf2f8', borderColor: '#f9a8d4' },
  ];

  // Group nodes by category
  const groups = {
    condition: [],
    culinary: [],
    physical: [],
    water: [],
    mental: [],
    spiritual: [],
    medication: [],
    research: [],
    other: [],
  };

  // Categorize each node
  nodes.forEach(node => {
    if (node.id === centerNode.id || node.type === 'condition') {
      groups.condition.push(node);
    } else if (node.type === 'intervention') {
      const careDomain = (node.data?.careDomain || '').toLowerCase();
      const category = careDomainToCategory[careDomain] || 'other';
      if (groups[category]) {
        groups[category].push(node);
      } else {
        groups.other.push(node);
      }
    } else if (node.type === 'careDomain') {
      const domainName = (node.data?.label || '').toLowerCase();
      const category = careDomainToCategory[domainName] || 'other';
      if (groups[category]) {
        groups[category].push(node);
      } else {
        groups.other.push(node);
      }
    } else if (node.type === 'recipe') {
      groups.culinary.push(node);
    } else if (node.type === 'scripture') {
      groups.spiritual.push(node);
    } else if (node.type === 'egwReference') {
      groups.spiritual.push(node);
    } else if (node.type === 'evidenceEntry' || node.type === 'reference') {
      groups.research.push(node);
    } else {
      groups.other.push(node);
    }
  });

  // Array to collect group container nodes
  const groupNodes = [];
  // Map to track which group each node belongs to and its relative position
  const nodeParents = new Map();
  let currentY = 50;

  // Row 1: Condition (center) - with container
  const conditionY = currentY;
  const conditionGroupX = centerX - groupPadding;
  const conditionGroupWidth = Math.max(groups.condition.length * nodeSpacingX, nodeWidth) + (groupPadding * 2);
  const conditionGroupHeight = nodeHeight + (groupPadding * 2) + 20;

  if (groups.condition.length > 0) {
    groupNodes.push({
      id: 'group-condition',
      type: 'group',
      position: { x: conditionGroupX, y: conditionY - groupPadding },
      data: {
        label: 'Condition',
        icon: '🩺',
        color: '#ef4444',
        bgColor: '#fef2f2',
        borderColor: '#fca5a5',
        count: groups.condition.length,
      },
      style: {
        width: conditionGroupWidth,
        height: conditionGroupHeight,
        zIndex: -1,
      },
      draggable: true,
    });

    groups.condition.forEach((node, index) => {
      // Position relative to parent group
      const relativeX = groupPadding + (index * nodeSpacingX);
      const relativeY = groupPadding + 10;
      positions.set(node.id, { x: relativeX, y: relativeY });
      nodeParents.set(node.id, 'group-condition');
    });
  }
  currentY += conditionGroupHeight + 40;

  // Row 2: Solutions (grouped by category in columns)
  const solutionsStartY = currentY;
  const solutionsStartX = startX;

  // Calculate max rows needed for solutions
  const maxSolutionRows = Math.max(
    ...solutionCategories.map(cat => (groups[cat.id] || []).length),
    1
  );
  const solutionsGroupHeight = (maxSolutionRows * nodeSpacingY) + (groupPadding * 2) + 10;

  solutionCategories.forEach((category, colIndex) => {
    const categoryNodes = groups[category.id] || [];
    const columnX = solutionsStartX + (colIndex * columnWidth);

    // Create group container for this category
    if (categoryNodes.length > 0) {
      const groupHeight = (categoryNodes.length * nodeSpacingY) + (groupPadding * 2) + 10;

      groupNodes.push({
        id: `group-${category.id}`,
        type: 'group',
        position: { x: columnX - groupPadding, y: solutionsStartY - groupPadding },
        data: {
          label: category.label,
          icon: category.icon,
          color: category.color,
          bgColor: category.bgColor,
          borderColor: category.borderColor,
          count: categoryNodes.length,
        },
        style: {
          width: nodeWidth + (groupPadding * 2),
          height: groupHeight,
          zIndex: -1,
        },
        draggable: true,
      });

      categoryNodes.forEach((node, rowIndex) => {
        // Position relative to parent group
        const relativeX = groupPadding;
        const relativeY = groupPadding + 10 + (rowIndex * nodeSpacingY);
        positions.set(node.id, { x: relativeX, y: relativeY });
        nodeParents.set(node.id, `group-${category.id}`);
      });
    }
  });

  currentY = solutionsStartY + solutionsGroupHeight + 40;

  // Row 3: Research/Evidence
  const researchY = currentY;
  const researchNodes = groups.research;
  const researchCols = Math.max(Math.ceil(Math.sqrt(researchNodes.length * 2)), 3);
  const researchRows = Math.ceil(researchNodes.length / researchCols);

  if (researchNodes.length > 0) {
    const researchGroupWidth = (researchCols * nodeSpacingX) + (groupPadding * 2) - (nodeSpacingX - nodeWidth);
    const researchGroupHeight = (researchRows * nodeSpacingY) + (groupPadding * 2) + 10;

    groupNodes.push({
      id: 'group-research',
      type: 'group',
      position: { x: startX - groupPadding, y: researchY - groupPadding },
      data: {
        label: 'Research & Evidence',
        icon: '📚',
        color: '#64748b',
        bgColor: '#f8fafc',
        borderColor: '#cbd5e1',
        count: researchNodes.length,
      },
      style: {
        width: researchGroupWidth,
        height: researchGroupHeight,
        zIndex: -1,
      },
      draggable: true,
    });

    researchNodes.forEach((node, index) => {
      const col = index % researchCols;
      const row = Math.floor(index / researchCols);
      // Position relative to parent group
      const relativeX = groupPadding + (col * nodeSpacingX);
      const relativeY = groupPadding + 10 + (row * nodeSpacingY);
      positions.set(node.id, { x: relativeX, y: relativeY });
      nodeParents.set(node.id, 'group-research');
    });
  }

  // Handle "other" nodes
  if (groups.other.length > 0) {
    const otherY = researchY + (researchRows * nodeSpacingY) + groupSpacingY;
    const otherCols = 4;
    const otherRows = Math.ceil(groups.other.length / otherCols);

    groupNodes.push({
      id: 'group-other',
      type: 'group',
      position: { x: startX - groupPadding, y: otherY - groupPadding },
      data: {
        label: 'Other',
        icon: '📦',
        color: '#9ca3af',
        bgColor: '#f9fafb',
        borderColor: '#d1d5db',
        count: groups.other.length,
      },
      style: {
        width: (otherCols * nodeSpacingX) + (groupPadding * 2) - (nodeSpacingX - nodeWidth),
        height: (otherRows * nodeSpacingY) + (groupPadding * 2) + 10,
        zIndex: -1,
      },
      draggable: true,
    });

    groups.other.forEach((node, index) => {
      const col = index % otherCols;
      const row = Math.floor(index / otherCols);
      // Position relative to parent group
      const relativeX = groupPadding + (col * nodeSpacingX);
      const relativeY = groupPadding + 10 + (row * nodeSpacingY);
      positions.set(node.id, { x: relativeX, y: relativeY });
      nodeParents.set(node.id, 'group-other');
    });
  }

  // Apply positions to content nodes with parent relationships
  const positionedNodes = nodes.map(node => {
    const parentId = nodeParents.get(node.id);
    return {
      ...node,
      position: positions.get(node.id) || { x: 0, y: 0 },
      ...(parentId && { parentId, extent: 'parent' }),
      style: { ...node.style, zIndex: 1 },
      expandParent: true,
    };
  });

  // Return group nodes first (parents), then content nodes (children)
  return [...groupNodes, ...positionedNodes];
}

export const layoutOptions = [
  { value: 'medical', label: 'Medical Grouped', icon: '🏥' },
  { value: 'dagre-tb', label: 'Hierarchical (Top-Down)', icon: '↓' },
  { value: 'dagre-lr', label: 'Hierarchical (Left-Right)', icon: '→' },
  { value: 'radial', label: 'Radial', icon: '◎' },
  { value: 'force', label: 'Force-Directed', icon: '⚛' },
  { value: 'cluster', label: 'Clustered', icon: '▣' },
];

export function applyLayout(nodes, edges, layoutType = 'medical') {
  switch (layoutType) {
    case 'medical':
      return applyMedicalGroupedLayout(nodes, edges);
    case 'dagre-tb':
      return applyDagreLayout(nodes, edges, 'TB');
    case 'dagre-lr':
      return applyDagreLayout(nodes, edges, 'LR');
    case 'dagre-bt':
      return applyDagreLayout(nodes, edges, 'BT');
    case 'dagre-rl':
      return applyDagreLayout(nodes, edges, 'RL');
    case 'radial':
      return applyRadialLayout(nodes, edges);
    case 'force':
      return applyForceLayout(nodes, edges, 80);
    case 'cluster':
      return applyClusterLayout(nodes, edges);
    default:
      return applyMedicalGroupedLayout(nodes, edges);
  }
}
