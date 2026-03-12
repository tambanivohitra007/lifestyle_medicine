/**
 * @module mindmapLayout
 * Mindmap Layout Algorithm -- creates a radial tree layout for condition visualization.
 *
 * Layout structure:
 * - Center: condition node at origin (0, 0)
 * - Inner ring: section branches (risk factors, physiology, complications, etc.)
 *   positioned at predefined angles around the center
 * - Section items: fanned out from their branch node at the branch's angle
 * - Right side: solution branches (care domains) with sub-nodes for
 *   interventions (max 5), scriptures (max 3), EGW references (max 3), and recipes (max 2)
 *
 * Uses polar coordinate system (angle + distance) converted to Cartesian for placement.
 */

/** @constant Predefined angular positions and distances for each section type */
const SECTION_POSITIONS = {
  riskFactors: { angle: -90, distance: 280 },      // Top
  physiology: { angle: -135, distance: 300 },      // Top-left
  complications: { angle: 90, distance: 280 },     // Bottom
  solutions: { angle: 0, distance: 300 },          // Right
  additionalFactors: { angle: 135, distance: 300 },// Bottom-left
  scripture: { angle: 45, distance: 300 },         // Bottom-right
  researchIdeas: { angle: -45, distance: 300 },    // Top-right
};

// Solution care domain positions (radial around the right side)
const SOLUTION_ANGLES = {
  'nutrition': -30,
  'exercise': -60,
  'hydrotherapy': 30,
  'spiritual-care': 0,
  'mental-health': 60,
  'stress-management': -15,
  'pharmacotherapy': 45,
  'natural-remedies': 15,
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
 * Distribute items in a fan pattern around a given angle.
 * For N items, spaces them evenly within the spread range centered on baseAngle.
 *
 * @param {number} count - Number of items to distribute
 * @param {number} centerX - X coordinate of fan origin
 * @param {number} centerY - Y coordinate of fan origin
 * @param {number} baseAngle - Central angle of the fan (degrees)
 * @param {number} distance - Distance from center to each item
 * @param {number} [spread=60] - Total angular spread of the fan (degrees)
 * @returns {Array<{x: number, y: number}>} Computed positions
 */
function distributeInFan(count, centerX, centerY, baseAngle, distance, spread = 60) {
  if (count === 0) return [];
  if (count === 1) {
    return [polarToCartesian(centerX, centerY, baseAngle, distance)];
  }

  const positions = [];
  const startAngle = baseAngle - spread / 2;
  const angleStep = spread / (count - 1);

  for (let i = 0; i < count; i++) {
    const itemAngle = startAngle + i * angleStep;
    positions.push(polarToCartesian(centerX, centerY, itemAngle, distance));
  }

  return positions;
}

/**
 * Build React Flow nodes and edges from the mindmap API response data.
 * Creates a radial tree with condition at center, section branches (left side),
 * and solution branches with interventions/scriptures/EGW references (right side).
 *
 * @param {Object} data - Mindmap API data: { condition, sections, branches }
 * @param {Object} [options] - Layout options
 * @param {number} [options.centerX=0] - X coordinate of center node
 * @param {number} [options.centerY=0] - Y coordinate of center node
 * @returns {{ nodes: Array, edges: Array }} React Flow nodes and edges
 */
export function buildMindmapGraph(data, options = {}) {
  const {
    centerX = 0,
    centerY = 0,
  } = options;

  if (!data || !data.condition) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];

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
    },
  });

  // 2. Create section branches (risk factors, physiology, complications, etc.)
  const sections = data.sections || {};
  Object.entries(sections).forEach(([key, section]) => {
    if (!section.items || section.items.length === 0) return;

    const posConfig = SECTION_POSITIONS[key] || { angle: 0, distance: 300 };

    // Section branch label
    const branchPos = polarToCartesian(centerX, centerY, posConfig.angle, posConfig.distance * 0.5);
    const branchId = `section-${key}`;

    nodes.push({
      id: branchId,
      type: 'sectionBranch',
      position: branchPos,
      data: {
        label: section.label,
        count: section.items.length,
        color: section.color,
        icon: section.icon,
        sectionType: section.type,
        items: section.items,
      },
    });

    edges.push({
      id: `edge-center-to-${key}`,
      source: conditionNodeId,
      target: branchId,
      type: 'mindmap',
      data: { color: section.color },
    });

    // Section items (individual sections like "Obesity", "Genetics", etc.)
    const itemPositions = distributeInFan(
      section.items.length,
      centerX, centerY,
      posConfig.angle,
      posConfig.distance + 80,
      Math.min(80, section.items.length * 20)
    );

    section.items.forEach((item, index) => {
      const itemId = `section-item-${item.id}`;
      nodes.push({
        id: itemId,
        type: 'sectionItem',
        position: itemPositions[index],
        data: {
          ...item,
          color: section.color,
          sectionType: section.type,
          sectionLabel: section.label,
        },
      });

      edges.push({
        id: `edge-${branchId}-to-${item.id}`,
        source: branchId,
        target: itemId,
        type: 'mindmap',
        data: { color: section.color, dashed: true },
      });
    });
  });

  // 3. Create Solution branches (interventions by care domain)
  const solutions = data.branches?.solutions || {};
  const solutionKeys = Object.keys(solutions);

  // Calculate base angle for solutions (opposite side from most sections)
  const solutionBaseAngle = 0; // Right side

  solutionKeys.forEach((key, index) => {
    const solutionData = solutions[key];
    if (!solutionData?.careDomain) return;

    const hasContent =
      (solutionData.interventions?.length > 0) ||
      (solutionData.scriptures?.length > 0) ||
      (solutionData.egwReferences?.length > 0);

    if (!hasContent) return;

    // Calculate angle for this solution branch
    const angle = SOLUTION_ANGLES[key] ?? (solutionBaseAngle + (index - solutionKeys.length / 2) * 25);
    const distance = 320;
    const branchColor = solutionData.careDomain.color || '#6b7280';

    // Solution category node
    const categoryPos = polarToCartesian(centerX, centerY, angle, distance);
    const categoryId = `solution-${key}`;

    nodes.push({
      id: categoryId,
      type: 'solutionCategory',
      position: categoryPos,
      data: {
        ...solutionData.careDomain,
        interventionCount: solutionData.interventions?.length || 0,
        scriptureCount: solutionData.scriptures?.length || 0,
        egwCount: solutionData.egwReferences?.length || 0,
        color: branchColor,
        interventions: solutionData.interventions || [],
        scriptures: solutionData.scriptures || [],
        egwReferences: solutionData.egwReferences || [],
      },
    });

    edges.push({
      id: `edge-center-to-${key}`,
      source: conditionNodeId,
      target: categoryId,
      type: 'mindmap',
      data: { color: branchColor },
    });

    // Create intervention sub-nodes
    const interventions = solutionData.interventions || [];
    const subNodeDistance = 120;

    interventions.slice(0, 5).forEach((intervention, idx) => {
      const subAngle = angle + (idx - (Math.min(interventions.length, 5) - 1) / 2) * 18;
      const subPos = polarToCartesian(categoryPos.x, categoryPos.y, subAngle, subNodeDistance);

      const interventionId = `intervention-${intervention.id}`;
      nodes.push({
        id: interventionId,
        type: 'intervention',
        position: subPos,
        data: {
          ...intervention,
          color: branchColor,
          label: intervention.name,
        },
      });

      edges.push({
        id: `edge-${categoryId}-to-${interventionId}`,
        source: categoryId,
        target: interventionId,
        type: 'mindmap',
        data: { color: branchColor, dashed: true },
      });

      // Create recipe sub-nodes for this intervention (max 2)
      const recipes = intervention.recipes || [];
      recipes.slice(0, 2).forEach((recipe, recipeIdx) => {
        const recipeAngle = subAngle + (recipeIdx - (Math.min(recipes.length, 2) - 1) / 2) * 15;
        const recipePos = polarToCartesian(subPos.x, subPos.y, recipeAngle, 70);

        const recipeId = `recipe-${recipe.id}-${intervention.id}`;
        nodes.push({
          id: recipeId,
          type: 'recipe',
          position: recipePos,
          data: {
            ...recipe,
            label: recipe.title,
            color: '#f59e0b',
          },
        });

        edges.push({
          id: `edge-${interventionId}-to-${recipeId}`,
          source: interventionId,
          target: recipeId,
          type: 'mindmap',
          data: { color: '#f59e0b', dashed: true },
        });
      });
    });

    // Create scripture sub-nodes (max 3)
    const scriptures = solutionData.scriptures || [];
    scriptures.slice(0, 3).forEach((scripture, idx) => {
      const subAngle = angle + 70 + (idx - (Math.min(scriptures.length, 3) - 1) / 2) * 15;
      const subPos = polarToCartesian(categoryPos.x, categoryPos.y, subAngle, 90);

      const scriptureId = `scripture-${scripture.id}-${key}`;
      nodes.push({
        id: scriptureId,
        type: 'scripture',
        position: subPos,
        data: {
          ...scripture,
          label: scripture.reference,
          color: '#6366f1',
        },
      });

      edges.push({
        id: `edge-${categoryId}-to-${scriptureId}`,
        source: categoryId,
        target: scriptureId,
        type: 'mindmap',
        data: { color: '#6366f1', dashed: true },
      });
    });

    // Create EGW reference sub-nodes (max 3)
    const egwRefs = solutionData.egwReferences || [];
    egwRefs.slice(0, 3).forEach((egw, idx) => {
      const subAngle = angle - 70 + (idx - (Math.min(egwRefs.length, 3) - 1) / 2) * 15;
      const subPos = polarToCartesian(categoryPos.x, categoryPos.y, subAngle, 90);

      const egwId = `egw-${egw.id}-${key}`;
      nodes.push({
        id: egwId,
        type: 'egwReference',
        position: subPos,
        data: {
          ...egw,
          label: egw.citation,
          color: '#8b5cf6',
        },
      });

      edges.push({
        id: `edge-${categoryId}-to-${egwId}`,
        source: categoryId,
        target: egwId,
        type: 'mindmap',
        data: { color: '#8b5cf6', dashed: true },
      });
    });
  });

  return { nodes, edges };
}

export default buildMindmapGraph;
