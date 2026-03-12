/**
 * @module edges
 * Custom React Flow edge components for the knowledge graph.
 * Three edge types: condition-intervention (evidence-based), intervention-relationship
 * (synergy/conflict), and generic relationship. The `edgeTypes` export maps edge type
 * strings (including 'default' and 'smoothstep' fallbacks) to components.
 */
import ConditionInterventionEdge from './ConditionInterventionEdge';
import RelationshipEdge from './RelationshipEdge';
import InterventionRelationshipEdge from './InterventionRelationshipEdge';

// Export individual components
export {
  ConditionInterventionEdge,
  RelationshipEdge,
  InterventionRelationshipEdge,
};

// Export edge types object for React Flow
// Include 'default' and 'smoothstep' to ensure all edges use step paths
export const edgeTypes = {
  'condition-intervention': ConditionInterventionEdge,
  'intervention-relationship': InterventionRelationshipEdge,
  'relationship': RelationshipEdge,
  'default': RelationshipEdge,
  'smoothstep': RelationshipEdge,
};
