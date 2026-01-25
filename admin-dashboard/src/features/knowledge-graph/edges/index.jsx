// Custom edge components for React Flow knowledge graph
import ConditionInterventionEdge from './ConditionInterventionEdge';
import RelationshipEdge from './RelationshipEdge';

// Export individual components
export {
  ConditionInterventionEdge,
  RelationshipEdge,
};

// Export edge types object for React Flow
export const edgeTypes = {
  'condition-intervention': ConditionInterventionEdge,
  'relationship': RelationshipEdge,
};
