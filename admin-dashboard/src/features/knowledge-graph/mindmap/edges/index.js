/**
 * @module mindmap/edges
 * Custom React Flow edge components for the condition mindmap.
 * Uses a single MindmapEdge component for all connections, mapped to both
 * 'mindmap' and 'default' edge types.
 */
import MindmapEdge from './MindmapEdge';

export { MindmapEdge };

export const mindmapEdgeTypes = {
  mindmap: MindmapEdge,
  default: MindmapEdge,
};

export default mindmapEdgeTypes;
