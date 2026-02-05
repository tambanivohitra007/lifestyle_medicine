/**
 * Expandable Mindmap Layout Algorithm
 *
 * DESIGN: Each master branch gets an exclusive angular SECTOR.
 * Within each sector, nodes are spaced generously to avoid ANY overlap.
 *
 * Layout Strategy:
 * - Circle divided into sectors (like pizza slices)
 * - Each master node owns a sector
 * - Children are distributed with GENEROUS spacing
 * - Minimum angular gap between siblings enforced
 */

// Layout configuration - VERY GENEROUS SPACING
const CONFIG = {
  // Distances from parent (in pixels) - INCREASED
  level1Radius: 400,       // Master nodes from center
  level2Radius: 350,       // Level 2 from master
  level3Radius: 280,       // Level 3 from level 2

  // Minimum angular spacing between nodes (degrees)
  minAngleBetweenNodes: 20,

  // Padding between sectors (degrees)
  sectorPadding: 15,

  // Minimum sector size (degrees)
  minSectorSize: 35,

  // Node approximate width for calculations
  nodeWidth: 200,
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
 * Calculate required angular space for N nodes at given distance
 * Based on node width and arc length
 */
function calculateRequiredAngle(nodeCount, distance) {
  if (nodeCount <= 1) return CONFIG.minAngleBetweenNodes;

  // Arc length needed = nodeCount * nodeWidth + gaps
  const gapSize = CONFIG.nodeWidth * 0.5; // Half node width gap
  const totalArcLength = nodeCount * CONFIG.nodeWidth + (nodeCount - 1) * gapSize;

  // Convert arc length to angle: angle = arcLength / radius * (180/PI)
  const angleNeeded = (totalArcLength / distance) * (180 / Math.PI);

  // Also enforce minimum angle between nodes
  const minByCount = (nodeCount - 1) * CONFIG.minAngleBetweenNodes;

  return Math.max(angleNeeded, minByCount);
}

/**
 * Distribute items evenly within a sector with generous spacing
 */
function distributeInSector(count, parentX, parentY, sectorStart, sectorEnd, distance) {
  if (count === 0) return [];

  const sectorSize = sectorEnd - sectorStart;

  if (count === 1) {
    const midAngle = sectorStart + sectorSize / 2;
    return [{
      position: polarToCartesian(parentX, parentY, midAngle, distance),
      angle: midAngle,
    }];
  }

  const positions = [];

  // Calculate spacing - ensure minimum angle between nodes
  const totalRequiredAngle = (count - 1) * CONFIG.minAngleBetweenNodes;

  // If we have enough space, use it all; otherwise use minimum spacing
  let angleStep;
  let startOffset;

  if (totalRequiredAngle < sectorSize * 0.8) {
    // We have extra space - distribute evenly with padding
    const padding = sectorSize * 0.1;
    const usableSize = sectorSize - 2 * padding;
    angleStep = usableSize / (count - 1);
    startOffset = padding;
  } else {
    // Tight fit - use minimum spacing centered in sector
    angleStep = CONFIG.minAngleBetweenNodes;
    const totalUsed = (count - 1) * angleStep;
    startOffset = (sectorSize - totalUsed) / 2;
  }

  for (let i = 0; i < count; i++) {
    const itemAngle = sectorStart + startOffset + i * angleStep;
    positions.push({
      position: polarToCartesian(parentX, parentY, itemAngle, distance),
      angle: itemAngle,
    });
  }

  return positions;
}

/**
 * Build the complete mindmap with sector-based layout
 */
export function buildExpandableMindmap(data, expandedNodes = new Set()) {
  if (!data || !data.condition) {
    return { nodes: [], edges: [], hierarchy: {} };
  }

  const nodes = [];
  const edges = [];
  const hierarchy = {};

  const centerX = 0;
  const centerY = 0;

  // 1. Create center condition node
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
      childCount: 0,
    },
  });
  hierarchy[conditionNodeId] = [];

  // 2. Collect all master branches with their expanded child counts
  const masterBranches = [];

  // Sections (left side)
  const sections = data.sections || {};
  Object.entries(sections).forEach(([key, section]) => {
    if (!section.items || section.items.length === 0) return;

    const isExpanded = expandedNodes.has(`master-section-${key}`);
    // Weight based on expanded children to allocate proper space
    const expandedWeight = isExpanded ? section.items.length : 1;

    masterBranches.push({
      type: 'section',
      key,
      data: section,
      side: 'left',
      baseWeight: 1,
      expandedWeight: expandedWeight,
      childCount: section.items.length,
    });
  });

  // Solutions (right side)
  const solutions = data.branches?.solutions || {};
  Object.entries(solutions).forEach(([key, solutionData]) => {
    if (!solutionData?.careDomain) return;
    const childCount = (solutionData.interventions?.length || 0) +
                       (solutionData.scriptures?.length || 0) +
                       (solutionData.egwReferences?.length || 0);
    if (childCount === 0) return;

    const isExpanded = expandedNodes.has(`master-solution-${key}`);
    const expandedWeight = isExpanded ? childCount : 1;

    masterBranches.push({
      type: 'solution',
      key,
      data: solutionData,
      side: 'right',
      baseWeight: 1,
      expandedWeight: expandedWeight,
      childCount: childCount,
    });
  });

  // 3. Divide each side into sectors
  const leftBranches = masterBranches.filter(b => b.side === 'left');
  const rightBranches = masterBranches.filter(b => b.side === 'right');

  // Left side: 95° to 265° (170° total) - more space
  const leftStart = 95;
  const leftEnd = 265;
  const leftSectors = allocateSectors(leftBranches, leftStart, leftEnd, expandedNodes);

  // Right side: -85° to 85° (170° total) - more space
  const rightStart = -85;
  const rightEnd = 85;
  const rightSectors = allocateSectors(rightBranches, rightStart, rightEnd, expandedNodes);

  const allSectors = [...leftSectors, ...rightSectors];
  const masterNodeIds = [];

  // 4. Create master nodes and their children
  allSectors.forEach((sector) => {
    const { branch, startAngle, endAngle } = sector;
    const midAngle = (startAngle + endAngle) / 2;

    if (branch.type === 'section') {
      createSectionBranch(
        branch, midAngle, startAngle, endAngle,
        nodes, edges, hierarchy, conditionNodeId, expandedNodes, masterNodeIds
      );
    } else {
      createSolutionBranch(
        branch, midAngle, startAngle, endAngle,
        nodes, edges, hierarchy, conditionNodeId, expandedNodes, masterNodeIds
      );
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
 * Allocate sectors to branches - expanded branches get more space
 */
function allocateSectors(branches, totalStart, totalEnd, expandedNodes) {
  if (branches.length === 0) return [];

  const totalSize = totalEnd - totalStart;
  const totalPadding = CONFIG.sectorPadding * (branches.length + 1);
  const availableSize = totalSize - totalPadding;

  // Calculate weights - expanded branches need more space
  const totalWeight = branches.reduce((sum, b) => {
    const masterId = `master-${b.type === 'section' ? 'section' : 'solution'}-${b.key}`;
    const isExpanded = expandedNodes.has(masterId);
    // Expanded branches get space proportional to child count
    // Collapsed branches get minimum space
    return sum + (isExpanded ? Math.max(2, Math.sqrt(b.childCount) * 2) : 1);
  }, 0);

  // Allocate sectors proportionally
  const sectors = [];
  let currentAngle = totalStart + CONFIG.sectorPadding;

  branches.forEach((branch) => {
    const masterId = `master-${branch.type === 'section' ? 'section' : 'solution'}-${branch.key}`;
    const isExpanded = expandedNodes.has(masterId);
    const weight = isExpanded ? Math.max(2, Math.sqrt(branch.childCount) * 2) : 1;

    let sectorSize = (weight / totalWeight) * availableSize;

    // Ensure minimum size
    sectorSize = Math.max(CONFIG.minSectorSize, sectorSize);

    // For expanded sectors, ensure enough space for children
    if (isExpanded) {
      const requiredAngle = calculateRequiredAngle(branch.childCount, CONFIG.level2Radius);
      sectorSize = Math.max(sectorSize, requiredAngle + 20); // Extra padding
    }

    sectors.push({
      branch,
      startAngle: currentAngle,
      endAngle: currentAngle + sectorSize,
    });

    currentAngle += sectorSize + CONFIG.sectorPadding;
  });

  return sectors;
}

/**
 * Create section branch with children
 */
function createSectionBranch(
  branch, midAngle, sectorStart, sectorEnd,
  nodes, edges, hierarchy, conditionNodeId, expandedNodes, masterNodeIds
) {
  const section = branch.data;
  const masterId = `master-section-${branch.key}`;
  const masterPos = polarToCartesian(0, 0, midAngle, CONFIG.level1Radius);

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
  if (isExpanded && section.items.length > 0) {
    const itemPositions = distributeInSector(
      section.items.length,
      masterPos.x, masterPos.y,
      sectorStart, sectorEnd,
      CONFIG.level2Radius
    );

    section.items.forEach((item, index) => {
      const itemId = `section-item-${item.id}`;
      hierarchy[masterId].push(itemId);

      nodes.push({
        id: itemId,
        type: 'leafNode',
        position: itemPositions[index].position,
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
 * Create solution branch with children
 */
function createSolutionBranch(
  branch, midAngle, sectorStart, sectorEnd,
  nodes, edges, hierarchy, conditionNodeId, expandedNodes, masterNodeIds
) {
  const solutionData = branch.data;
  const domain = solutionData.careDomain;
  const masterId = `master-solution-${branch.key}`;
  const masterPos = polarToCartesian(0, 0, midAngle, CONFIG.level1Radius);

  masterNodeIds.push(masterId);
  hierarchy[conditionNodeId].push(masterId);
  hierarchy[masterId] = [];

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

  // Level 2: All children within sector
  if (isExpanded && totalChildren > 0) {
    const sectorSize = sectorEnd - sectorStart;

    // Calculate sub-sector sizes proportionally
    const interventionWeight = interventions.length || 0;
    const scriptureWeight = scriptures.length || 0;
    const egwWeight = egwRefs.length || 0;
    const totalWeight = interventionWeight + scriptureWeight + egwWeight;

    let currentSectorStart = sectorStart;

    // Interventions sub-sector
    if (interventions.length > 0) {
      const subSectorSize = (interventionWeight / totalWeight) * sectorSize;
      const subSectorEnd = currentSectorStart + subSectorSize;

      const positions = distributeInSector(
        interventions.length,
        masterPos.x, masterPos.y,
        currentSectorStart, subSectorEnd,
        CONFIG.level2Radius
      );

      interventions.forEach((intervention, index) => {
        const interventionId = `intervention-${intervention.id}`;
        hierarchy[masterId].push(interventionId);
        hierarchy[interventionId] = [];

        const isInterventionExpanded = expandedNodes.has(interventionId);
        const recipeCount = intervention.recipes?.length || 0;

        // Calculate this intervention's sub-sector for recipes
        const interventionSectorSize = subSectorSize / interventions.length;
        const recipeSectorStart = currentSectorStart + index * interventionSectorSize;
        const recipeSectorEnd = recipeSectorStart + interventionSectorSize;

        nodes.push({
          id: interventionId,
          type: 'interventionNode',
          position: positions[index].position,
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
          const recipePositions = distributeInSector(
            intervention.recipes.length,
            positions[index].position.x,
            positions[index].position.y,
            recipeSectorStart, recipeSectorEnd,
            CONFIG.level3Radius
          );

          intervention.recipes.forEach((recipe, recipeIdx) => {
            const recipeId = `recipe-${recipe.id}-${intervention.id}`;
            hierarchy[interventionId].push(recipeId);

            nodes.push({
              id: recipeId,
              type: 'leafNode',
              position: recipePositions[recipeIdx].position,
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

      currentSectorStart = subSectorEnd;
    }

    // Scriptures sub-sector
    if (scriptures.length > 0) {
      const subSectorSize = (scriptureWeight / totalWeight) * sectorSize;
      const subSectorEnd = currentSectorStart + subSectorSize;

      const positions = distributeInSector(
        scriptures.length,
        masterPos.x, masterPos.y,
        currentSectorStart, subSectorEnd,
        CONFIG.level2Radius
      );

      scriptures.forEach((scripture, index) => {
        const scriptureId = `scripture-${scripture.id}-${branch.key}`;
        hierarchy[masterId].push(scriptureId);

        nodes.push({
          id: scriptureId,
          type: 'leafNode',
          position: positions[index].position,
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

      currentSectorStart = subSectorEnd;
    }

    // EGW References sub-sector
    if (egwRefs.length > 0) {
      const subSectorSize = (egwWeight / totalWeight) * sectorSize;
      const subSectorEnd = currentSectorStart + subSectorSize;

      const positions = distributeInSector(
        egwRefs.length,
        masterPos.x, masterPos.y,
        currentSectorStart, subSectorEnd,
        CONFIG.level2Radius
      );

      egwRefs.forEach((egw, index) => {
        const egwId = `egw-${egw.id}-${branch.key}`;
        hierarchy[masterId].push(egwId);

        nodes.push({
          id: egwId,
          type: 'leafNode',
          position: positions[index].position,
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
