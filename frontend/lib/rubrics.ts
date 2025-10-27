export interface RubricItem {
  id: string
  label: string
  description: string
  category: string
}

export const RUBRICS: RubricItem[] = [
  // 모델링 정확성 (Modeling Accuracy)
  {
    id: 'accuracy_dimension',
    label: '치수 정합성 (Dimensional Consistency)',
    description: '모든 요소의 치수가 설계 사양과 일치',
    category: '모델링 정확성',
  },
  {
    id: 'accuracy_connectivity',
    label: '구조요소 연결성 (Structural Connectivity)',
    description: '구조 요소들이 올바르게 연결되어 있음',
    category: '모델링 정확성',
  },
  {
    id: 'accuracy_tolerance',
    label: '공차 준수 (Tolerance Compliance)',
    description: '건설 공차 기준 충족',
    category: '모델링 정확성',
  },

  // BIM 규격 준수 (BIM Compliance)
  {
    id: 'bim_naming',
    label: 'Naming Convention (명명규칙)',
    description: '요소, 뷰, 시트 이름이 표준 규칙 따름',
    category: 'BIM 규격 준수',
  },
  {
    id: 'bim_lod',
    label: 'LOD 스펙 (Level of Detail)',
    description: '설계 단계에 적절한 LOD 수준 유지',
    category: 'BIM 규격 준수',
  },
  {
    id: 'bim_parameters',
    label: '파라미터 관리 (Parameter Management)',
    description: '프로젝트 및 패밀리 파라미터가 체계적으로 관리됨',
    category: 'BIM 규격 준수',
  },

  // 설계 의도 (Design Intent)
  {
    id: 'design_spatial',
    label: '공간 효율성 (Spatial Efficiency)',
    description: '공간 배치와 동선이 효율적으로 설계됨',
    category: '설계 의도',
  },
  {
    id: 'design_stress',
    label: '응력 고려 (Stress Consideration)',
    description: '구조적 응력 분포를 고려한 설계',
    category: '설계 의도',
  },
  {
    id: 'design_innovation',
    label: '혁신성 (Innovation)',
    description: '독창적이고 창의적인 설계 솔루션',
    category: '설계 의도',
  },

  // 충돌검토 (Clash Detection)
  {
    id: 'clash_structural',
    label: '구조 충돌 없음 (No Structural Clashes)',
    description: '구조 요소 간 충돌 없음',
    category: '충돌검토',
  },
  {
    id: 'clash_mep',
    label: 'MEP 충돌 없음 (No MEP Clashes)',
    description: '기계, 전기, 배관 시스템 간 충돌 없음',
    category: '충돌검토',
  },

  // 기능성 (Functionality)
  {
    id: 'func_constructability',
    label: '시공성 (Constructability)',
    description: '실제 시공 가능성이 고려된 설계',
    category: '기능성',
  },
  {
    id: 'func_maintenance',
    label: '유지관리성 (Maintainability)',
    description: '준공 후 유지관리가 용이한 설계',
    category: '기능성',
  },
  {
    id: 'func_sustainability',
    label: '지속가능성 (Sustainability)',
    description: '친환경적이고 지속 가능한 설계',
    category: '기능성',
  },
]

export const RUBRIC_CATEGORIES = [
  '모델링 정확성',
  'BIM 규격 준수',
  '설계 의도',
  '충돌검토',
  '기능성',
]

export const getRubricsByCategory = (category: string): RubricItem[] => {
  return RUBRICS.filter((r) => r.category === category)
}
