# 📚 CivilFo 루브릭 평가 시스템 | V1 → V2 → V3 완전 가이드

**학생 Revit 프로젝트 평가의 모든 것: 결과물(Outcome) + 과정(Process/SRL)**

---

## 🎯 전체 목표

✅ **평가 이원화**: 제품 품질(25~15%) + 과정/사고(10%)  
✅ **실시간 피드백**: 즉시 개선안 제시  
✅ **교수 감독**: 대시보드로 전체 현황 파악  
✅ **점진적 자동화**: V1 수동 → V3 규칙 기반 자동화

---

## 📊 루브릭 구조 (100점 만점)

### 6개 평가 영역

| 영역 | 이름 | 가중치 | 만점 | 하위지표 (각 0-4점) |
|------|------|--------|------|-------------------|
| **A** | 모델링 정확성 | 25% | 25점 | A1(치수·정합), A2(연결·관통), A3(중복/누락) |
| **B** | BIM 표준/LOD | 20% | 20점 | B1(네이밍), B2(속성), B3(LOD 적합성) |
| **C** | 문서화(Sheet) | 15% | 15점 | C1(뷰 구성), C2(주석/기호), C3(가독성) |
| **D** | 시공성/충돌성 | 15% | 15점 | D1(충돌위험), D2(시공순서), D3(유지관리) |
| **E** | 설계 의도·근거 | 15% | 15점 | E1(의도-결과), E2(대안탐색), E3(제약고려) |
| **F** | 과정/메타인지(SRL) | 10% | 10점 | F1(오류탐지), F2(자기수정), F3(계획) |

**총점 계산 (예시)**:
```
A영역: A1=3, A2=2, A3=4 → 평균 3 → (3/4)=0.75 → 25% × 0.75 = 18.75점
B영역: B1=4, B2=3, B3=2 → 평균 3 → (3/4)=0.75 → 20% × 0.75 = 15점
...
총점 = 18.75 + 15 + ... = XX점
```

### 임계(게이트) 규칙

```
⚠️ 치명 결함 발견 시:
  - 구조 요소 부재 → 총점 상한 60점
  - LOD 미준수 반복 → B영역 0점
  - 네이밍 체계 위반 → B1 0점
  
❌ 증거 부족 시:
  - 이미지 < 2장 → −5점
```

---

## 🚀 3단계 로드맵

### **Phase 1️⃣: V1 (MVP) - 지금 당장 가능** ✅ **현재 구현 중**

#### 증거 수집
```
입력 항목:
  ✓ 이미지 3장 (평면도/단면도/3D)
  ✓ 자기평가 텍스트 (설계의도, 인식된 결함, 개선계획)
  ✓ 간이 체크리스트 (Yes/Partial/No)

예시 체크리스트:
  □ A1_Accuracy: Yes / Partial / No
  □ A2_Connections: Partial (70% 처리)
  □ A3_Duplicates: Yes (중복 없음)
  □ B1_Naming: Yes
  □ B2_Properties: Partial
  □ B3_LOD: No (미준수)
  ...
  □ F1_ErrorDetection: Partial
  □ F2_SelfCorrection: Yes
  □ F3_NextSteps: Yes
```

#### 평가 로직
```
1️⃣ 체크리스트 점수화
   Yes → 4점, Partial → 2점, No → 0점

2️⃣ 자기평가 텍스트 분석
   - "설계 의도" 키워드 감지 → E1 가산점
   - "문제/오류" 키워드 감지 → F1 가산점
   - "개선/계획" 키워드 감지 → F3 가산점
   - 텍스트 길이: Minimal(<50) / Brief(50-200) / Comprehensive(>200)

3️⃣ 이미지 품질 평가
   - 개수: Complete(3) / Partial(2) / Minimal(1)
   - 다양성: 평면/단면/3D 포함

4️⃣ 치명 결함 검사
   - A1='No' → 구조 요소 부재 → Cap 60점
   - B3='No' → LOD 미준수 → B 영역 0점
   - 이미지<2 → −5점

5️⃣ 종합 점수 계산 및 등급 부여
   90+: A+, 85+: A, 80+: B+, ..., <60: F
```

#### API 응답 예시 (V1)

```json
{
  "version": "V1 (MVP)",
  "studentId": "20241001",
  "courseCode": "CE301",
  "submissionTime": "2024-10-27T10:30:00Z",
  "evidenceCollected": {
    "images": {
      "count": 3,
      "quality": "Complete"
    },
    "selfDescription": {
      "length": 180,
      "hasDesignIntent": true,
      "hasErrorAwareness": true,
      "hasImprovement": true,
      "textQuality": "Comprehensive"
    },
    "checklist": {
      "A1_Accuracy": "Yes",
      "A2_Connections": "Partial",
      "A3_Duplicates": "Yes",
      "B1_Naming": "Yes",
      "B2_Properties": "Partial",
      "B3_LOD": "No",
      ...
    }
  },
  "rubricScores": {
    "A": {
      "name": "모델링 정확성",
      "weight": 0.25,
      "indicators": {
        "A1": {"points": 4, "maxPoints": 4, "percentage": 100},
        "A2": {"points": 2, "maxPoints": 4, "percentage": 50},
        "A3": {"points": 4, "maxPoints": 4, "percentage": 100}
      },
      "sectionScore": 20,
      "maxScore": 25,
      "weightedScore": 5.0
    },
    "B": {...},
    ...
  },
  "fatalFaults": [
    {
      "type": "lod_non_compliance",
      "severity": "High",
      "message": "LOD requirements not met",
      "penalty": "B section → 0 points if repeated"
    }
  ],
  "totalScore": 72,
  "grade": "B",
  "srlAnalysis": {
    "designIntentClarity": { "detected": true, "score": 3 },
    "errorAwareness": { "detected": true, "score": 3 },
    "improvementPlanning": { "detected": true, "score": 3 },
    "textLength": { "value": 180, "status": "Detailed" }
  },
  "recommendations": [
    "🟢 Good: Some refinements recommended.",
    "⚠️ BIM 표준/LOD: Priority improvement (15/100)",
    "📋 LOD를 명세에 맞게 조정하세요",
    "✓ 설계 의도 설명 우수"
  ]
}
```

#### 구현 체크리스트 (V1)
- [x] 루브릭 구조 정의
- [x] 체크리스트 기반 점수화
- [x] 텍스트 분석 (키워드 감지)
- [x] 치명 결함 감지
- [x] SRL 분석
- [x] 추천사항 생성
- [ ] 프론트엔드 UI (체크리스트, 텍스트 입력)
- [ ] 평가 결과 디스플레이
- [ ] 학생별 평가 히스토리 저장 (Firestore)

---

### **Phase 2️⃣: V2 (IFC/PDF) - 3개월 후** 📅

#### 추가 증거 수집

```
입력 항목 (V1 + 추가):
  ✓ RVT → IFC/PDF 변환
  ✓ IFC 속성 추출
  ✓ 도면(PDF) 생성

자동 분석:
  - 네이밍 규칙 준수율 (IFC 속성에서)
  - 파라미터 채워짐률
  - 카테고리별 요소 수량
  - LOD 수준 감지
```

#### 추가 평가 로직

```
2️⃣ IFC 속성 분석
   - Element names 추출 → Naming compliance %
   - Parameters 추출 → Properties fill rate
   - Categories 추출 → Quantity check
   - LOD metadata 추출 → LOD level detection

3️⃣ PDF 도면 분석 (OCR + 휴리스틱)
   - Sheet 개수, 뷰 포함 여부
   - 주석 밀도 (annotation density)
   - 도면 레이아웃 점검

4️⃣ 점수 통합
   V1 점수 + IFC 검증 + PDF 검증 = 최종 점수
```

#### API 응답 확장 (V2)

```json
{
  "version": "V2 (IFC/PDF)",
  ...
  "ifcAnalysis": {
    "elementCount": { "walls": 45, "doors": 12, "windows": 18 },
    "namingCompliance": 92,
    "parameterFillRate": 85,
    "lodLevel": "LOD300",
    "issues": [
      "4 unnamed elements detected",
      "Door parameter 'FireRating' missing in 3 instances"
    ]
  },
  "pdfAnalysis": {
    "sheetCount": 8,
    "averageAnnotationDensity": 0.72,
    "viewDistribution": {
      "planCount": 3,
      "elevationCount": 2,
      "sectionCount": 2,
      "detailCount": 1
    }
  },
  "automatedChecks": {
    "B1_Naming": { "auto": 92, "manual": "Yes" },
    "B2_Properties": { "auto": 85, "manual": "Partial" },
    "C1_ViewOrg": { "auto": 88, "manual": "Yes" }
  }
}
```

#### 구현 계획 (V2)
- [ ] RVT → IFC 변환 (Autodesk Model Derivative)
- [ ] IFC 파서 (속성/요소 추출)
- [ ] PDF 생성 및 기본 분석
- [ ] 자동 점수화 로직
- [ ] 수동/자동 점수 병합

---

### **Phase 3️⃣: V3 (자동화) - 6개월 후** 🤖

#### Forge/규칙 엔진 기반 자동화

```
완전 자동화 항목:
  ✅ Naming 규칙 점검
  ✅ LOD 적합성 검증
  ✅ 파라미터 채워짐 여부
  ✅ 카테고리 분류
  ✅ 간이 Clash 감지 (교집합 검사)
  ✅ 연결성 검증 (Wall-Door, Wall-Window)

수동 검증 항목 (교수):
  ⚠️ 의도-결과 정합
  ⚠️ 대안 탐색 여부
  ⚠️ 시공성 판단
  ⚠️ 설계 과정 평가
```

#### 구현 아키텍처 (V3)

```
[RVT 파일]
    ↓
[Forge Design Automation]
    ↓ (변환)
[IFC + Metadata]
    ↓
[규칙 엔진]
    ├─ Naming 규칙 체크
    ├─ LOD 검증
    ├─ 파라미터 검증
    ├─ 카테고리 분류
    ├─ Clash 감지
    └─ 연결성 검증
    ↓
[자동 점수 (A, B, C, D)]
    ↓
[E, F 부분은 자기평가 텍스트 + 교수 검증]
    ↓
[최종 점수 + 등급]
```

#### 예상 API 응답 (V3)

```json
{
  "version": "V3 (Automated)",
  "automationLevel": 90,
  "manualReviewRequired": ["E", "F"],
  "automatedAnalysis": {
    "A_ModelingAccuracy": {
      "auto": 82,
      "status": "Connection validation 95% complete"
    },
    "B_BIMStandards": {
      "auto": 88,
      "details": {
        "B1_Naming": 92,
        "B2_Properties": 85,
        "B3_LOD": 87
      }
    },
    "C_Documentation": {
      "auto": 79,
      "sheetAnalysis": "8 sheets, 12 views"
    },
    "D_Constructability": {
      "auto": 75,
      "clashReport": "3 minor clashes detected",
      "clashLocations": ["Stair-MEP", "Door-Frame", "Window-Structure"]
    }
  },
  "manualReview": {
    "E_DesignIntent": "Pending instructor review",
    "F_SRL": "Student self-reflection analysis"
  },
  "estimatedFinalScore": "85±5"
}
```

---

## 📋 V1 체크리스트 카테고리 예시

### 학생 자기평가 폼 (V1)

```
=== A. 모델링 정확성 ===
□ A1_Accuracy
  ○ Yes (완벽한 치수)
  ○ Partial (약간의 오차, ±5%)
  ○ No (큰 오차, >10%)

□ A2_Connections
  ○ Yes (모든 연결 상세 처리)
  ○ Partial (70% 이상 처리)
  ○ No (거의 미처리)

□ A3_Duplicates
  ○ Yes (중복/누락 없음)
  ○ Partial (1-2개 이슈)
  ○ No (3개 이상)

=== B. BIM 표준/LOD ===
□ B1_Naming
  ○ Yes (100% 준수)
  ○ Partial (80% 이상)
  ○ No (<50%)

□ B2_Properties
  ○ Yes (모든 필수 속성)
  ○ Partial (70% 이상)
  ○ No (<40%)

□ B3_LOD
  ○ Yes (명세 준수)
  ○ Partial (부분 준수)
  ○ No (미준수)

=== C. 문서화 ===
... (유사)

=== D. 시공성/충돌성 ===
... (유사)

=== E. 설계 의도·근거 ===
... (유사)

=== F. 과정/메타인지 (SRL) ===
□ F1_ErrorDetection
  설명: 어떤 방식으로 오류를 찾아냈나요?
  
□ F2_SelfCorrection
  설명: 발견한 오류를 어떻게 수정했나요?
  
□ F3_NextSteps
  설명: 다음 번에 개선하고 싶은 점은?
```

### 자기평가 텍스트 예시 (V1)

```
"이 프로젝트에서는 3층 사무실 건물의 주 구조체와 
기본 마감을 모델링했습니다.

설계 의도: 개방형 평면과 자연채광을 최대화하기 위해 
기둥 간격을 8m으로 설정했고, 창문 배치를 남향으로 집중했습니다.

발견된 문제: 도어와 벽의 관통 처리에서 
일부 불일치가 있었고, 각 층의 천고가 다르게 설정되어 있었습니다.

개선 조치: 이를 수정했고 층별 높이를 통일했습니다.

다음 단계: 다음 번에는 MEP 시스템(전기, 배관)까지 
상세히 모델링하고 상충 분석을 미리 할 계획입니다."

→ 분석 결과:
   - "설계 의도" 감지 ✓
   - "발견된 문제" 감지 ✓ (F1 오류탐지)
   - "개선 조치" 감지 ✓ (F2 자기수정)
   - "다음 단계" 감지 ✓ (F3 계획)
   - 텍스트 길이: 180 글자 (Comprehensive)
```

---

## 🎓 교수 대시보드 (향후)

```
CivilFo Faculty Dashboard
═══════════════════════════════════════════════

[Course: CE301 - Building Design Studio]

👥 Student Distribution:
  A+: 2 명 (10%)
  A:  5 명 (25%)
  B+: 8 명 (40%)
  B:  4 명 (20%)
  C+: 1 명 (5%)

📊 Rubric Performance:
  [Bar Chart]
  A (Accuracy):        ███████ 78%
  B (Standards):       █████░░ 62%
  C (Documentation):   ████████ 85%
  D (Constructability):█████░░░ 70%
  E (Design Intent):   ███████░ 75%
  F (SRL):             ██████░░ 68%

🚨 Issues Detected:
  [5 students] LOD non-compliance
  [3 students] Missing structural elements
  [8 students] Weak design documentation

📈 Trends:
  - SRL scores improving week-by-week
  - Naming compliance at 82% average
  - Clash detection pending (V3)
```

---

## 💾 데이터 저장 구조 (Firestore)

```
/courses/{courseCode}/
  /submissions/{submissionId}/
    - studentId: string
    - submissionTime: timestamp
    - version: "V1" | "V2" | "V3"
    - checklist: Map<string, string>  // {A1_Accuracy: "Yes", ...}
    - selfDescription: string
    - images: Array<url>
    - rubricScores: Map<string, number>  // {A: 20, B: 15, ...}
    - totalScore: number
    - grade: string
    - fatalFaults: Array<Object>
    - srlAnalysis: Object
    - recommendations: Array<string>
    - feedbackFromInstructor: string (교수 피드백)
    - createdAt: timestamp
    - updatedAt: timestamp
```

---

## 🎯 성공 지표

### V1 완성 조건
- [x] 체크리스트 기반 평가 완료
- [x] 자동 점수 계산 완료
- [x] SRL 분석 완료
- [ ] 프론트엔드 UI 완료
- [ ] 학생 평가 실행 (파일럿 5명)

### V2 완성 조건 (3개월)
- [ ] IFC 자동 변환
- [ ] 속성 자동 추출
- [ ] 자동 점수화 70% 정확도

### V3 완성 조건 (6개월)
- [ ] Clash 자동 감지
- [ ] 90%+ 자동화
- [ ] 전체 수업 적용

---

**이제 실제 수업에서 사용 가능한 평가 시스템이 준비되었습니다!** 🎓✨
