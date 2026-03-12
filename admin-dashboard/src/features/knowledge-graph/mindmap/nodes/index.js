/**
 * @module mindmap/nodes
 * Custom React Flow node components for the condition mindmap visualization.
 * Includes both mindmap-specific nodes (CenterCondition, MasterNode, LeafNode, etc.)
 * and re-used nodes from the parent knowledge graph (Scripture, Recipe, EgwReference).
 * The `mindmapNodeTypes` export is passed to React Flow's nodeTypes prop.
 */
import CenterConditionNode from './CenterConditionNode';
import BranchLabelNode from './BranchLabelNode';
import RiskFactorNode from './RiskFactorNode';
import ComplicationNode from './ComplicationNode';
import SolutionCategoryNode from './SolutionCategoryNode';
import SectionBranchNode from './SectionBranchNode';
import SectionItemNode from './SectionItemNode';
import InterventionMindmapNode from './InterventionMindmapNode';
import MasterNode from './MasterNode';
import ExpandableInterventionNode from './ExpandableInterventionNode';
import LeafNode from './LeafNode';

// Re-use existing node types from parent knowledge graph
import {
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
  SectionBranchNode,
  SectionItemNode,
  InterventionMindmapNode,
  MasterNode,
  ExpandableInterventionNode,
  LeafNode,
};

// Create nodeTypes object for React Flow
export const mindmapNodeTypes = {
  centerCondition: CenterConditionNode,
  branchLabel: BranchLabelNode,
  riskFactor: RiskFactorNode,
  complication: ComplicationNode,
  solutionCategory: SolutionCategoryNode,
  // Section-based nodes (using existing condition sections)
  sectionBranch: SectionBranchNode,
  sectionItem: SectionItemNode,
  // Intervention with description
  intervention: InterventionMindmapNode,
  // Expandable mindmap node types
  masterNode: MasterNode,
  interventionNode: ExpandableInterventionNode,
  leafNode: LeafNode,
  // Re-use existing node types
  scripture: ScriptureNode,
  recipe: RecipeNode,
  egwReference: EgwReferenceNode,
};

export default mindmapNodeTypes;
