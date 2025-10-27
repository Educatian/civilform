# CivilForm - Revit 프로젝트 평가 시스템

토목공학(Construction/Civil Engineering) 학부생들의 Autodesk Revit 프로젝트를 AI가 자동으로 평가하고 맞춤형 피드백을 제공하는 **완전한 교육용 애플리케이션**입니다.

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────┐
│   Next.js Frontend      │
│  (3000 port)            │
│ - 학생 로그인           │
│ - 루브릭 선택           │
│ - 이미지 업로드 (3장)   │
│ - 자기평가 입력         │
│ - 결과 시각화           │
└──────────┬──────────────┘
           │ FormData (학번, 설명, 이미지)
           │
┌──────────▼──────────────┐
│  Express Backend        │
│  (4000 port)            │
│  POST /evaluate         │
│ - Multer: 파일 핸들링   │
│ - Cloud Storage 업로드  │
│ - Gemini Vision 호출    │
│ - Firestore 저장        │
└──────────┬──────────────┘
           │
       ┌───┴───┐
       │       │
   ┌───▼─┐ ┌─▼────────┐
   │Cloud│ │Firestore │
   │Store│ │Database  │
   └─────┘ └──────────┘
```

## 📋 프로젝트 구조

```
civilfo/
├── frontend/                 # Next.js 학생용 UI
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx          # 4단계 평가 프로세스
│   │   └── globals.css
│   ├── components/
│   │   ├── LoginStep.tsx     # 1️⃣ 학번/과목 입력
│   │   ├── RubricStep.tsx    # 2️⃣ 루브릭 선택
│   │   ├── UploadStep.tsx    # 3️⃣ 이미지 + 자기평가
│   │   └── ResultsStep.tsx   # 4️⃣ AI 결과 표시
│   ├── lib/
│   │   ├── store.ts          # Zustand 상태 관리
│   │   ├── api.ts            # 백엔드 API 클라이언트
│   │   └── rubrics.ts        # 평가 항목 정의 (15개)
│   └── package.json
│
├── server/                   # Express.js 백엔드
│   ├── src/
│   │   ├── index.js          # Express 서버 + /evaluate 엔드포인트
│   │   └── lib/
│   │       ├── firebase.js   # Firebase Admin 초기화
│   │       └── gemini.js     # Gemini Vision AI 통합
│   └── package.json
│
├── client-example/
│   └── next-upload-example.tsx  # 초기 예제 (deprecated)
│
└── README.md                 # 이 파일
```

## ✨ 주요 기능

### 1️⃣ 학생 로그인 (Login Step)
- 학번 입력 (자동화 가능)
- 과목 코드 선택 (CE 301, CE 302, CE 401 등)
- 간단한 UI로 빠른 접근

### 2️⃣ 평가 루브릭 선택 (Rubric Step)
**5개 카테고리 × 3개 항목 = 총 15개 평가 항목:**
- **모델링 정확성**: 치수정합, 연결성, 공차
- **BIM 규격**: 명명규칙, LOD, 파라미터 관리
- **설계 의도**: 공간 효율, 응력, 혁신성
- **충돌검토**: 구조/MEP 충돌 여부
- **기능성**: 시공성, 유지관리, 지속가능성

### 3️⃣ 설계 자료 업로드 (Upload Step)
- **이미지**: 최대 3장, 드래그 앤 드롭 지원
- **자기평가**: 최소 20자 이상 서술형 입력
- 실시간 검증 및 피드백

### 4️⃣ AI 평가 결과 (Results Step)
- **점수**: 0-100, 원형 차트 시각화
- **등급**: 우수/양호/개선필요/미흡
- **AI 분석**:
  - ✅ 강점 (strengths)
  - 📌 개선 필요 사항 (weaknesses)
  - 🚀 개선 방안 (improvement_steps)
  - 🔴 기술적 위험도 (technical_risk: low/medium/high)
- **부가 기능**: 결과 인쇄, 새로운 평가 시작

## 🚀 빠른 시작

### 사전 요구사항
- Node.js 18+
- npm/yarn
- Firebase 프로젝트 (Firestore + Cloud Storage)
- Google Gemini API 키

### 1️⃣ 백엔드 설정

```bash
cd server
npm install

# .env 파일 생성 (server/.env.example 참고)
cat > .env << EOF
PORT=4000
GEMINI_API_KEY=your_api_key_here
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=service-account@your_project_id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EOF

npm run dev
# Server listening on http://localhost:4000
```

### 2️⃣ 프론트엔드 설정

```bash
cd frontend
npm install

# .env.local 파일 생성
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF

npm run dev
# Open http://localhost:3000
```

### 3️⃣ 시스템 테스트

1. 브라우저에서 `http://localhost:3000` 열기
2. 학번 입력 (예: 20201234)
3. 과목 선택 (예: CE 301)
4. 루브릭 선택 (최소 1개)
5. 이미지 업로드 (최대 3장) + 자기평가 작성 (20자+)
6. 평가 시작 버튼 클릭
7. AI 분석 결과 확인

## 📊 데이터 모델 (Firestore)

### Collection: `revit_evaluations`

```javascript
{
  studentId: "20201234",              // 학번
  courseCode: "CE 301",                // 과목 코드
  modelImages: [                       // 업로드된 이미지 URL (signed)
    "https://storage.googleapis.com/..."
  ],
  selfDescription: "프로젝트 설명...",  // 자기평가
  checklist: {                         // 선택한 루브릭
    "accuracy_dimension": true,
    "bim_naming": true,
    ...
  },
  aiFeedback: {                        // Gemini 평가 결과 (JSON)
    score: 82,
    strengths: ["강점 1", "강점 2"],
    weaknesses: ["개선 1"],
    improvement_steps: ["1단계", "2단계"],
    technical_risk: "low"
  },
  timestamp: Timestamp,                // 평가 시각
  docId: "auto_generated_id"
}
```

## 🔌 API 명세

### POST /evaluate

**요청:**
```bash
curl -X POST http://localhost:4000/evaluate \
  -F "studentId=20201234" \
  -F "courseCode=CE 301" \
  -F "selfDescription=프로젝트 설명..." \
  -F "checklist={\"accuracy_dimension\":true,...}" \
  -F "images=@image1.png" \
  -F "images=@image2.jpg"
```

**응답:**
```json
{
  "ok": true,
  "score": 82,
  "strengths": ["강점 목록"],
  "weaknesses": ["약점 목록"],
  "aiFeedback": {
    "score": 82,
    "strengths": [...],
    "weaknesses": [...],
    "improvement_steps": [...],
    "technical_risk": "low"
  },
  "modelImages": ["https://...signed_url..."],
  "docId": "abc123xyz"
}
```

## 🎨 UI/UX 특징

- **진행도 표시**: 4단계 프로세스 시각화
- **반응형 디자인**: 모바일/태블릿/데스크톱 최적화
- **실시간 검증**: 입력값 즉시 확인
- **아름다운 결과 표시**: 원형 차트, 이모지, 색상 코딩
- **다국어 지원**: 한국어 인터페이스 (확장 가능)

## 🔧 기술 스택

| 계층 | 기술 | 버전 |
|------|------|------|
| Frontend | Next.js | 14.1 |
| | React | 18.2 |
| | TypeScript | 5.3 |
| | Tailwind CSS | 3.4 |
| | Zustand | 4.4 |
| Backend | Express.js | 4.19 |
| | Node.js | 18+ |
| | Multer | 1.4 |
| AI | Google Gemini | 1.5 Pro |
| DB | Firestore | Latest |
| Storage | Cloud Storage | Latest |

## 📚 개발 가이드

### 새로운 루브릭 추가

`frontend/lib/rubrics.ts` 수정:

```typescript
export const RUBRICS: RubricItem[] = [
  // ... 기존 항목
  {
    id: 'new_rubric_id',
    label: '새로운 항목',
    description: '설명...',
    category: '카테고리명',
  },
]
```

### Gemini 평가 프롬프트 수정

`server/src/lib/gemini.js`의 `buildVisionPromptParts()` 함수 수정

### API 응답 확장

`frontend/lib/api.ts`의 `EvaluateResponse` 인터페이스 수정

## 🧪 테스트

### 로컬 테스트

```bash
# 터미널 1: 백엔드
cd server && npm run dev

# 터미널 2: 프론트엔드
cd frontend && npm run dev

# 터널 3 (선택): Firestore 에뮬레이터
firebase emulators:start --project YOUR_PROJECT_ID
```

### 단위 테스트 추가 (향후)

```bash
cd frontend
npm install --save-dev jest @testing-library/react
npm run test
```

## 📊 다음 단계 (로드맵)

- ✅ **1단계**: 텍스트 기반 평가 기능 (완료)
- ✅ **2단계**: Firestore 저장 (완료)
- ✅ **3단계**: 프론트엔드 UI 완성 (완료)
- ✅ **4단계**: 이미지 업로드 + Gemini Vision (완료)
- 🔜 **5단계**: 교수용 대시보드
  - 학생 평가 현황 테이블
  - 점수 통계 (히스토그램, 평균)
  - 강점/약점 워드클라우드
  - 위험 프로젝트 자동 태그
- 🔜 **6단계**: 배포
  - Vercel (프론트엔드)
  - Cloud Run/App Engine (백엔드)
  - Firestore 보안 규칙 설정

## 🔒 보안 고려사항

- ✅ CORS 설정 (Express)
- ✅ Firestore 보안 규칙 (설정 필요)
- ✅ Cloud Storage signed URL (7일 유효)
- ✅ FormData를 통한 파일 전송
- ⚠️ Firebase API 키는 .env에만 (노출 금지)

## 📞 문제 해결

### "Backend not found" 오류
→ 백엔드 서버 실행 확인: `http://localhost:4000/health`

### "Firebase not initialized" 오류
→ `server/.env` 파일 확인 및 재설정

### 이미지 업로드 실패
→ Cloud Storage 버킷 권한 확인
→ 파일 크기 확인 (10MB 제한)

### Gemini API 오류
→ API 키 유효성 확인
→ 쿼터 초과 여부 확인

## 📄 라이선스

MIT License - 교육 목적으로 자유롭게 사용 가능

## 👨‍💼 기여

버그 보고 및 기능 제안은 이슈로 등록해주세요.

---

**Last Updated:** 2025-10-27
**Status:** MVP 완성 ✅
**Next Review:** 대시보드 개발 단계
