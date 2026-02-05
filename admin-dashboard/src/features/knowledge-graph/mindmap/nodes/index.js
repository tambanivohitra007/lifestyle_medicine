// Import all mindmap node components
import CenterConditionNode from './CenterConditionNode';
import BranchLabelNode from './BranchLabelNode';
import RiskFactorNode from './RiskFactorNode';
import ComplicationNode from './ComplicationNode';
import SolutionCategoryNode from './SolutionCategoryNode';

// Re-use existing node types from parent knowledge graph
import {
  InterventionNode,
  ScriptureNode,
  RecipeNode,
  EgwReferenceNode,
} from '../../nodes';

// Export individual components
export {
  CenterConditionNode,
  BranchLabelNode,
  RiskFactorNode,
  ComplicationNode,
  SolutionCategoryNode,
};

// Create nodeTypes object for React Flow
export const mindmapNodeTypes = {
  centerCondition: CenterConditionNode,
  branchLabel: BranchLabelNode,
  riskFactor: RiskFactorNode,
  complication: ComplicationNode,
  solutionCategory: SolutionCategoryNode,
  // Re-use existing node types
  intervention: InterventionNode,
  scripture: ScriptureNode,
  recipe: RecipeNode,
  egwReference: EgwReferenceNode,
};

export default mindmapNodeTypes;
