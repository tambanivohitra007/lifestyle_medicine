// Enhanced custom node components for React Flow knowledge graph
import ConditionNode from './ConditionNode';
import InterventionNode from './InterventionNode';
import CareDomainNode from './CareDomainNode';
import ScriptureNode from './ScriptureNode';
import EgwReferenceNode from './EgwReferenceNode';
import RecipeNode from './RecipeNode';
import EvidenceEntryNode from './EvidenceEntryNode';
import ReferenceNode from './ReferenceNode';

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
};
