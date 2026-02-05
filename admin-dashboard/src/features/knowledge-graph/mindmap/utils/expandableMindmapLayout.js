/**
 * Expandable Mindmap Layout Algorithm
 * Creates a hierarchical tree layout with expandable/collapsible nodes.
 *
 * DESIGN PRINCIPLE: Use space generously! Nodes should be well-separated
 * and easy to read. Users can zoom out if needed.
 *
 * Hierarchy:
 * - Level 0: Center condition node
 * - Level 1 (Master): Main categories (Risk Factors, Complications, Solutions by domain)
 * - Level 2: Sub-items within each category
 * - Level 3: Details (recipes linked to interventions, etc.)
 */

// Layout configuration - GENEROUS SPACING
const CONFIG = {
  // Distances from parent (in pixels)
  masterRadius: 400,       // Distance of master nodes from center
  level2Radius: 300,       // Distance of level 2 nodes from their parent
  level3Radius: 200,       // Distance of level 3 nodes from their parent

  // Minimum spacing between sibling nodes
  minNodeSpacing: 120,     // Minimum gap between adjacent nodes

  // Node dimensions for calculations
  nodeWidth: 200,
  nodeHeight: 100,
};

// Section configurations with positions (angles in degrees)
// Spread across the LEFT side of the circle (90° to 270°)
const SECTION_ANGLES = {
  riskFactors: -135,       // Top-left quadrant
  physiology: -165,        // Left side, upper
  complications: 135,      // Bottom-left quadrant
  additionalFactors: 165,  // Left side, lower
  researchIdeas: -105,     // Top-left, closer to top
};

// Solution domain angles - spread across the RIGHT side (270° to 90°)
// These represent the care domains for interventions
const SOLUTION_ANGLES = {
  'nutrition': -45,
  'exercise': -25,
  'hydrotherapy': -5,
  'spiritual-care': 15,
  'mental-health': 35,
  'stress-management': 55,
  'pharmacotherapy': 75,
  'natural-remedies': 95,
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
 * Calculate appropriate spread based on number of items and distance
 * More items = wider spread, further distance = can have wider spread
 */
function calculateSpread(count, distance) {
  if (count <= 1) return 0;

  // Base spread on item count - ensure minimum 25° between items
  const minAngleBetweenItems = 25;
  const desiredSpread = (count - 1) * minAngleBetweenItems;

  // Cap at reasonable maximum based on distance
  // Closer nodes need narrower spread to avoid crossing center
  const maxSpread = Math.min(140, distance * 0.4);

  return Math.min(desiredSpread, maxSpread);
}

/**
 * Distribute items in an arc AWAY from center
 * This ensures children fan out in the same general direction as their parent
 */
function distributeInArc(count, parentX, parentY, parentAngle, distance) {
  if (count === 0) return [];
  if (count === 1) {
    return [polarToCartesian(parentX, parentY, parentAngle, distance)];
  }

  const spread = calculateSpread(count, distance);
  const positions = [];
  const halfSpread = spread / 2;
  const angleStep = spread / (count - 1);

  for (let i = 0; i < count; i++) {
    const itemAngle = parentAngle - halfSpread + i * angleStep;
    positions.push(polarToCartesian(parentX, parentY, itemAngle, distance));
  }

  return positions;
}

/**
 * Build the complete node/edge data structure for the mindmap
 * Returns all nodes with their hierarchy info, to be filtered by expansion state
 */
export function buildExpandableMindmap(data, expandedNodes = new Set()) {
  if (!data || !data.condition) {
    return { nodes: [], edges: [], hierarchy: {} };
  }

  const nodes = [];
  const edges = [];
  const hierarchy = {}; // Maps node ID to its children IDs

  const centerX = 0;
  const centerY = 0;

  // 1. Create center condition node (always visible)
  const conditionNodeId = `condition-${data.condition.id}`;
  nodes.push({
    id: conditionNodeId,
    type: 'centerCondition',
    position: { x: centerX, y: centerY },
    data: {
      ...data.condition,
      isCenter: true,
      color: '#ef4444',
      level: 0,
      expandable: true,
      expanded: expandedNodes.has(conditionNodeId),
      childCount: 0, // Will be updated
    },
  });
  hierarchy[conditionNodeId] = [];

  const masterNodeIds = [];
  let sectionIndex = 0;
  let solutionIndex = 0;

  // 2. Create section master nodes (Level 1) - LEFT SIDE
  const sections = data.sections || {};
  const sectionKeys = Object.keys(sections).filter(key =>
    sections[key]?.items?.length > 0
  );

  // Distribute sections evenly on left side if no predefined angle
  const sectionBaseAngle = 180; // Left
  const sectionTotalSpread = 150; // From -75° to +75° around 180°

  sectionKeys.forEach((key) => {
    const section = sections[key];

    // Use predefined angle or calculate evenly distributed angle
    let angle = SECTION_ANGLES[key];
    if (angle === undefined) {
      const spreadStep = sectionTotalSpread / Math.max(1, sectionKeys.length - 1);
      angle = sectionBaseAngle - sectionTotalSpread/2 + sectionIndex * spreadStep;
    }
    sectionIndex++;

    const masterPos = polarToCartesian(centerX, centerY, angle, CONFIG.masterRadius);
    const masterId = `master-section-${key}`;

    masterNodeIds.push(masterId);
    hierarchy[conditionNodeId].push(masterId);
    hierarchy[masterId] = [];

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
        parentAngle: angle,
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

    // Level 2: Section items - fan out in same direction
    if (isExpanded) {
      const itemPositions = distributeInArc(
        section.items.length,
        masterPos.x,
        masterPos.y,
        angle, // Continue in same direction
        CONFIG.level2Radius
      );

      section.items.forEach((item, index) => {
        const itemId = `section-item-${item.id}`;
        hierarchy[masterId].push(itemId);

        nodes.push({
          id: itemId,
          type: 'leafNode',
          position: itemPositions[index],
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
  });

  // 3. Create solution master nodes (by care domain) - RIGHT SIDE
  const solutions = data.branches?.solutions || {};
  const solutionKeys = Object.keys(solutions).filter(key => {
    const sol = solutions[key];
    return sol?.careDomain && (
      sol.interventions?.length > 0 ||
      sol.scriptures?.length > 0 ||
      sol.egwReferences?.length > 0
    );
  });

  // Distribute solutions evenly on right side if no predefined angle
  const solutionBaseAngle = 0; // Right
  const solutionTotalSpread = 150; // From -75° to +75° around 0°

  solutionKeys.forEach((key) => {
    const solutionData = solutions[key];
    const domain = solutionData.careDomain;

    // Use predefined angle or calculate evenly distributed angle
    let angle = SOLUTION_ANGLES[key];
    if (angle === undefined) {
      const spreadStep = solutionTotalSpread / Math.max(1, solutionKeys.length - 1);
      angle = solutionBaseAngle - solutionTotalSpread/2 + solutionIndex * spreadStep;
    }
    solutionIndex++;

    const masterPos = polarToCartesian(centerX, centerY, angle, CONFIG.masterRadius);
    const masterId = `master-solution-${key}`;

    masterNodeIds.push(masterId);
    hierarchy[conditionNodeId].push(masterId);
    hierarchy[masterId] = [];

    const isExpanded = expandedNodes.has(masterId);
    const totalChildren = (solutionData.interventions?.length || 0) +
                          (solutionData.scriptures?.length || 0) +
                          (solutionData.egwReferences?.length || 0);

    nodes.push({
      id: masterId,
      type: 'masterNode',
      position: masterPos,
      data: {
        label: domain.name,
        count: solutionData.interventions?.length || 0,
        color: domain.color || '#6b7280',
        icon: domain.icon,
        level: 1,
        expandable: totalChildren > 0,
        expanded: isExpanded,
        childCount: totalChildren,
        parentId: conditionNodeId,
        nodeCategory: 'solution',
        interventionCount: solutionData.interventions?.length || 0,
        scriptureCount: solutionData.scriptures?.length || 0,
        egwCount: solutionData.egwReferences?.length || 0,
        parentAngle: angle,
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

    // Level 2: Interventions, scriptures, EGW references
    if (isExpanded) {
      const interventions = solutionData.interventions || [];
      const scriptures = solutionData.scriptures || [];
      const egwRefs = solutionData.egwReferences || [];

      // Calculate positions for all children - fan out in same direction
      const allChildrenCount = interventions.length + scriptures.length + egwRefs.length;
      const allPositions = distributeInArc(
        allChildrenCount,
        masterPos.x,
        masterPos.y,
        angle,
        CONFIG.level2Radius
      );

      let posIndex = 0;

      // Interventions
      interventions.forEach((intervention) => {
        const interventionId = `intervention-${intervention.id}`;
        hierarchy[masterId].push(interventionId);
        hierarchy[interventionId] = [];

        const isInterventionExpanded = expandedNodes.has(interventionId);
        const recipeCount = intervention.recipes?.length || 0;

        // Calculate this intervention's angle for its children
        const interventionAngle = allChildrenCount > 1
          ? angle - calculateSpread(allChildrenCount, CONFIG.level2Radius)/2 +
            posIndex * (calculateSpread(allChildrenCount, CONFIG.level2Radius) / (allChildrenCount - 1))
          : angle;

        nodes.push({
          id: interventionId,
          type: 'interventionNode',
          position: allPositions[posIndex],
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
            parentAngle: interventionAngle,
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

        // Level 3: Recipes (if intervention is expanded)
        if (isInterventionExpanded && intervention.recipes?.length > 0) {
          const recipePositions = distributeInArc(
            intervention.recipes.length,
            allPositions[posIndex].x,
            allPositions[posIndex].y,
            interventionAngle,
            CONFIG.level3Radius
          );

          intervention.recipes.forEach((recipe, recipeIdx) => {
            const recipeId = `recipe-${recipe.id}-${intervention.id}`;
            hierarchy[interventionId].push(recipeId);

            nodes.push({
              id: recipeId,
              type: 'leafNode',
              position: recipePositions[recipeIdx],
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

        posIndex++;
      });

      // Scriptures
      scriptures.forEach((scripture) => {
        const scriptureId = `scripture-${scripture.id}-${key}`;
        hierarchy[masterId].push(scriptureId);

        nodes.push({
          id: scriptureId,
          type: 'leafNode',
          position: allPositions[posIndex],
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

        posIndex++;
      });

      // EGW References
      egwRefs.forEach((egw) => {
        const egwId = `egw-${egw.id}-${key}`;
        hierarchy[masterId].push(egwId);

        nodes.push({
          id: egwId,
          type: 'leafNode',
          position: allPositions[posIndex],
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

        posIndex++;
      });
    }
  });

  // Update center node's child count
  const centerNode = nodes.find(n => n.id === conditionNodeId);
  if (centerNode) {
    centerNode.data.childCount = masterNodeIds.length;
  }

  return { nodes, edges, hierarchy };
}

/**
 * Get all descendant node IDs for a given node
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
 * Filter nodes and edges based on expansion state
 */
export function filterVisibleElements(nodes, edges, expandedNodes) {
  // A node is visible if:
  // 1. It's the center node, OR
  // 2. Its parent is expanded

  const visibleNodeIds = new Set();

  nodes.forEach(node => {
    if (node.data.level === 0) {
      // Center node always visible
      visibleNodeIds.add(node.id);
    } else if (node.data.parentId && expandedNodes.has(node.data.parentId)) {
      // Parent is expanded
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
