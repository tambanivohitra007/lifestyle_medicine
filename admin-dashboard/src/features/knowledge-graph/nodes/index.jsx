/**
 * @module nodes
 * Custom React Flow node components for the knowledge graph.
 * Each node type maps to a medical entity (condition, intervention, care domain, etc.)
 * with distinctive visual styling. The `nodeTypes` export is passed to React Flow's
 * nodeTypes prop for automatic component resolution.
 */
import ConditionNode from './ConditionNode';
import InterventionNode from './InterventionNode';
import CareDomainNode from './CareDomainNode';
import ScriptureNode from './ScriptureNode';
import EgwReferenceNode from './EgwReferenceNode';
import RecipeNode from './RecipeNode';
import EvidenceEntryNode from './EvidenceEntryNode';
import ReferenceNode from './ReferenceNode';
import GroupNode from './GroupNode';

// Export individual components
export {
  ConditionNode,
  InterventionNode,
  CareDomainNode,
  ScriptureNode,
  EgwReferenceNode,
  RecipeNode,
  EvidenceEntryNode,
  ReferenceNode,
  GroupNode,
};

// Export node types object for React Flow
export const nodeTypes = {
  condition: ConditionNode,
  intervention: InterventionNode,
  careDomain: CareDomainNode,
  scripture: ScriptureNode,
  egwReference: EgwReferenceNode,
  recipe: RecipeNode,
  evidenceEntry: EvidenceEntryNode,
  reference: ReferenceNode,
  group: GroupNode,
};
