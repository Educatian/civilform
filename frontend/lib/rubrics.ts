export interface RubricItem {
  id: string
  label: string
  description: string
  category: string
}

export const RUBRICS: RubricItem[] = [
  // Modeling Accuracy
  {
    id: 'accuracy_dimension',
    label: 'Dimensional Consistency',
    description: 'All elements have dimensions that match design specifications',
    category: 'Modeling Accuracy',
  },
  {
    id: 'accuracy_connectivity',
    label: 'Structural Connectivity',
    description: 'Structural elements are properly connected',
    category: 'Modeling Accuracy',
  },
  {
    id: 'accuracy_tolerance',
    label: 'Tolerance Compliance',
    description: 'Construction tolerance standards are met',
    category: 'Modeling Accuracy',
  },

  // BIM Compliance
  {
    id: 'bim_naming',
    label: 'Naming Convention',
    description: 'Elements, views, and sheets follow standard naming rules',
    category: 'BIM Compliance',
  },
  {
    id: 'bim_lod',
    label: 'Level of Detail (LOD)',
    description: 'LOD level is appropriate for the design phase',
    category: 'BIM Compliance',
  },
  {
    id: 'bim_parameters',
    label: 'Parameter Management',
    description: 'Project and family parameters are systematically managed',
    category: 'BIM Compliance',
  },

  // Design Intent
  {
    id: 'design_spatial',
    label: 'Spatial Efficiency',
    description: 'Space layout and circulation are efficiently designed',
    category: 'Design Intent',
  },
  {
    id: 'design_stress',
    label: 'Stress Consideration',
    description: 'Design considers structural stress distribution',
    category: 'Design Intent',
  },
  {
    id: 'design_innovation',
    label: 'Innovation',
    description: 'Design presents original and creative solutions',
    category: 'Design Intent',
  },

  // Clash Detection
  {
    id: 'clash_structural',
    label: 'No Structural Clashes',
    description: 'No conflicts between structural elements',
    category: 'Clash Detection',
  },
  {
    id: 'clash_mep',
    label: 'No MEP Clashes',
    description: 'No conflicts between mechanical, electrical, and plumbing systems',
    category: 'Clash Detection',
  },

  // Functionality
  {
    id: 'func_constructability',
    label: 'Constructability',
    description: 'Design considers practical construction feasibility',
    category: 'Functionality',
  },
  {
    id: 'func_maintenance',
    label: 'Maintainability',
    description: 'Design facilitates post-completion maintenance',
    category: 'Functionality',
  },
  {
    id: 'func_sustainability',
    label: 'Sustainability',
    description: 'Design is environmentally friendly and sustainable',
    category: 'Functionality',
  },
]

export const RUBRIC_CATEGORIES = [
  'Modeling Accuracy',
  'BIM Compliance',
  'Design Intent',
  'Clash Detection',
  'Functionality',
]

export const getRubricsByCategory = (category: string): RubricItem[] => {
  return RUBRICS.filter((r) => r.category === category)
}
