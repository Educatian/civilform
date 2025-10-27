# CivilForm Frontend

완벽한 Next.js 기반 학생용 Revit 프로젝트 평가 인터페이스입니다.

## 🎯 주요 기능

### 1️⃣ 학생 로그인 (Login Step)
- 학번(Student ID) 입력
- 과목 코드(Course Code) 선택
- 간편하고 직관적인 UI

### 2️⃣ 평가 루브릭 선택 (Rubric Step)
- **5개 평가 카테고리:**
  - 모델링 정확성 (Modeling Accuracy)
  - BIM 규격 준수 (BIM Compliance)
  - 설계 의도 (Design Intent)
  - 충돌검토 (Clash Detection)
  - 기능성 (Functionality)
- 각 카테고리별 3개씩 총 15개 평가 항목
- 체크박스로 직관적 선택
- 실시간 선택 개수 표시

### 3️⃣ 설계 자료 업로드 및 자기평가 (Upload Step)
- **이미지 업로드:**
  - 최대 3장 지원
  - 드래그 앤 드롭 또는 클릭 업로드
  - PNG, JPG, GIF 포맷 지원
  - 개별 삭제 기능
- **자기평가 작성:**
  - 최소 20자 이상 작성 필수
  - 설계 의도, 주요 특징, 기술적 구현, 어려움, 개선사항 등 자유 기술
  - 실시간 글자 수 확인

### 4️⃣ AI 평가 결과 (Results Step)
- **점수 시각화:**
  - 원형 차트로 0-100점 표시
  - 등급별 이모지: 우수(⭐), 양호(✅), 개선필요(⚠️), 미흡(❌)
- **AI 분석 결과:**
  - ✅ 강점 항목
  - 📌 개선 필요 사항
  - 🚀 개선 방안 (단계별)
  - 🔴 기술적 위험도 (저/중/높)
- **추가 기능:**
  - 결과 인쇄 지원
  - 새로운 평가 시작 버튼

## 📋 프로젝트 구조

```
frontend/
├── app/
│   ├── layout.tsx          # 루트 레이아웃
│   ├── globals.css         # 전역 CSS
│   └── page.tsx            # 메인 페이지 (4단계 조정)
├── components/
│   ├── LoginStep.tsx       # 1단계: 로그인
│   ├── RubricStep.tsx      # 2단계: 루브릭 선택
│   ├── UploadStep.tsx      # 3단계: 업로드
│   └── ResultsStep.tsx     # 4단계: 결과 표시
├── lib/
│   ├── store.ts            # Zustand 상태 관리
│   ├── api.ts              # 백엔드 API 통신
│   └── rubrics.ts          # 루브릭 정의
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

## 🚀 시작하기

### 설치

```bash
cd frontend
npm install
```

### 환경 변수 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 열기

### 프로덕션 빌드

```bash
npm run build
npm start
```

## 🔧 기술 스택

- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **Zustand** - 상태 관리
- **Axios** - HTTP 클라이언트

## 📱 UI/UX 특징

### 반응형 디자인
- 모바일, 태블릿, 데스크톱 모두 최적화
- Tailwind CSS 그리드 시스템

### 진행도 표시
- 4단계 진행 상황 시각화
- 완료한 단계는 초록색으로 표시
- 현재 단계는 파란색으로 강조

### 입력 검증
- 실시간 유효성 검사
- 필수 입력 확인
- 오류 메시지 안내

### 로딩 및 오류 처리
- 평가 진행 중 로딩 화면
- 에러 토스트 알림
- 백엔드 연결 실패 시 사용자 친화적 메시지

## 🎨 색상 체계

- **Primary:** Blue (#1e40af) - 주요 액션, 진행
- **Secondary:** Gray (#1f2937) - 텍스트, 배경
- **Accent:** Amber (#f59e0b) - 경고, 주의

## 📞 API 연동

### POST /evaluate

**요청:**
```typescript
FormData {
  studentId: string
  courseCode: string
  selfDescription: string
  checklist: JSON string
  images: File[] (0-3)
}
```

**응답:**
```typescript
{
  ok: boolean
  score: number
  strengths: string[]
  weaknesses: string[]
  aiFeedback: {
    score: number
    strengths: string[]
    weaknesses: string[]
    improvement_steps: string[]
    technical_risk: 'low' | 'medium' | 'high'
  }
  modelImages: string[]
  docId: string
}
```

## 📚 상태 관리 (Zustand Store)

```typescript
useEvaluationStore: {
  studentId: string
  courseCode: string
  selfDescription: string
  selectedRubrics: Record<string, boolean>
  uploadedImages: File[]
  evaluationResult: any
  isLoading: boolean
  error: string | null
  // + setter methods
}
```

## 🧪 테스트 체크리스트

- [ ] 로그인 페이지 : 학번 입력, 과목 선택
- [ ] 루브릭 페이지: 체크박스 선택, 카테고리별 개수 확인
- [ ] 업로드 페이지: 드래그 드롭, 파일 제거, 텍스트 입력
- [ ] 백엔드 연동: API 호출, 에러 처리
- [ ] 결과 페이지: 점수 시각화, 피드백 표시
- [ ] 반응형: 모바일, 태블릿에서 정상 작동

## 🔒 보안

- FormData를 통한 안전한 파일 전송
- 학번은 평가 목적으로만 사용
- CORS 정책 준수 (백엔드에서 설정)

## 📖 추가 리소스

- [Next.js 공식 문서](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Zustand](https://github.com/pmndrs/zustand)
