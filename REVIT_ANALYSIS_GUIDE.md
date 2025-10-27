# 🔍 Revit 파일 분석 & 에러 핸들링 가이드

**CivilFo의 고급 분석 및 에러 처리 기능 완벽 가이드**

---

## 📊 Revit 파일 분석 기능

### 개요

Revit 파일(.rvt)은 **OLE(Object Linking and Embedding)** 형식으로, 복잡한 바이너리 구조를 가집니다. CivilFo는 다음을 분석합니다:

- ✅ **파일 형식 검증** - OLE 서명 확인
- ✅ **메타데이터 추출** - 압축 상태, 포함 객체 등
- ✅ **구조 분석** - 섹터 구성, FAT 정보
- ✅ **품질 평가** - 파일 크기, 복잡도, 위험도
- ✅ **성능 추정** - 요소 수, 뷰 개수 예측

### 1️⃣ 파일 형식 검증

#### OLE 서명
```
Magic Number: D0 CF 11 E0 A1 B1 1A E1
Format: Valid OLE/RVT
```

#### 지원 형식
```
✅ .rvt  - Revit 프로젝트 (메인)
✅ .rfa  - Revit Family
✅ .adt  - Archive
```

#### 오류 감지
```
❌ .zip  - ZIP 형식 (Revit 2013 이상 가능)
❌ .pdf  - PDF 형식
❌ .ifc  - IFC 형식
❌ Unknown - 알 수 없는 형식
```

### 2️⃣ 메타데이터 분석

#### 감지 정보
```json
{
  "detected": {
    "hasEmbeddedObjects": true,
    "isCompressed": true,
    "isEncrypted": false
  }
}
```

#### 복잡도 추정 (파일 크기 기준)

| 파일 크기 | 복잡도 | 요소 수 추정 | 뷰 개수 |
|----------|--------|-----------|--------|
| < 100 KB | Very Simple | 100-300 | 1-3 |
| 100-500 KB | Simple | 300-1500 | 3-8 |
| 500 KB-2 MB | Moderate | 1500-7500 | 8-30 |
| 2-5 MB | Complex | 7500-20000 | 30-70 |
| 5-10 MB | Very Complex | 20000-50000 | 70-150 |
| > 10 MB | Extremely Complex | 50000+ | 150+ |

### 3️⃣ 파일 구조 분석

#### OLE 구조

```
[0-512 bytes]      → OLE Header
[512-2048 bytes]   → FAT (File Allocation Table)
[2048-3072 bytes]  → Directory Entries
[3072+ bytes]      → Document Content
```

#### 분석 데이터

```json
{
  "sections": [
    {
      "name": "OLE Header",
      "offset": 0,
      "size": 512,
      "description": "File header and allocation tables"
    },
    {
      "name": "Document Content",
      "offset": 3072,
      "description": "Revit project data streams"
    }
  ],
  "composition": {
    "totalSectors": 1024,
    "averageSectorSize": "512.00",
    "estimated_data_density": "95.5%"
  }
}
```

### 4️⃣ 품질 평가

#### 점수 계산 (0-100)

```javascript
let score = 100;

// 파일 크기 체크
if (sizeMB > 1000) score -= 20;    // > 1GB
else if (sizeMB > 500) score -= 10; // > 500MB

// 파일 크기 이상 체크
if (sizeKB < 100) score -= 15;     // 너무 작음

// 파일 확장자 검증
if (!validExtension) score -= 5;   // 잘못된 확장자
```

#### 추천사항 (자동 생성)

```
✅ File appears to be in good condition (점수 100)
💾 Consider removing unused content (크기 > 200MB)
🧹 Use Revit's "Audit" tool to clean up
⚡ Split model into linked files (크기 > 500MB)
📊 Run Model Derivative analysis
```

### 5️⃣ 사용 예시

#### 단독 분석 (변환 없이)

```bash
POST /analyze
Content-Type: multipart/form-data

Form Fields:
- images: File[] (1-3 Revit 파일)
```

**응답:**
```json
{
  "ok": true,
  "analyses": [
    {
      "summary": {
        "fileName": "project.rvt",
        "status": "✅ Valid",
        "fileSize": "125.45 MB",
        "format": "OLE/RVT",
        "timestamp": "2024-10-27T12:00:00Z"
      },
      "metadata": {
        "detected": {
          "hasEmbeddedObjects": true,
          "isCompressed": false,
          "isEncrypted": false
        },
        "estimates": {
          "sizeKB": "128460.00",
          "estimatedComplexity": "Complex",
          "estimatedElements": {
            "estimate": 18000,
            "range": "14400 - 21600"
          },
          "estimatedViews": {
            "estimate": 45,
            "note": "Includes floor plans, elevations, sections, perspectives"
          }
        }
      },
      "quality": {
        "score": 85,
        "issues": ["Large file (500MB+) - Consider optimizing"],
        "recommendations": [
          "💾 Consider removing unused content",
          "🧹 Use Revit's Audit tool",
          "⚡ Split model into linked files",
          "📊 Run Model Derivative analysis"
        ]
      }
    }
  ],
  "timestamp": "2024-10-27T12:00:00Z"
}
```

#### 변환 시 분석 포함

```bash
POST /convert
응답에 "analyses" 배열 포함
```

---

## 🛡️ 에러 핸들링 시스템

### 개요

CivilFo의 에러 핸들링은:
- ✅ **일관된 형식** - 모든 에러가 같은 구조
- ✅ **상세한 정보** - 에러 코드, 메시지, 컨텍스트
- ✅ **추적 가능** - Request ID로 추적
- ✅ **디버깅 친화** - 개발/프로덕션 모드

### 1️⃣ 에러 응답 형식

```json
{
  "ok": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum allowed (100MB)",
    "statusCode": 413,
    "details": {
      "maxSize": "100MB",
      "receivedSize": "250MB"
    },
    "timestamp": "2024-10-27T12:00:00Z",
    "requestId": "1730000000000-abc123xyz"
  }
}
```

### 2️⃣ 에러 코드 분류

#### 파일 에러 (400-413)
```
FILE_NOT_FOUND       - 파일 없음
FILE_TOO_LARGE       - 파일 크기 초과 (100MB)
INVALID_FILE_FORMAT  - 지원되지 않는 형식
FILE_UPLOAD_ERROR    - 업로드 실패
```

#### 검증 에러 (400)
```
INVALID_REQUEST      - 잘못된 요청
MISSING_FIELD        - 필수 필드 누락
INVALID_JSON         - 잘못된 JSON
```

#### 작업 에러 (404-500)
```
JOB_NOT_FOUND        - 작업 없음
JOB_FAILED           - 작업 실패
JOB_TIMEOUT          - 작업 시간 초과
```

#### API 에러 (502-503)
```
API_ERROR            - 외부 API 오류
API_TIMEOUT          - API 시간 초과
API_RATE_LIMIT       - API 요청 제한
SERVICE_UNAVAILABLE  - 서비스 불가
```

### 3️⃣ HTTP 상태 코드

| 상태 | 의미 | 예시 |
|-----|------|------|
| 200 | OK | 성공적인 요청 |
| 202 | Accepted | 작업 진행 중 |
| 400 | Bad Request | 잘못된 입력 |
| 404 | Not Found | 리소스 없음 |
| 408 | Request Timeout | 요청 시간 초과 |
| 413 | Payload Too Large | 파일 크기 초과 |
| 429 | Too Many Requests | API 요청 제한 |
| 500 | Internal Error | 서버 오류 |
| 503 | Unavailable | 서비스 불가 |

### 4️⃣ Multer 에러 처리

#### 파일 크기 초과
```
CODE: FILE_TOO_LARGE
MESSAGE: File size exceeds maximum allowed (100MB)
STATUS: 413 Payload Too Large
```

#### 파일 개수 초과
```
CODE: FILE_UPLOAD_ERROR
MESSAGE: Too many files. Maximum is 3 files
STATUS: 400 Bad Request
```

#### 잘못된 필드명
```
CODE: FILE_UPLOAD_ERROR
MESSAGE: Unexpected field
STATUS: 400 Bad Request
```

### 5️⃣ 외부 API 에러 처리

#### Autodesk API 에러
```
Status 401: Invalid credentials
→ ERROR: UNAUTHORIZED

Status 429: Rate limit exceeded
→ ERROR: API_RATE_LIMIT

Status 504: Gateway timeout
→ ERROR: API_TIMEOUT
```

#### Gemini API 에러
```
Status 400: Invalid model
→ ERROR: API_ERROR

Status 429: Quota exceeded
→ ERROR: API_RATE_LIMIT

Status 503: Service unavailable
→ ERROR: SERVICE_UNAVAILABLE
```

### 6️⃣ 로깅 시스템

#### 로그 레벨

```
[INFO]   - 일반 정보 (요청 수신, 작업 시작)
[WARN]   - 경고 (느린 요청, 파일 크기 경고)
[ERROR]  - 오류 (예외, 실패)
[DEBUG]  - 디버그 (DEBUG=true 설정 시에만)
```

#### 로그 형식

```
[2024-10-27T12:00:00Z] [INFO] [CATEGORY] message
{
  "requestId": "1730000000000-abc123",
  "context": "additional data"
}
```

#### 예시

```
[2024-10-27T12:00:00Z] [INFO] [CONVERT] Upload & submit request
{
  "studentId": "20201234",
  "courseCode": "CE301",
  "filesCount": 1,
  "requestId": "1730000000000-xyz"
}

[2024-10-27T12:00:02Z] [ERROR] [CONVERT] File upload failed
  Error: ECONNREFUSED
  Stack: at OSS.upload (autodesk.js:45:12)
```

### 7️⃣ Request 추적

#### Request ID
```
생성 소스 (우선순위):
1. X-Request-ID 헤더
2. X-Correlation-ID 헤더
3. 자동 생성: {timestamp}-{randomId}

예: 1730000000000-abc123xyz
```

#### 모든 응답에 포함
```json
{
  "error": {
    "requestId": "1730000000000-abc123xyz"
  }
}
```

### 8️⃣ 성능 모니터링

#### 느린 요청 감지
```
요청 시간 > 5000ms → WARN 로그

예:
[WARN] [PERFORMANCE] Slow request: POST /convert took 5234ms
```

#### 엔드포인트별 시간
```
GET /health              ~ 100ms
POST /analyze            ~ 500ms
POST /convert            ~ 1000ms (+ Autodesk 처리)
GET /convert/:jobId      ~ 300ms
```

---

## 🔧 에러 처리 구현

### 에러 생성하기

```javascript
// 기본 에러
throw new AppError(
  'File not found',
  'FILE_NOT_FOUND',
  404,
  { filePath: '/path/to/file' }
);

// 팩토리 함수 사용 (추천)
throw Errors.FileTooLarge('File exceeds 100MB limit', { 
  size: '250MB' 
});
```

### 에러 캐칭 (자동)

```javascript
// asyncHandler로 모든 에러 자동 처리
app.post('/api', asyncHandler(async (req, res) => {
  // 에러 발생 시 errorHandler로 전달됨
  const result = await someOperation();
}));
```

### 검증하기

```javascript
// 자동 검증
validateRequest(['studentId', 'courseCode'], req.body);
// 누락된 필드 있으면 자동 에러 발생
```

---

## 📈 성능 최적화 팁

### 파일 크기

```
✅ < 100 MB        - 최적
⚠️  100-300 MB     - 양호 (다소 느림)
⚠️  300-500 MB     - 주의 필요
❌ > 500 MB        - 분할 권장
```

### 변환 시간

```
소규모 파일   (< 50 MB)  → 30-60초
중규모 파일   (50-200 MB) → 1-3분
대규모 파일   (> 200 MB)  → 3-10분
```

### 추천사항

1. **파일 정리**
   ```
   Revit → Manage → Audit
   불필요한 객체 제거
   ```

2. **모델 분할**
   ```
   > 500MB 파일은 Linked Files로 분할
   ```

3. **캐싱**
   ```
   같은 파일 반복 분석 시 결과 캐시
   ```

---

## 📚 API 문서

### Revit 분석

```bash
POST /analyze
Content-Type: multipart/form-data

Input:
- images: File[] (1-3 RVT files, max 100MB each)

Output: { ok, analyses[], timestamp }
```

### 에러 응답

모든 에러는 다음 형식:
```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "statusCode": 400,
    "details": { /* additional context */ },
    "timestamp": "ISO8601",
    "requestId": "correlation-id"
  }
}
```

---

## 🎯 다음 단계

1. **프로덕션 배포**
   - CORS 설정 확인
   - 에러 로깅 모니터링

2. **고급 분석**
   - RVT 라이브러리 통합 (선택)
   - 커스텀 품질 지표 추가

3. **모니터링**
   - API 응답 시간 추적
   - 에러율 모니터링
   - Request ID로 추적

---

**완벽한 에러 처리와 분석 시스템이 준비되었습니다!** 🎉
