/**
 * Mindmap Layout Algorithm
 * Creates a radial tree layout with the condition at the center,
 * risk factors at the top, complications at the bottom,
 * and solutions radiating around the sides.
 */

// Branch configuration with angles (in degrees, 0 = right, 90 = bottom, -90 = top)
const BRANCH_CONFIG = {
  riskFactors: {
    angle: -90,      // Top
    spread: 120,     // Degrees to spread items
    distance: 280,
    itemDistance: 180,
    color: '#f97316'
  },
  complications: {
    angle: 90,       // Bottom
    spread: 120,
    distance: 280,
    itemDistance: 180,
    color: '#dc2626'
  },
  // Solutions positioned around the sides
  nutrition: { angle: -150, distance: 320, color: '#f59e0b' },
  exercise: { angle: 150, distance: 320, color: '#22c55e' },
  hydrotherapy: { angle: -120, distance: 320, color: '#06b6d4' },
  'spiritual-care': { angle: 0, distance: 320, color: '#6366f1' },
  'mental-health': { angle: -30, distance: 320, color: '#14b8a6' },
  'stress-management': { angle: 30, distance: 320, color: '#a855f7' },
  pharmacotherapy: { angle: 60, distance: 320, color: '#64748b' },
  'natural-remedies': { angle: 120, distance: 320, color: '#10b981' },
};

// Default configuration for unknown solution branches
const DEFAULT_SOLUTION_CONFIG = {
  distance: 320,
  color: '#6b7280'
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
function distributeInFan(items, centerX, centerY, config) {
  const { angle, spread, itemDistance } = config;
  const count = items.length;

  if (count === 0) return [];
  if (count === 1) {
    return [polarToCartesian(centerX, centerY, angle, itemDistance)];
  }

  const startAngle = angle - spread / 2;
  const angleStep = spread / (count - 1);

  return items.map((_, index) => {
    const itemAngle = startAngle + index * angleStep;
    return polarToCartesian(centerX, centerY, itemAngle, itemDistance);
  });
}

/**
 * Build nodes and edges from mindmap data
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

  // 2. Create Risk Factors branch
  const riskFactors = data.branches?.riskFactors || [];
  if (riskFactors.length > 0) {
    const rfConfig = BRANCH_CONFIG.riskFactors;

    // Branch label node
    const rfLabelPos = polarToCartesian(centerX, centerY, rfConfig.angle, rfConfig.distance * 0.5);
    const rfLabelId = 'branch-riskFactors';
    nodes.push({
      id: rfLabelId,
      type: 'branchLabel',
      position: rfLabelPos,
      data: {
        label: 'Risk Factors',
        count: riskFactors.length,
        color: rfConfig.color,
        icon: 'alert-triangle',
      },
    });
    edges.push({
      id: `edge-center-to-riskFactors`,
      source: conditionNodeId,
      target: rfLabelId,
      type: 'mindmap',
      data: { color: rfConfig.color },
    });

    // Risk factor items
    const rfPositions = distributeInFan(riskFactors, centerX, centerY, rfConfig);
    riskFactors.forEach((rf, index) => {
      const nodeId = `riskFactor-${rf.id}`;
      nodes.push({
        id: nodeId,
        type: 'riskFactor',
        position: rfPositions[index],
        data: {
          ...rf,
          color: rf.severityColor || rfConfig.color,
        },
      });
      edges.push({
        id: `edge-rf-${rf.id}`,
        source: rfLabelId,
        target: nodeId,
        type: 'mindmap',
        data: { color: rf.severityColor || rfConfig.color },
      });
    });
  }

  // 3. Create Complications branch
  const complications = data.branches?.complications || [];
  if (complications.length > 0) {
    const compConfig = BRANCH_CONFIG.complications;

    // Branch label node
    const compLabelPos = polarToCartesian(centerX, centerY, compConfig.angle, compConfig.distance * 0.5);
    const compLabelId = 'branch-complications';
    nodes.push({
      id: compLabelId,
      type: 'branchLabel',
      position: compLabelPos,
      data: {
        label: 'Complications',
        count: complications.length,
        color: compConfig.color,
        icon: 'alert-circle',
      },
    });
    edges.push({
      id: `edge-center-to-complications`,
      source: conditionNodeId,
      target: compLabelId,
      type: 'mindmap',
      data: { color: compConfig.color },
    });

    // Complication items
    const compPositions = distributeInFan(complications, centerX, centerY, compConfig);
    complications.forEach((comp, index) => {
      const nodeId = `complication-${comp.id}`;
      nodes.push({
        id: nodeId,
        type: 'complication',
        position: compPositions[index],
        data: {
          ...comp,
          color: comp.likelihoodColor || compConfig.color,
        },
      });
      edges.push({
        id: `edge-comp-${comp.id}`,
        source: compLabelId,
        target: nodeId,
        type: 'mindmap',
        data: { color: comp.likelihoodColor || compConfig.color },
      });
    });
  }

  // 4. Create Solution branches
  const solutions = data.branches?.solutions || {};
  const solutionKeys = Object.keys(solutions);

  // Calculate angles for solution branches that don't have predefined positions
  const predefinedKeys = Object.keys(BRANCH_CONFIG).filter(k => !['riskFactors', 'complications'].includes(k));

  // Distribute custom solution branches in available angles
  const usedAngles = new Set([-90, 90]); // Risk factors and complications
  predefinedKeys.forEach(k => {
    if (BRANCH_CONFIG[k]) usedAngles.add(BRANCH_CONFIG[k].angle);
  });

  let customAngleIndex = 0;
  const availableAngles = [-45, 45, -135, 135, -60, 60, -120, 120].filter(a => !usedAngles.has(a));

  solutionKeys.forEach((key) => {
    const solutionData = solutions[key];
    if (!solutionData?.careDomain) return;

    const hasContent =
      (solutionData.interventions?.length > 0) ||
      (solutionData.scriptures?.length > 0) ||
      (solutionData.egwReferences?.length > 0);

    if (!hasContent) return;

    // Get config for this solution branch
    let config = BRANCH_CONFIG[key];
    if (!config) {
      const angle = availableAngles[customAngleIndex % availableAngles.length] || (customAngleIndex * 30);
      config = {
        ...DEFAULT_SOLUTION_CONFIG,
        angle,
        color: solutionData.careDomain.color || DEFAULT_SOLUTION_CONFIG.color
      };
      customAngleIndex++;
    }

    const branchColor = solutionData.careDomain.color || config.color;

    // Solution category node
    const categoryPos = polarToCartesian(centerX, centerY, config.angle, config.distance);
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
        expanded: true,
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
    const subNodeSpread = Math.min(60, 180 / Math.max(interventions.length, 1));

    interventions.forEach((intervention, index) => {
      const subAngle = config.angle + (index - (interventions.length - 1) / 2) * subNodeSpread * 0.5;
      const subPos = polarToCartesian(categoryPos.x, categoryPos.y, subAngle, subNodeDistance);

      const interventionId = `intervention-${intervention.id}`;
      nodes.push({
        id: interventionId,
        type: 'intervention',
        position: subPos,
        data: {
          ...intervention,
          color: branchColor,
        },
      });

      edges.push({
        id: `edge-${categoryId}-to-${interventionId}`,
        source: categoryId,
        target: interventionId,
        type: 'mindmap',
        data: { color: branchColor, dashed: true },
      });

      // Create recipe sub-nodes for this intervention
      const recipes = intervention.recipes || [];
      recipes.slice(0, 3).forEach((recipe, recipeIndex) => {
        const recipeAngle = subAngle + (recipeIndex - (Math.min(recipes.length, 3) - 1) / 2) * 20;
        const recipePos = polarToCartesian(subPos.x, subPos.y, recipeAngle, 80);

        const recipeId = `recipe-${recipe.id}-${intervention.id}`;
        nodes.push({
          id: recipeId,
          type: 'recipe',
          position: recipePos,
          data: {
            ...recipe,
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

    // Create scripture sub-nodes
    const scriptures = solutionData.scriptures || [];
    scriptures.slice(0, 4).forEach((scripture, index) => {
      const subAngle = config.angle + 90 + (index - (Math.min(scriptures.length, 4) - 1) / 2) * 25;
      const subPos = polarToCartesian(categoryPos.x, categoryPos.y, subAngle, 100);

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

    // Create EGW reference sub-nodes
    const egwRefs = solutionData.egwReferences || [];
    egwRefs.slice(0, 4).forEach((egw, index) => {
      const subAngle = config.angle - 90 + (index - (Math.min(egwRefs.length, 4) - 1) / 2) * 25;
      const subPos = polarToCartesian(categoryPos.x, categoryPos.y, subAngle, 100);

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
