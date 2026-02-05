/**
 * Expandable Mindmap Layout Algorithm
 * Creates a hierarchical tree layout with expandable/collapsible nodes.
 *
 * Hierarchy:
 * - Level 0: Center condition node
 * - Level 1 (Master): Main categories (Risk Factors, Complications, Solutions by domain)
 * - Level 2: Sub-items within each category
 * - Level 3: Details (recipes linked to interventions, etc.)
 */

// Layout configuration
const CONFIG = {
  // Spacing
  masterRadius: 200,      // Distance of master nodes from center
  level2Radius: 140,      // Distance of level 2 nodes from their parent
  level3Radius: 100,      // Distance of level 3 nodes from their parent

  // Angular spread for children
  childSpread: 50,        // Degrees spread for child nodes

  // Node dimensions (for collision avoidance)
  nodeWidth: 180,
  nodeHeight: 80,
};

// Section configurations with positions (angles in degrees)
const SECTION_ANGLES = {
  riskFactors: -120,       // Top-left
  physiology: -150,        // Left-top
  complications: 120,      // Bottom-left
  additionalFactors: 150,  // Left-bottom
  researchIdeas: -60,      // Top-right
};

// Solution domain angles (right side)
const SOLUTION_ANGLES = {
  'nutrition': -30,
  'exercise': -15,
  'hydrotherapy': 0,
  'spiritual-care': 15,
  'mental-health': 30,
  'stress-management': 45,
  'pharmacotherapy': 60,
  'natural-remedies': 75,
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
 * Distribute items in a fan pattern around a given angle
 */
function distributeInFan(count, parentX, parentY, baseAngle, distance, spread = CONFIG.childSpread) {
  if (count === 0) return [];
  if (count === 1) {
    return [polarToCartesian(parentX, parentY, baseAngle, distance)];
  }

  const positions = [];
  const halfSpread = spread / 2;
  const angleStep = spread / (count - 1);

  for (let i = 0; i < count; i++) {
    const itemAngle = baseAngle - halfSpread + i * angleStep;
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

  let masterAngleIndex = 0;
  const masterNodeIds = [];

  // 2. Create section master nodes (Level 1)
  const sections = data.sections || {};
  Object.entries(sections).forEach(([key, section]) => {
    if (!section.items || section.items.length === 0) return;

    const angle = SECTION_ANGLES[key] ?? (-180 + masterAngleIndex * 30);
    masterAngleIndex++;

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

    // Level 2: Section items
    if (isExpanded) {
      const itemPositions = distributeInFan(
        section.items.length,
        masterPos.x, masterPos.y,
        angle,
        CONFIG.level2Radius,
        Math.min(80, section.items.length * 15)
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

  // 3. Create solution master nodes (by care domain)
  const solutions = data.branches?.solutions || {};
  const solutionKeys = Object.keys(solutions).filter(key => {
    const sol = solutions[key];
    return sol?.careDomain && (
      sol.interventions?.length > 0 ||
      sol.scriptures?.length > 0 ||
      sol.egwReferences?.length > 0
    );
  });

  solutionKeys.forEach((key, index) => {
    const solutionData = solutions[key];
    const domain = solutionData.careDomain;

    const angle = SOLUTION_ANGLES[key] ?? (index * 20);
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

      // Calculate positions for all children
      const allChildrenCount = interventions.length + scriptures.length + egwRefs.length;
      const allPositions = distributeInFan(
        allChildrenCount,
        masterPos.x, masterPos.y,
        angle,
        CONFIG.level2Radius,
        Math.min(100, allChildrenCount * 12)
      );

      let posIndex = 0;

      // Interventions
      interventions.forEach((intervention) => {
        const interventionId = `intervention-${intervention.id}`;
        hierarchy[masterId].push(interventionId);
        hierarchy[interventionId] = [];

        const isInterventionExpanded = expandedNodes.has(interventionId);
        const recipeCount = intervention.recipes?.length || 0;

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
          const recipePositions = distributeInFan(
            intervention.recipes.length,
            allPositions[posIndex].x, allPositions[posIndex].y,
            angle + (posIndex - interventions.length / 2) * 10,
            CONFIG.level3Radius,
            Math.min(60, intervention.recipes.length * 20)
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
