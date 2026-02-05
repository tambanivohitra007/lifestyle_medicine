/**
 * Expandable Mindmap Layout Algorithm with Collision Avoidance
 *
 * DESIGN: Nodes stay in their positions once placed.
 * New nodes find available space using collision detection.
 * User-moved positions are always preserved and respected.
 */

// Layout configuration
const CONFIG = {
  // Base distances
  level1Radius: 380,
  level2Radius: 320,
  level3Radius: 240,

  // Node dimensions for collision detection
  nodeWidth: 200,
  nodeHeight: 90,
  nodeMargin: 30, // Extra space around nodes

  // Angular step for searching available positions
  angleSearchStep: 5, // degrees
};

/**
 * Convert degrees to radians
 */
function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate position from angle and distance
 */
function polarToCartesian(centerX, centerY, angle, distance) {
  const rad = degToRad(angle);
  return {
    x: centerX + distance * Math.cos(rad),
    y: centerY + distance * Math.sin(rad),
  };
}

/**
 * Get bounding box for a node at position
 */
function getNodeBounds(x, y) {
  const halfWidth = (CONFIG.nodeWidth + CONFIG.nodeMargin) / 2;
  const halfHeight = (CONFIG.nodeHeight + CONFIG.nodeMargin) / 2;
  return {
    left: x - halfWidth,
    right: x + halfWidth,
    top: y - halfHeight,
    bottom: y + halfHeight,
  };
}

/**
 * Check if two bounding boxes overlap
 */
function boundsOverlap(a, b) {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

/**
 * Check if a position collides with any occupied positions
 */
function hasCollision(x, y, occupiedPositions) {
  const newBounds = getNodeBounds(x, y);

  for (const pos of occupiedPositions) {
    const existingBounds = getNodeBounds(pos.x, pos.y);
    if (boundsOverlap(newBounds, existingBounds)) {
      return true;
    }
  }
  return false;
}

/**
 * Find available position starting from preferred angle
 * Searches outward in both directions until free space is found
 */
function findAvailablePosition(centerX, centerY, preferredAngle, distance, occupiedPositions, maxSearchAngle = 180) {
  // Try preferred position first
  let pos = polarToCartesian(centerX, centerY, preferredAngle, distance);
  if (!hasCollision(pos.x, pos.y, occupiedPositions)) {
    return { position: pos, angle: preferredAngle };
  }

  // Search alternating left and right
  for (let offset = CONFIG.angleSearchStep; offset <= maxSearchAngle; offset += CONFIG.angleSearchStep) {
    // Try right (positive angle)
    const rightAngle = preferredAngle + offset;
    pos = polarToCartesian(centerX, centerY, rightAngle, distance);
    if (!hasCollision(pos.x, pos.y, occupiedPositions)) {
      return { position: pos, angle: rightAngle };
    }

    // Try left (negative angle)
    const leftAngle = preferredAngle - offset;
    pos = polarToCartesian(centerX, centerY, leftAngle, distance);
    if (!hasCollision(pos.x, pos.y, occupiedPositions)) {
      return { position: pos, angle: leftAngle };
    }
  }

  // If no space found at this distance, try further out
  const newDistance = distance + 100;
  pos = polarToCartesian(centerX, centerY, preferredAngle, newDistance);
  if (!hasCollision(pos.x, pos.y, occupiedPositions)) {
    return { position: pos, angle: preferredAngle, distance: newDistance };
  }

  // Last resort: return preferred position anyway
  return { position: polarToCartesian(centerX, centerY, preferredAngle, distance), angle: preferredAngle };
}

/**
 * Calculate evenly distributed angles for N items within a range
 */
function distributeAngles(count, startAngle, endAngle) {
  if (count === 0) return [];
  if (count === 1) return [(startAngle + endAngle) / 2];

  const range = endAngle - startAngle;
  const step = range / (count + 1);
  const angles = [];

  for (let i = 1; i <= count; i++) {
    angles.push(startAngle + i * step);
  }

  return angles;
}

/**
 * Build the complete mindmap with collision-aware placement
 * @param {Object} data - The mindmap data
 * @param {Set} expandedNodes - Set of expanded node IDs
 * @param {Map} userPositions - Map of nodeId -> {x, y} for user-moved nodes
 */
export function buildExpandableMindmap(data, expandedNodes = new Set(), userPositions = new Map()) {
  if (!data || !data.condition) {
    return { nodes: [], edges: [], hierarchy: {} };
  }

  const nodes = [];
  const edges = [];
  const hierarchy = {};
  const occupiedPositions = []; // Track all placed node positions

  const centerX = 0;
  const centerY = 0;

  /**
   * Get position for a node - use user position if available, otherwise calculate
   */
  const getNodePosition = (nodeId, calculatedPos) => {
    if (userPositions.has(nodeId)) {
      return userPositions.get(nodeId);
    }
    return calculatedPos;
  };

  /**
   * Register a position as occupied (for collision detection)
   */
  const registerPosition = (nodeId, pos) => {
    occupiedPositions.push({ x: pos.x, y: pos.y, nodeId });
  };

  /**
   * Pre-register all user-moved positions as occupied first
   * This ensures new nodes won't collide with user-placed nodes
   */
  for (const [nodeId, pos] of userPositions.entries()) {
    occupiedPositions.push({ x: pos.x, y: pos.y, nodeId, isUserMoved: true });
  }

  // 1. Create center condition node
  const conditionNodeId = `condition-${data.condition.id}`;
  const centerPos = getNodePosition(conditionNodeId, { x: centerX, y: centerY });

  nodes.push({
    id: conditionNodeId,
    type: 'centerCondition',
    position: centerPos,
    data: {
      ...data.condition,
      isCenter: true,
      color: '#ef4444',
      level: 0,
      expandable: true,
      expanded: expandedNodes.has(conditionNodeId),
      childCount: 0,
    },
  });
  hierarchy[conditionNodeId] = [];

  // Only add to occupied if not already registered from user positions
  if (!userPositions.has(conditionNodeId)) {
    registerPosition(conditionNodeId, centerPos);
  }

  // 2. Collect all master branches
  const sectionBranches = [];
  const solutionBranches = [];

  // Sections
  const sections = data.sections || {};
  Object.entries(sections).forEach(([key, section]) => {
    if (!section.items || section.items.length === 0) return;
    sectionBranches.push({ key, data: section });
  });

  // Solutions
  const solutions = data.branches?.solutions || {};
  Object.entries(solutions).forEach(([key, solutionData]) => {
    if (!solutionData?.careDomain) return;
    const childCount = (solutionData.interventions?.length || 0) +
                       (solutionData.scriptures?.length || 0) +
                       (solutionData.egwReferences?.length || 0);
    if (childCount === 0) return;
    solutionBranches.push({ key, data: solutionData });
  });

  const masterNodeIds = [];

  // 3. Place section master nodes (LEFT side: 100° to 260°)
  const sectionAngles = distributeAngles(sectionBranches.length, 100, 260);
  sectionBranches.forEach((branch, index) => {
    const preferredAngle = sectionAngles[index];
    const result = findAvailablePosition(centerPos.x, centerPos.y, preferredAngle, CONFIG.level1Radius, occupiedPositions);

    createSectionBranch(
      branch, result.position, result.angle,
      nodes, edges, hierarchy, conditionNodeId, expandedNodes, masterNodeIds, occupiedPositions,
      userPositions, getNodePosition, registerPosition
    );
  });

  // 4. Place solution master nodes (RIGHT side: -80° to 80°)
  const solutionAngles = distributeAngles(solutionBranches.length, -80, 80);
  solutionBranches.forEach((branch, index) => {
    const preferredAngle = solutionAngles[index];
    const result = findAvailablePosition(centerPos.x, centerPos.y, preferredAngle, CONFIG.level1Radius, occupiedPositions);

    createSolutionBranch(
      branch, result.position, result.angle,
      nodes, edges, hierarchy, conditionNodeId, expandedNodes, masterNodeIds, occupiedPositions,
      userPositions, getNodePosition, registerPosition
    );
  });

  // Update center node's child count
  const centerNode = nodes.find(n => n.id === conditionNodeId);
  if (centerNode) {
    centerNode.data.childCount = masterNodeIds.length;
  }

  return { nodes, edges, hierarchy };
}

/**
 * Create section branch with collision-aware child placement
 */
function createSectionBranch(
  branch, calculatedMasterPos, masterAngle,
  nodes, edges, hierarchy, conditionNodeId, expandedNodes, masterNodeIds, occupiedPositions,
  userPositions, getNodePosition, registerPosition
) {
  const section = branch.data;
  const masterId = `master-section-${branch.key}`;

  // Use user position if available, otherwise use calculated position
  const masterPos = getNodePosition(masterId, calculatedMasterPos);

  masterNodeIds.push(masterId);
  hierarchy[conditionNodeId].push(masterId);
  hierarchy[masterId] = [];

  // Register position if not already from user positions
  if (!userPositions.has(masterId)) {
    registerPosition(masterId, masterPos);
  }

  const isExpanded = expandedNodes.has(masterId);

  nodes.push({
    id: masterId,
    type: 'masterNode',
    position: masterPos,
    data: {
      label: section.label,
      count: section.items.length,
      color: section.color,
      icon: section.icon,
      sectionType: section.type,
      level: 1,
      expandable: section.items.length > 0,
      expanded: isExpanded,
      childCount: section.items.length,
      parentId: conditionNodeId,
      nodeCategory: 'section',
    },
    hidden: !expandedNodes.has(conditionNodeId),
  });

  edges.push({
    id: `edge-center-to-${masterId}`,
    source: conditionNodeId,
    target: masterId,
    type: 'mindmap',
    data: { color: section.color },
    hidden: !expandedNodes.has(conditionNodeId),
  });

  // Level 2: Section items with collision avoidance
  if (isExpanded && section.items.length > 0) {
    // Calculate preferred angles for children, spread around parent's angle
    const spreadAngle = Math.min(120, section.items.length * 25);
    const childAngles = distributeAngles(
      section.items.length,
      masterAngle - spreadAngle / 2,
      masterAngle + spreadAngle / 2
    );

    section.items.forEach((item, index) => {
      const itemId = `section-item-${item.id}`;
      let itemPos;

      // Check if user has moved this node
      if (userPositions.has(itemId)) {
        itemPos = userPositions.get(itemId);
      } else {
        const preferredAngle = childAngles[index];
        const result = findAvailablePosition(
          masterPos.x, masterPos.y,
          preferredAngle,
          CONFIG.level2Radius,
          occupiedPositions
        );
        itemPos = result.position;
        registerPosition(itemId, itemPos);
      }

      hierarchy[masterId].push(itemId);

      nodes.push({
        id: itemId,
        type: 'leafNode',
        position: itemPos,
        data: {
          ...item,
          label: item.title,
          color: section.color,
          sectionType: section.type,
          sectionLabel: section.label,
          level: 2,
          expandable: false,
          parentId: masterId,
          nodeCategory: 'sectionItem',
        },
        hidden: false,
      });

      edges.push({
        id: `edge-${masterId}-to-${itemId}`,
        source: masterId,
        target: itemId,
        type: 'mindmap',
        data: { color: section.color, dashed: true },
        hidden: false,
      });
    });
  }
}

/**
 * Create solution branch with collision-aware child placement
 */
function createSolutionBranch(
  branch, calculatedMasterPos, masterAngle,
  nodes, edges, hierarchy, conditionNodeId, expandedNodes, masterNodeIds, occupiedPositions,
  userPositions, getNodePosition, registerPosition
) {
  const solutionData = branch.data;
  const domain = solutionData.careDomain;
  const masterId = `master-solution-${branch.key}`;

  // Use user position if available, otherwise use calculated position
  const masterPos = getNodePosition(masterId, calculatedMasterPos);

  masterNodeIds.push(masterId);
  hierarchy[conditionNodeId].push(masterId);
  hierarchy[masterId] = [];

  // Register position if not already from user positions
  if (!userPositions.has(masterId)) {
    registerPosition(masterId, masterPos);
  }

  const isExpanded = expandedNodes.has(masterId);
  const interventions = solutionData.interventions || [];
  const scriptures = solutionData.scriptures || [];
  const egwRefs = solutionData.egwReferences || [];
  const totalChildren = interventions.length + scriptures.length + egwRefs.length;

  nodes.push({
    id: masterId,
    type: 'masterNode',
    position: masterPos,
    data: {
      label: domain.name,
      count: interventions.length,
      color: domain.color || '#6b7280',
      icon: domain.icon,
      level: 1,
      expandable: totalChildren > 0,
      expanded: isExpanded,
      childCount: totalChildren,
      parentId: conditionNodeId,
      nodeCategory: 'solution',
      interventionCount: interventions.length,
      scriptureCount: scriptures.length,
      egwCount: egwRefs.length,
    },
    hidden: !expandedNodes.has(conditionNodeId),
  });

  edges.push({
    id: `edge-center-to-${masterId}`,
    source: conditionNodeId,
    target: masterId,
    type: 'mindmap',
    data: { color: domain.color || '#6b7280' },
    hidden: !expandedNodes.has(conditionNodeId),
  });

  // Level 2: All children with collision avoidance
  if (isExpanded && totalChildren > 0) {
    const spreadAngle = Math.min(140, totalChildren * 20);
    const allChildAngles = distributeAngles(
      totalChildren,
      masterAngle - spreadAngle / 2,
      masterAngle + spreadAngle / 2
    );

    let angleIndex = 0;

    // Interventions
    interventions.forEach((intervention) => {
      const interventionId = `intervention-${intervention.id}`;
      let interventionPos;
      let usedAngle = allChildAngles[angleIndex++];

      // Check if user has moved this node
      if (userPositions.has(interventionId)) {
        interventionPos = userPositions.get(interventionId);
      } else {
        const result = findAvailablePosition(
          masterPos.x, masterPos.y,
          usedAngle,
          CONFIG.level2Radius,
          occupiedPositions
        );
        interventionPos = result.position;
        usedAngle = result.angle;
        registerPosition(interventionId, interventionPos);
      }

      hierarchy[masterId].push(interventionId);
      hierarchy[interventionId] = [];

      const isInterventionExpanded = expandedNodes.has(interventionId);
      const recipeCount = intervention.recipes?.length || 0;

      nodes.push({
        id: interventionId,
        type: 'interventionNode',
        position: interventionPos,
        data: {
          ...intervention,
          label: intervention.name,
          color: domain.color || '#f43f5e',
          level: 2,
          expandable: recipeCount > 0,
          expanded: isInterventionExpanded,
          childCount: recipeCount,
          parentId: masterId,
          nodeCategory: 'intervention',
        },
        hidden: false,
      });

      edges.push({
        id: `edge-${masterId}-to-${interventionId}`,
        source: masterId,
        target: interventionId,
        type: 'mindmap',
        data: { color: domain.color || '#f43f5e', dashed: true },
        hidden: false,
      });

      // Level 3: Recipes
      if (isInterventionExpanded && intervention.recipes?.length > 0) {
        const recipeSpread = Math.min(80, intervention.recipes.length * 30);
        const recipeAngles = distributeAngles(
          intervention.recipes.length,
          usedAngle - recipeSpread / 2,
          usedAngle + recipeSpread / 2
        );

        intervention.recipes.forEach((recipe, recipeIdx) => {
          const recipeId = `recipe-${recipe.id}-${intervention.id}`;
          let recipePos;

          // Check if user has moved this node
          if (userPositions.has(recipeId)) {
            recipePos = userPositions.get(recipeId);
          } else {
            const recipeAngle = recipeAngles[recipeIdx];
            const recipeResult = findAvailablePosition(
              interventionPos.x, interventionPos.y,
              recipeAngle,
              CONFIG.level3Radius,
              occupiedPositions
            );
            recipePos = recipeResult.position;
            registerPosition(recipeId, recipePos);
          }

          hierarchy[interventionId].push(recipeId);

          nodes.push({
            id: recipeId,
            type: 'leafNode',
            position: recipePos,
            data: {
              ...recipe,
              label: recipe.title,
              color: '#f59e0b',
              level: 3,
              expandable: false,
              parentId: interventionId,
              nodeCategory: 'recipe',
            },
            hidden: false,
          });

          edges.push({
            id: `edge-${interventionId}-to-${recipeId}`,
            source: interventionId,
            target: recipeId,
            type: 'mindmap',
            data: { color: '#f59e0b', dashed: true },
            hidden: false,
          });
        });
      }
    });

    // Scriptures
    scriptures.forEach((scripture) => {
      const scriptureId = `scripture-${scripture.id}-${branch.key}`;
      let scripturePos;

      // Check if user has moved this node
      if (userPositions.has(scriptureId)) {
        scripturePos = userPositions.get(scriptureId);
      } else {
        const preferredAngle = allChildAngles[angleIndex++];
        const result = findAvailablePosition(
          masterPos.x, masterPos.y,
          preferredAngle,
          CONFIG.level2Radius,
          occupiedPositions
        );
        scripturePos = result.position;
        registerPosition(scriptureId, scripturePos);
      }

      hierarchy[masterId].push(scriptureId);

      nodes.push({
        id: scriptureId,
        type: 'leafNode',
        position: scripturePos,
        data: {
          ...scripture,
          label: scripture.reference,
          color: '#6366f1',
          level: 2,
          expandable: false,
          parentId: masterId,
          nodeCategory: 'scripture',
        },
        hidden: false,
      });

      edges.push({
        id: `edge-${masterId}-to-${scriptureId}`,
        source: masterId,
        target: scriptureId,
        type: 'mindmap',
        data: { color: '#6366f1', dashed: true },
        hidden: false,
      });
    });

    // EGW References
    egwRefs.forEach((egw) => {
      const egwId = `egw-${egw.id}-${branch.key}`;
      let egwPos;

      // Check if user has moved this node
      if (userPositions.has(egwId)) {
        egwPos = userPositions.get(egwId);
      } else {
        const preferredAngle = allChildAngles[angleIndex++];
        const result = findAvailablePosition(
          masterPos.x, masterPos.y,
          preferredAngle,
          CONFIG.level2Radius,
          occupiedPositions
        );
        egwPos = result.position;
        registerPosition(egwId, egwPos);
      }

      hierarchy[masterId].push(egwId);

      nodes.push({
        id: egwId,
        type: 'leafNode',
        position: egwPos,
        data: {
          ...egw,
          label: egw.citation,
          color: '#8b5cf6',
          level: 2,
          expandable: false,
          parentId: masterId,
          nodeCategory: 'egwReference',
        },
        hidden: false,
      });

      edges.push({
        id: `edge-${masterId}-to-${egwId}`,
        source: masterId,
        target: egwId,
        type: 'mindmap',
        data: { color: '#8b5cf6', dashed: true },
        hidden: false,
      });
    });
  }
}

/**
 * Get all descendant node IDs
 */
export function getDescendants(nodeId, hierarchy) {
  const descendants = [];
  const children = hierarchy[nodeId] || [];

  children.forEach(childId => {
    descendants.push(childId);
    descendants.push(...getDescendants(childId, hierarchy));
  });

  return descendants;
}

/**
 * Filter visible nodes and edges based on expansion state
 */
export function filterVisibleElements(nodes, edges, expandedNodes) {
  const visibleNodeIds = new Set();

  nodes.forEach(node => {
    if (node.data.level === 0) {
      visibleNodeIds.add(node.id);
    } else if (node.data.parentId && expandedNodes.has(node.data.parentId)) {
      visibleNodeIds.add(node.id);
    }
  });

  const visibleNodes = nodes
    .filter(node => visibleNodeIds.has(node.id))
    .map(node => ({ ...node, hidden: false }));

  const visibleEdges = edges
    .filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
    .map(edge => ({ ...edge, hidden: false }));

  return { nodes: visibleNodes, edges: visibleEdges };
}

export default buildExpandableMindmap;
