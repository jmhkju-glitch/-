# 환경 변수 설정 가이드

배포 시 다음 환경 변수를 설정해야 합니다.

## 필수 환경 변수

### 데이터베이스
```
DATABASE_URL=mysql://username:password@host:port/database_name
```
예시: `mysql://root:password123@db.example.com:3306/investment_blog`

### JWT 비밀키
```
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
```
생성 방법:
```bash
openssl rand -base64 32
```

### OAuth 설정
```
VITE_APP_ID=your-oauth-application-id
OAUTH_SERVER_URL=https://oauth-server.example.com
VITE_OAUTH_PORTAL_URL=https://oauth-portal.example.com
```

### 소유자 정보
```
OWNER_OPEN_ID=your-unique-owner-id
OWNER_NAME=Your Full Name
```

---

## 선택 환경 변수

### 분석 (Analytics)
```
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

### API 키
```
VITE_FRONTEND_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.example.com
BUILT_IN_FORGE_API_KEY=your-built-in-api-key
BUILT_IN_FORGE_API_URL=https://built-in-api.example.com
```

---

## Vercel에서 설정하기

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. 프로젝트 선택 → **Settings**
3. **Environment Variables** 섹션으로 이동
4. 각 변수를 추가:
   - **Key**: 변수명 (예: `DATABASE_URL`)
   - **Value**: 변수값
   - **Environments**: `Production`, `Preview`, `Development` 선택

5. **Save** 클릭

---

## Netlify에서 설정하기

1. [Netlify 대시보드](https://app.netlify.com)에 로그인
2. 사이트 선택 → **Site settings**
3. **Build & deploy** → **Environment** 섹션
4. **Edit variables** 클릭
5. 각 변수 추가:
   - **Key**: 변수명
   - **Value**: 변수값

6. **Save** 클릭

---

## Docker 배포에서 설정하기

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@db:3306/blog" \
  -e JWT_SECRET="your-secret-key" \
  -e VITE_APP_ID="app-id" \
  -e OAUTH_SERVER_URL="https://oauth.example.com" \
  -e VITE_OAUTH_PORTAL_URL="https://portal.example.com" \
  -e OWNER_OPEN_ID="owner-id" \
  -e OWNER_NAME="Owner Name" \
  investment-blog
```

또는 `.env` 파일 사용:
```bash
docker run -p 3000:3000 --env-file .env investment-blog
```

---

## 로컬 개발에서 설정하기

프로젝트 루트에 `.env.local` 파일 생성:

```
DATABASE_URL=mysql://root:password@localhost:3306/investment_blog
JWT_SECRET=dev-secret-key-for-local-development
VITE_APP_ID=dev-app-id
OAUTH_SERVER_URL=http://localhost:5000
VITE_OAUTH_PORTAL_URL=http://localhost:5001
OWNER_OPEN_ID=dev-owner-id
OWNER_NAME=Developer
```

그 후:
```bash
pnpm dev
```

---

## 보안 주의사항

⚠️ **중요:**
- `JWT_SECRET`은 절대 공개하지 마세요
- `.env` 파일을 Git에 커밋하지 마세요
- 프로덕션 환경에서는 강력한 비밀키를 사용하세요
- 데이터베이스 비밀번호는 최소 16자 이상으로 설정하세요
- OAuth 서버 URL은 HTTPS를 사용해야 합니다

---

## 배포 후 확인

배포 완료 후 다음을 확인하세요:

1. **사이트 접속**: 홈 페이지가 정상 로드되는지 확인
2. **카테고리 표시**: 주식, 거시경제, ETF/펀드, 투자전략 4개 표시
3. **글 작성**: 로그인 후 글 작성 가능 여부 확인
4. **AI 기능**: AI 인사이트 토글 동작 확인
5. **시장 데이터**: TradingView 위젯 로드 확인

---

## 문제 해결

### "Database connection failed" 오류
- `DATABASE_URL` 형식 확인
- 데이터베이스 서버가 실행 중인지 확인
- 방화벽에서 포트 3306 (MySQL) 열려 있는지 확인

### "Invalid JWT" 오류
- `JWT_SECRET` 설정 확인
- 로컬과 배포 환경의 `JWT_SECRET`이 다르지 않은지 확인

### OAuth 로그인 실패
- `VITE_APP_ID` 정확성 확인
- `OAUTH_SERVER_URL` 접근 가능 여부 확인
- OAuth 서버에 콜백 URL 등록 확인
