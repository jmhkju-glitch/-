# 투자 블로그 배포 가이드

이 프로젝트는 **Vercel**, **Netlify**, 또는 **자체 서버**에 배포할 수 있습니다.

---

## 📋 사전 요구사항

- **Node.js** 18.x 이상
- **pnpm** 10.x 이상
- **MySQL/TiDB** 데이터베이스 (클라우드 또는 로컬)
- 환경 변수 설정 파일 (`.env`)

---

## 🚀 Vercel 배포

### 1단계: GitHub에 코드 푸시
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/investment-blog.git
git push -u origin main
```

### 2단계: Vercel 연결
1. [vercel.com](https://vercel.com)에 로그인
2. **Add New** → **Project** 클릭
3. GitHub 저장소 선택
4. **Environment Variables** 설정:
   - `DATABASE_URL`: MySQL 연결 문자열
   - `JWT_SECRET`: 임의의 긴 문자열 (예: `openssl rand -base64 32`)
   - `VITE_APP_ID`: OAuth 앱 ID
   - `OAUTH_SERVER_URL`: OAuth 서버 URL
   - `VITE_OAUTH_PORTAL_URL`: OAuth 포털 URL
   - `OWNER_OPEN_ID`: 소유자 OpenID
   - `OWNER_NAME`: 소유자 이름

5. **Deploy** 클릭

### 3단계: 데이터베이스 마이그레이션
배포 후 데이터베이스 마이그레이션 실행:
```bash
pnpm drizzle-kit migrate
```

---

## 🎨 Netlify 배포

### 1단계: Netlify 연결
1. [netlify.com](https://netlify.com)에 로그인
2. **Add new site** → **Import an existing project** 클릭
3. GitHub 저장소 선택
4. **Build command**: `pnpm build`
5. **Publish directory**: `dist/public`

### 2단계: 환경 변수 설정
**Site settings** → **Build & deploy** → **Environment** 에서 다음 변수 추가:
- `DATABASE_URL`
- `JWT_SECRET`
- `VITE_APP_ID`
- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`
- `OWNER_OPEN_ID`
- `OWNER_NAME`

### 3단계: 배포
변수 설정 후 자동으로 배포 시작

---

## 🖥️ 자체 서버 배포 (Docker)

### Dockerfile 생성
```dockerfile
FROM node:18-alpine

WORKDIR /app

# pnpm 설치
RUN npm install -g pnpm

# 의존성 설치
COPY pnpm-lock.yaml package.json ./
RUN pnpm install --frozen-lockfile

# 소스코드 복사
COPY . .

# 빌드
RUN pnpm build

# 포트 노출
EXPOSE 3000

# 실행
CMD ["node", "dist/index.js"]
```

### 배포 명령어
```bash
docker build -t investment-blog .
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host/db" \
  -e JWT_SECRET="your-secret-key" \
  -e VITE_APP_ID="your-app-id" \
  investment-blog
```

---

## 🔧 환경 변수 설정

### 필수 환경 변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `DATABASE_URL` | MySQL 연결 문자열 | `mysql://user:pass@localhost:3306/blog` |
| `JWT_SECRET` | JWT 서명 키 | `your-super-secret-key-min-32-chars` |
| `VITE_APP_ID` | OAuth 앱 ID | `your-oauth-app-id` |
| `OAUTH_SERVER_URL` | OAuth 서버 URL | `https://api.oauth.example.com` |
| `VITE_OAUTH_PORTAL_URL` | OAuth 포털 URL | `https://oauth.example.com` |
| `OWNER_OPEN_ID` | 소유자 OpenID | `user-12345` |
| `OWNER_NAME` | 소유자 이름 | `John Doe` |

---

## 📊 데이터베이스 마이그레이션

### 로컬 개발
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 프로덕션 배포 후
배포 환경에서 마이그레이션 실행:
```bash
DATABASE_URL="your-production-db-url" pnpm drizzle-kit migrate
```

---

## 🧪 배포 전 테스트

### 로컬에서 프로덕션 빌드 테스트
```bash
pnpm build
node dist/index.js
```

### 테스트 실행
```bash
pnpm test
```

---

## 📝 배포 체크리스트

- [ ] 모든 환경 변수 설정 확인
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 로컬 테스트 통과
- [ ] 빌드 오류 없음 (`pnpm build`)
- [ ] 테스트 통과 (`pnpm test`)
- [ ] 보안 헤더 설정 확인
- [ ] HTTPS 활성화 확인
- [ ] 도메인 DNS 설정 완료

---

## 🐛 배포 문제 해결

### 빌드 실패
```bash
# 캐시 삭제 후 재빌드
rm -rf node_modules dist
pnpm install
pnpm build
```

### 데이터베이스 연결 오류
- `DATABASE_URL` 형식 확인: `mysql://user:password@host:port/database`
- 데이터베이스 접근 권한 확인
- 방화벽 설정 확인

### OAuth 오류
- `VITE_APP_ID`, `OAUTH_SERVER_URL` 설정 확인
- OAuth 서버 상태 확인
- 콜백 URL이 OAuth 설정에 등록되어 있는지 확인

---

## 📞 지원

문제 발생 시:
1. 로그 확인: `pnpm build` 출력 메시지
2. 환경 변수 재확인
3. 데이터베이스 연결 테스트
4. 로컬에서 `pnpm dev`로 테스트

---

**배포 완료 후 사이트에 접속하여 모든 기능이 정상 작동하는지 확인하세요!**
