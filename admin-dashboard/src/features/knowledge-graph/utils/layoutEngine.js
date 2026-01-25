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

export const layoutOptions = [
  { value: 'dagre-tb', label: 'Hierarchical (Top-Down)', icon: '↓' },
  { value: 'dagre-lr', label: 'Hierarchical (Left-Right)', icon: '→' },
  { value: 'radial', label: 'Radial', icon: '◎' },
  { value: 'force', label: 'Force-Directed', icon: '⚛' },
  { value: 'cluster', label: 'Clustered', icon: '▣' },
];

export function applyLayout(nodes, edges, layoutType = 'dagre-tb') {
  switch (layoutType) {
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
      return applyDagreLayout(nodes, edges, 'TB');
  }
}
