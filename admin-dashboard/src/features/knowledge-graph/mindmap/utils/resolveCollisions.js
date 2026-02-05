/**
 * Node Collision Resolution for ReactFlow
 * Based on: https://reactflow.dev/examples/layout/node-collisions
 *
 * Iteratively resolves overlapping nodes by pushing them apart
 * along the axis with minimal overlap.
 */

/**
 * Default node dimensions if not specified
 */
const DEFAULT_WIDTH = 180;
const DEFAULT_HEIGHT = 80;

/**
 * Convert nodes to box objects with position and dimensions
 */
function getBoxesFromNodes(nodes, margin = 0) {
  return nodes.map((node) => {
    const width = (node.measured?.width || node.width || DEFAULT_WIDTH) + margin * 2;
    const height = (node.measured?.height || node.height || DEFAULT_HEIGHT) + margin * 2;

    return {
      id: node.id,
      x: node.position.x - margin,
      y: node.position.y - margin,
      width,
      height,
      // Store original node reference for updating
      node,
    };
  });
}

/**
 * Check if two boxes overlap
 */
function boxesOverlap(a, b, threshold = 0) {
  return (
    a.x < b.x + b.width - threshold &&
    a.x + a.width > b.x + threshold &&
    a.y < b.y + b.height - threshold &&
    a.y + a.height > b.y + threshold
  );
}

/**
 * Calculate overlap between two boxes on both axes
 */
function calculateOverlap(a, b) {
  const centerAx = a.x + a.width / 2;
  const centerAy = a.y + a.height / 2;
  const centerBx = b.x + b.width / 2;
  const centerBy = b.y + b.height / 2;

  const dx = centerBx - centerAx;
  const dy = centerBy - centerAy;

  const overlapX = (a.width + b.width) / 2 - Math.abs(dx);
  const overlapY = (a.height + b.height) / 2 - Math.abs(dy);

  return { dx, dy, overlapX, overlapY };
}

/**
 * Resolve collisions between nodes
 *
 * @param {Array} nodes - ReactFlow nodes array
 * @param {Object} options - Configuration options
 * @param {number} options.maxIterations - Max collision resolution iterations (default: 50)
 * @param {number} options.overlapThreshold - Min overlap to trigger separation (default: 0.5)
 * @param {number} options.margin - Extra spacing around nodes (default: 15)
 * @param {Set} options.fixedNodeIds - Node IDs that should not move (default: empty)
 * @returns {Array} - Updated nodes with resolved positions
 */
export function resolveCollisions(nodes, options = {}) {
  const {
    maxIterations = 50,
    overlapThreshold = 0.5,
    margin = 15,
    fixedNodeIds = new Set(),
  } = options;

  if (nodes.length < 2) return nodes;

  // Convert to boxes
  let boxes = getBoxesFromNodes(nodes, margin);

  // Iteratively resolve collisions
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasCollision = false;

    // Check each pair of boxes
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const boxA = boxes[i];
        const boxB = boxes[j];

        if (!boxesOverlap(boxA, boxB, overlapThreshold)) {
          continue;
        }

        hasCollision = true;

        const { dx, dy, overlapX, overlapY } = calculateOverlap(boxA, boxB);

        // Determine which axis has less overlap (push along that axis)
        const isAFixed = fixedNodeIds.has(boxA.id);
        const isBFixed = fixedNodeIds.has(boxB.id);

        // If both are fixed, skip
        if (isAFixed && isBFixed) continue;

        // Calculate push amount
        let pushX = 0;
        let pushY = 0;

        if (overlapX < overlapY) {
          // Push horizontally
          pushX = overlapX / 2 + 1;
          if (dx < 0) pushX = -pushX;
        } else {
          // Push vertically
          pushY = overlapY / 2 + 1;
          if (dy < 0) pushY = -pushY;
        }

        // Apply push based on which nodes are fixed
        if (isAFixed) {
          // Only move B
          boxB.x += pushX * 2;
          boxB.y += pushY * 2;
        } else if (isBFixed) {
          // Only move A
          boxA.x -= pushX * 2;
          boxA.y -= pushY * 2;
        } else {
          // Move both equally
          boxA.x -= pushX;
          boxA.y -= pushY;
          boxB.x += pushX;
          boxB.y += pushY;
        }
      }
    }

    // If no collisions found, we're done
    if (!hasCollision) break;
  }

  // Convert boxes back to nodes with updated positions
  return nodes.map((node) => {
    const box = boxes.find((b) => b.id === node.id);
    if (!box) return node;

    // Account for margin offset
    return {
      ...node,
      position: {
        x: box.x + margin,
        y: box.y + margin,
      },
    };
  });
}

/**
 * Resolve collisions only for visible nodes
 * Useful when some nodes are hidden by filters
 */
export function resolveVisibleCollisions(allNodes, visibleNodeIds, options = {}) {
  const visibleNodes = allNodes.filter((n) => visibleNodeIds.has(n.id));
  const hiddenNodes = allNodes.filter((n) => !visibleNodeIds.has(n.id));

  const resolvedVisible = resolveCollisions(visibleNodes, options);

  // Combine resolved visible nodes with unchanged hidden nodes
  return [...resolvedVisible, ...hiddenNodes];
}

export default resolveCollisions;
