// Custom edge components for React Flow knowledge graph
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
