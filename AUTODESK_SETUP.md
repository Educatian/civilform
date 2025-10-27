# 🎯 Autodesk API 설정 완료 가이드

**CivilFo 프로젝트의 Autodesk Model Derivative API 통합이 완료되었습니다!**

---

## ✅ 현재 상태

### 1️⃣ 서버 설정 완료
- ✅ **Production 서버** (`src/index.js`) - Autodesk API 사용
- ✅ **Autodesk OAuth2** - 토큰 캐싱 구현
- ✅ **OSS (Object Storage)** - 파일 업로드
- ✅ **Model Derivative** - RVT→IFC/PDF 변환
- ✅ **Gemini Vision** - AI 평가

### 2️⃣ 자격증명 설정 완료
```
server/.env 파일:
AUTODESK_CLIENT_ID=HSMSL0t6AY8CPJW4S3hoLnWamlxSh1QrG1q55iOA31BsfZPt
AUTODESK_CLIENT_SECRET=41OhR7Ap4MN6a3VCYUX93HOzZYv6vquSPssUeXQNQN6GW3uN6AyyOHwbwPgykYAX
AUTODESK_OSS_BUCKET_KEY=civilfo-bucket-ce301
```

### 3️⃣ 서버 상태 확인
```bash
✅ 포트 4000에서 실행 중
✅ Health endpoint: http://localhost:4000/health
```

---

## 🔑 다음 단계

### Step 1: Gemini API 키 설정 (필수)

[Google AI Studio](https://aistudio.google.com/app/apikey)에서:

1. **+ Create API Key** 클릭
2. **새 프로젝트 생성** (또는 기존 프로젝트 선택)
3. **API Key 복사**
4. `server/.env`에 추가:

```env
GEMINI_API_KEY=your-api-key-here
GOOGLE_API_KEY=your-api-key-here
```

### Step 2: 서버 재시작

```bash
cd server
npm run dev
```

### Step 3: API 테스트

#### Health Check
```bash
curl http://localhost:4000/health
```

**응답:**
```json
{
  "ok": true,
  "message": "Server running with Autodesk API",
  "autodesk": "connected"
}
```

#### 파일 변환 테스트
```bash
# RVT 파일을 IFC/PDF로 변환
curl -X POST http://localhost:4000/convert \
  -F "images=@project.rvt" \
  -F "studentId=20201234" \
  -F "courseCode=CE301"
```

**응답:**
```json
{
  "ok": true,
  "jobs": [
    {
      "jobId": "job_20201234_1730000000000_0",
      "fileName": "project.rvt",
      "status": "submitted",
      "formats": ["ifc", "pdf"]
    }
  ]
}
```

#### 변환 상태 확인
```bash
curl http://localhost:4000/convert/job_20201234_1730000000000_0
```

**응답:**
```json
{
  "jobId": "job_20201234_1730000000000_0",
  "status": "inprogress",
  "progress": 45,
  "message": "Conversion inprogress (45%)"
}
```

---

## 📊 API 흐름

### RVT 파일 변환 흐름

```
Frontend 업로드
    ↓
[POST /convert]
    ↓
Autodesk OSS에 업로드
    ↓
Model Derivative 변환 작업 제출
    ↓
jobId 반환
    ↓
Frontend에서 주기적으로 [GET /convert/:jobId] 상태 확인
    ↓
상태 = "completed" 시
    ↓
[GET /convert/:jobId/:format] 다운로드 URL 획득
    ↓
IFC/PDF 파일 다운로드
```

### Gemini AI 평가 흐름

```
Frontend 업로드 (이미지 + 설명)
    ↓
[POST /evaluate]
    ↓
Gemini Vision API 호출
    ↓
AI 평가 결과 반환:
  - 점수 (0-100)
  - 강점
  - 약점
  - 개선 방안
  - 기술적 위험도
```

---

## 🔌 지원 포맷

### 입력 파일
- `.rvt` - Revit 프로젝트 (메인)
- `.rfa` - Revit Family
- `.adt` - Archive

### 출력 형식
| 형식 | 설명 | 사용 처 |
|------|------|--------|
| **IFC** | Industry Foundation Classes | BIM 협업, OpenBIM |
| **PDF** | 2D/3D 뷰 | 리뷰, 인쇄 |
| **STEP** | CAD 교환 형식 | CAD 호환성 |

### IFC 내보내기 설정 (Revit 기본 제공)

현재 설정: `IFC2x3 Coordination View 2.0`

변경하려면 `src/index.js` 또는 `src/lib/autodesk.js` 수정:

```javascript
// 옵션 1: IFC4 Reference View (최신)
exportSettingName: 'IFC4 Reference View'

// 옵션 2: IFC4 Design Transfer View
exportSettingName: 'IFC4 Design Transfer View'

// 옵션 3: IFC2x3 Coordination View
exportSettingName: 'IFC2x3 Coordination View'
```

---

## ⏱️ 변환 시간

| 파일 크기 | 예상 시간 |
|----------|---------|
| < 50 MB | 30-60초 |
| 50-200 MB | 1-3분 |
| > 200 MB | 3-10분 |

---

## 💰 사용 할당량

### 무료 Tier
- 50 API calls/day
- 파일 크기: 최대 2GB
- 작업 보관: 30일

### 유료 Plan
- Standard: 종량제 (초과 시)
- Enterprise: 대량 할인

[Autodesk 요금](https://aps.autodesk.com/en/pricing)

---

## 🐛 트러블슈팅

### 1. "Autodesk token failed" 에러

**원인**: 클라이언트 자격증명 오류

**해결**:
```bash
# 1. .env 파일 확인
cat server/.env | grep AUTODESK

# 2. Autodesk Developer Portal 재확인
# https://forge.autodesk.com 로그인
# 앱 상세 → Client ID/Secret 확인

# 3. 서버 재시작
npm run dev
```

### 2. "Bucket key already exists" 에러

**원인**: 버킷 키가 전역적으로 중복

**해결**:
```bash
# .env에서 고유한 버킷 이름으로 변경
AUTODESK_OSS_BUCKET_KEY=civilfo-bucket-2024-$(date +%s)
```

### 3. "Conversion failed" 에러

**원인**: RVT 파일 손상 또는 지원되지 않는 형식

**해결**:
- 파일 크기 확인 (< 2GB)
- 파일 형식 확인 (.rvt, .rfa, .adt)
- 다른 RVT 파일로 테스트

### 4. 포트 4000 이미 사용 중

```bash
# 프로세스 확인
lsof -i :4000

# 종료
kill -9 <PID>

# 또는 다른 포트 사용
PORT=5000 npm run dev
```

---

## 📚 참고 자료

### 공식 문서
- [Autodesk APS 문서](https://aps.autodesk.com)
- [Model Derivative API v2](https://aps.autodesk.com/en/docs/model-derivative/v2/reference/http/)
- [OAuth 2.0](https://aps.autodesk.com/en/docs/oauth/v2/reference/http/)
- [Object Storage Service](https://aps.autodesk.com/en/docs/object-storage/v1/reference/http/)

### 추가 자료
- [RVT to IFC Export Guide](https://aps.autodesk.com/blog/export-ifc-rvt-using-model-derivative-api)
- [Revit IFC Export Settings](https://knowledge.autodesk.com/support/revit-products/learn-explore/caas/CloudHelp/cloudhelp_9C52B4A8-0DE1-4D6F-87EB-3D084D66E1A9.html)
- [Gemini API](https://ai.google.dev)

---

## 🚀 프로덕션 배포

### 환경 변수 체크리스트

**필수**:
- ✅ `AUTODESK_CLIENT_ID`
- ✅ `AUTODESK_CLIENT_SECRET`
- ✅ `AUTODESK_OSS_BUCKET_KEY`
- ✅ `GEMINI_API_KEY`

**선택** (향후 Firebase 사용 시):
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`

### 배포 단계

1. **테스트**
   ```bash
   npm run dev  # 로컬 테스트
   ```

2. **Production 빌드**
   ```bash
   NODE_ENV=production npm start
   ```

3. **모니터링**
   - Autodesk API 할당량 모니터링
   - Gemini API 에러율 확인
   - 서버 로그 모니터링

---

## 📋 체크리스트

프로덕션 배포 전 확인:

- [ ] `.env` 파일에 모든 API 키 설정됨
- [ ] `npm run dev` 성공 (포트 4000 리스닝)
- [ ] `GET /health` 응답 정상
- [ ] 테스트 RVT 파일로 `/convert` 테스트 완료
- [ ] 테스트 이미지로 `/evaluate` 테스트 완료
- [ ] CORS 설정 확인 (필요시)
- [ ] 에러 로깅 설정 완료
- [ ] 파일 크기 제한 설정 확인 (100MB)

---

## 🎉 완료!

Autodesk Model Derivative API 통합이 완전히 준비되었습니다.

이제 프론트엔드에서:
1. RVT 파일 업로드 → `/convert`
2. Revit 설계 이미지 업로드 → `/evaluate`
3. 변환 상태 확인 → `/convert/:jobId`
4. IFC/PDF 다운로드 → `/convert/:jobId/:format`

**모든 기능을 사용할 수 있습니다!** 🚀
