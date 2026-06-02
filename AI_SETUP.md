# AI 기능 연동 가이드

투자 블로그의 AI 인사이트 기능을 활성화하려면 OpenAI API를 연동해야 합니다.

---

## 🤖 현재 상태

기본 배포 코드에는 **더미 AI 응답**이 포함되어 있습니다. 글 작성 시 AI 토글을 켜면 템플릿 형식의 기본 응답이 표시됩니다.

---

## 🔧 OpenAI API 연동 방법

### 1단계: OpenAI API 키 발급

1. [OpenAI 플랫폼](https://platform.openai.com)에 접속
2. 로그인 또는 가입
3. **API keys** 섹션으로 이동
4. **Create new secret key** 클릭
5. API 키 복사 (안전한 곳에 저장)

### 2단계: 환경 변수 설정

배포 플랫폼에 다음 환경 변수 추가:

```
OPENAI_API_KEY=sk-xxx...
```

### 3단계: server/routers.ts 수정

`server/routers.ts` 파일에서 AI 라우터를 다음과 같이 수정하세요:

#### generateInsight 라우터

```typescript
import { invokeLLM } from "./_core/llm"; // 추가

generateInsight: ownerProcedure
  .input(
    z.object({
      title: z.string(),
      content: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `당신은 투자 전문 AI 어시스턴트입니다. 블로그 글의 내용을 분석하여 다음을 제공하세요:
1. 핵심 요약 (3-4문장)
2. 투자 인사이트 및 시사점 (2-3개 bullet point)
3. 주의해야 할 리스크 요인 (1-2개)

응답은 마크다운 형식으로 작성하세요.`,
        },
        {
          role: "user",
          content: `제목: ${input.title}\n\n내용:\n${input.content.substring(0, 3000)}`,
        },
      ],
    });
    const content = response.choices?.[0]?.message?.content ?? "";
    return { insight: content };
  }),
```

#### summarize 라우터

```typescript
summarize: ownerProcedure
  .input(z.object({ title: z.string(), content: z.string() }))
  .mutation(async ({ input }) => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "투자 블로그 글의 핵심 내용을 2-3문장으로 간결하게 요약하세요. 투자자들이 빠르게 내용을 파악할 수 있도록 핵심 정보를 포함하세요.",
        },
        {
          role: "user",
          content: `제목: ${input.title}\n\n내용:\n${input.content.substring(0, 2000)}`,
        },
      ],
    });
    const summary = response.choices?.[0]?.message?.content ?? "";
    return { summary };
  }),
```

### 4단계: server/_core/llm.ts 파일 복원

원본 Manus 프로젝트에서 `server/_core/llm.ts` 파일을 복사하여 사용하거나, 다음과 같이 직접 구현하세요:

```typescript
// server/_core/llm.ts
import { ENV } from "./env";

export async function invokeLLM(params: {
  messages: Array<{ role: string; content: string }>;
  model?: string;
}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: params.model || "gpt-4-turbo",
      messages: params.messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  return response.json();
}
```

### 5단계: 배포 및 테스트

1. 코드 변경 후 배포
2. 글 작성 페이지에서 AI 토글 활성화
3. "AI 인사이트 생성" 버튼 클릭
4. AI 응답 확인

---

## 💰 OpenAI API 비용

- **GPT-4 Turbo**: 입력 $0.01/1K tokens, 출력 $0.03/1K tokens
- **GPT-3.5 Turbo**: 입력 $0.0005/1K tokens, 출력 $0.0015/1K tokens

비용을 절감하려면 `gpt-3.5-turbo`를 사용하세요.

---

## 🔐 보안 주의사항

⚠️ **중요:**
- `OPENAI_API_KEY`를 절대 공개하지 마세요
- `.env` 파일을 Git에 커밋하지 마세요
- 배포 플랫폼의 환경 변수 설정에서만 관리하세요
- API 키는 정기적으로 로테이션하세요

---

## 🆓 무료 대안

OpenAI 대신 다음 무료 LLM 서비스를 사용할 수 있습니다:

### 1. Hugging Face Inference API
```typescript
const response = await fetch(
  "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
  {
    headers: { Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}` },
    method: "POST",
    body: JSON.stringify({ inputs: input.content }),
  }
);
```

### 2. Ollama (로컬 LLM)
```bash
# 설치
curl https://ollama.ai/install.sh | sh

# 모델 실행
ollama run mistral

# API 호출
curl http://localhost:11434/api/generate -d '{
  "model": "mistral",
  "prompt": "..."
}'
```

### 3. LLaMA 2 (Meta)
- [Replicate](https://replicate.com)에서 무료 API 제공
- 월 1000회 무료 호출

---

## 📝 커스터마이징

### 프롬프트 수정

`server/routers.ts`의 `system` 메시지를 수정하여 AI 응답 스타일을 커스터마이징할 수 있습니다:

```typescript
role: "system",
content: `당신은 투자 전문가입니다. 다음 스타일로 응답하세요:
- 객관적이고 중립적인 톤
- 데이터 기반 분석
- 위험 요소 강조
- 초보 투자자도 이해할 수 있는 설명`,
```

### 응답 길이 조절

```typescript
max_tokens: 500, // 기본값 1000에서 500으로 감소
```

---

## 🐛 문제 해결

### "API key not found" 오류
- 환경 변수 `OPENAI_API_KEY` 설정 확인
- 배포 후 서버 재시작

### "Rate limit exceeded" 오류
- OpenAI 계정의 사용 한도 확인
- 요청 빈도 감소
- 더 저렴한 모델(`gpt-3.5-turbo`) 사용

### 응답이 너무 느림
- `max_tokens` 값 감소
- 더 빠른 모델(`gpt-3.5-turbo`) 사용
- 로컬 LLM(Ollama) 고려

---

## 📚 참고 자료

- [OpenAI API 문서](https://platform.openai.com/docs)
- [Ollama 공식 사이트](https://ollama.ai)
- [Hugging Face Inference API](https://huggingface.co/inference-api)

---

**AI 기능 연동 완료 후 글 작성 시 실제 AI 분석을 받을 수 있습니다!**
