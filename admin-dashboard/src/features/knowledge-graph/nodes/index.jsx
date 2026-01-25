import { memo } from 'react';
import {
  AlertCircle,
  Stethoscope,
  Shield,
  BookOpen,
  BookMarked,
  ChefHat,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import BaseNode from './BaseNode';

// Condition Node
export const ConditionNode = memo(({ data, selected }) => (
  <BaseNode
    data={{ ...data, subtitle: data.category }}
    icon={AlertCircle}
    selected={selected}
  />
));
ConditionNode.displayName = 'ConditionNode';

// Intervention Node
export const InterventionNode = memo(({ data, selected }) => (
  <BaseNode
    data={{ ...data, subtitle: data.careDomain }}
    icon={Stethoscope}
    selected={selected}
  />
));
InterventionNode.displayName = 'InterventionNode';

// Care Domain Node
export const CareDomainNode = memo(({ data, selected }) => (
  <BaseNode
    data={data}
    icon={Shield}
    selected={selected}
  />
));
CareDomainNode.displayName = 'CareDomainNode';

// Scripture Node
export const ScriptureNode = memo(({ data, selected }) => (
  <BaseNode
    data={{ ...data, subtitle: data.theme }}
    icon={BookOpen}
    selected={selected}
  />
));
ScriptureNode.displayName = 'ScriptureNode';

// EGW Reference Node
export const EgwReferenceNode = memo(({ data, selected }) => (
  <BaseNode
    data={{ ...data, subtitle: data.topic }}
    icon={BookMarked}
    selected={selected}
  />
));
EgwReferenceNode.displayName = 'EgwReferenceNode';

// Recipe Node
export const RecipeNode = memo(({ data, selected }) => {
  const tags = data.dietaryTags?.slice(0, 2).join(', ') || '';
  return (
    <BaseNode
      data={{ ...data, subtitle: tags }}
      icon={ChefHat}
      selected={selected}
    />
  );
});
RecipeNode.displayName = 'RecipeNode';

// Evidence Entry Node
export const EvidenceEntryNode = memo(({ data, selected }) => (
  <BaseNode
    data={{ ...data, subtitle: data.qualityRating ? `Grade ${data.qualityRating}` : '' }}
    icon={FileCheck}
    selected={selected}
  />
));
EvidenceEntryNode.displayName = 'EvidenceEntryNode';

// Reference Node
export const ReferenceNode = memo(({ data, selected }) => (
  <BaseNode
    data={{ ...data, subtitle: data.year ? `${data.year}` : '' }}
    icon={ExternalLink}
    selected={selected}
  />
));
ReferenceNode.displayName = 'ReferenceNode';

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
