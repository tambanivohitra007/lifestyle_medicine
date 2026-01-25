import dagre from 'dagre';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 60;

/**
 * Apply Dagre layout algorithm to position nodes.
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {string} direction - 'TB' (top-bottom), 'LR' (left-right), 'BT', 'RL'
 * @returns {Array} - Nodes with updated positions
 */
export function applyDagreLayout(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === 'LR' || direction === 'RL';
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
  });

  // Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run layout
  dagre.layout(dagreGraph);

  // Apply positions to nodes
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
    };
  });
}

/**
 * Apply radial layout centered on the first node.
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @returns {Array} - Nodes with updated positions
 */
export function applyRadialLayout(nodes, edges) {
  if (nodes.length === 0) return nodes;

  // Find center node (isCenter: true or first node)
  const centerIndex = nodes.findIndex((n) => n.data?.isCenter) || 0;
  const centerNode = nodes[centerIndex];

  // Group nodes by their connection to center
  const directConnections = new Set();
  const indirectConnections = new Set();

  edges.forEach((edge) => {
    if (edge.source === centerNode.id) {
      directConnections.add(edge.target);
    } else if (edge.target === centerNode.id) {
      directConnections.add(edge.source);
    }
  });

  // Find indirect connections
  edges.forEach((edge) => {
    if (directConnections.has(edge.source) && edge.target !== centerNode.id) {
      indirectConnections.add(edge.target);
    }
    if (directConnections.has(edge.target) && edge.source !== centerNode.id) {
      indirectConnections.add(edge.source);
    }
  });

  const centerX = 400;
  const centerY = 300;
  const radius1 = 200; // First ring
  const radius2 = 380; // Second ring

  const directNodes = nodes.filter((n) => directConnections.has(n.id));
  const indirectNodes = nodes.filter((n) => indirectConnections.has(n.id));

  return nodes.map((node) => {
    if (node.id === centerNode.id) {
      return { ...node, position: { x: centerX, y: centerY } };
    }

    const directIndex = directNodes.findIndex((n) => n.id === node.id);
    if (directIndex !== -1) {
      const angle = (2 * Math.PI * directIndex) / directNodes.length - Math.PI / 2;
      return {
        ...node,
        position: {
          x: centerX + radius1 * Math.cos(angle),
          y: centerY + radius1 * Math.sin(angle),
        },
      };
    }

    const indirectIndex = indirectNodes.findIndex((n) => n.id === node.id);
    if (indirectIndex !== -1) {
      const angle = (2 * Math.PI * indirectIndex) / indirectNodes.length - Math.PI / 2;
      return {
        ...node,
        position: {
          x: centerX + radius2 * Math.cos(angle),
          y: centerY + radius2 * Math.sin(angle),
        },
      };
    }

    // Default position for unconnected nodes
    return { ...node, position: { x: centerX + 500, y: centerY } };
  });
}

export const layoutOptions = [
  { value: 'dagre-tb', label: 'Hierarchical (Top-Down)' },
  { value: 'dagre-lr', label: 'Hierarchical (Left-Right)' },
  { value: 'radial', label: 'Radial' },
];

export function applyLayout(nodes, edges, layoutType = 'dagre-tb') {
  switch (layoutType) {
    case 'dagre-tb':
      return applyDagreLayout(nodes, edges, 'TB');
    case 'dagre-lr':
      return applyDagreLayout(nodes, edges, 'LR');
    case 'radial':
      return applyRadialLayout(nodes, edges);
    default:
      return applyDagreLayout(nodes, edges, 'TB');
  }
}
