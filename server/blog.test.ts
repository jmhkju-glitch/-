import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getAllCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "주식", slug: "stocks", description: "주식 분석", color: "#6B9FD4", createdAt: new Date() },
    { id: 2, name: "부동산", slug: "real-estate", description: "부동산", color: "#8FC4A8", createdAt: new Date() },
    { id: 3, name: "암호화폐", slug: "crypto", description: "암호화폐", color: "#B8A9D9", createdAt: new Date() },
    { id: 4, name: "거시경제", slug: "macro", description: "거시경제", color: "#E8A87C", createdAt: new Date() },
  ]),
  getAllTags: vi.fn().mockResolvedValue([
    { id: 1, name: "삼성전자", slug: "samsung", createdAt: new Date() },
    { id: 2, name: "ETF", slug: "etf", createdAt: new Date() },
  ]),
  getPostList: vi.fn().mockResolvedValue({
    posts: [
      {
        id: 1,
        title: "2024 주식 시장 전망",
        slug: "2024-stock-market-outlook",
        content: "## 시장 분석\n\n2024년 주식 시장은...",
        summary: "2024년 주식 시장 전망 요약",
        aiInsight: null,
        categoryId: 1,
        categoryName: "주식",
        categorySlug: "stocks",
        categoryColor: "#6B9FD4",
        published: true,
        viewCount: 42,
        authorId: 1,
        coverImage: null,
        tagList: [{ id: 1, name: "삼성전자", slug: "samsung" }],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    total: 1,
    page: 1,
    pageSize: 9,
    totalPages: 1,
  }),
  getPostBySlug: vi.fn().mockResolvedValue({
    id: 1,
    title: "2024 주식 시장 전망",
    slug: "2024-stock-market-outlook",
    content: "## 시장 분석\n\n2024년 주식 시장은...",
    summary: "요약",
    aiInsight: null,
    categoryId: 1,
    categoryName: "주식",
    categorySlug: "stocks",
    categoryColor: "#6B9FD4",
    published: true,
    viewCount: 42,
    authorId: 1,
    coverImage: null,
    tagList: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  getPostById: vi.fn(),
  createPost: vi.fn().mockResolvedValue({
    id: 2,
    title: "새 글",
    slug: "new-post-abc123",
    content: "내용",
    summary: null,
    aiInsight: null,
    categoryId: null,
    published: false,
    viewCount: 0,
    authorId: 1,
    coverImage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  updatePost: vi.fn().mockResolvedValue(undefined),
  deletePost: vi.fn().mockResolvedValue(undefined),
  incrementViewCount: vi.fn().mockResolvedValue(undefined),
  getCommentsByPostId: vi.fn().mockResolvedValue([
    {
      id: 1,
      postId: 1,
      authorName: "방문자",
      content: "좋은 글이네요!",
      createdAt: new Date(),
    },
  ]),
  createComment: vi.fn().mockResolvedValue({
    id: 2,
    postId: 1,
    authorName: "테스터",
    content: "댓글 내용",
    createdAt: new Date(),
  }),
  deleteComment: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/env", () => ({
  ENV: {
    ownerOpenId: "owner-open-id-123",
    ownerName: "Owner",
    jwtSecret: "test-secret",
    oauthServerUrl: "https://api.manus.im",
    builtInForgeApiUrl: "https://api.manus.im",
    builtInForgeApiKey: "test-key",
  },
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "AI 인사이트 내용입니다." } }],
  }),
}));

// ─── Context helpers ──────────────────────────────────────────────────────────
function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createOwnerCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "owner-open-id-123",
      name: "Owner",
      email: "owner@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user-456",
      name: "User",
      email: "user@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("categories", () => {
  it("공개 사용자도 카테고리 목록을 조회할 수 있다", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.categories.list();
    expect(result).toHaveLength(4);
    expect(result.map((c) => c.slug)).toContain("stocks");
    expect(result.map((c) => c.slug)).toContain("real-estate");
    expect(result.map((c) => c.slug)).toContain("crypto");
    expect(result.map((c) => c.slug)).toContain("macro");
  });
});

describe("tags", () => {
  it("공개 사용자도 태그 목록을 조회할 수 있다", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.tags.list();
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("posts.list", () => {
  it("공개 사용자가 발행된 글 목록을 조회할 수 있다", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.posts.list({ page: 1, pageSize: 9, showDrafts: false });
    expect(result.posts).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.posts[0].title).toBe("2024 주식 시장 전망");
  });
});

describe("posts.bySlug", () => {
  it("발행된 글은 공개 사용자도 조회할 수 있다", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.posts.bySlug({ slug: "2024-stock-market-outlook" });
    expect(result.title).toBe("2024 주식 시장 전망");
    expect(result.published).toBe(true);
  });
});

describe("posts.create (소유자 전용)", () => {
  it("소유자는 새 글을 작성할 수 있다", async () => {
    const caller = appRouter.createCaller(createOwnerCtx());
    const result = await caller.posts.create({
      title: "새 글",
      content: "내용입니다.",
      tags: [],
      published: false,
    });
    expect(result.title).toBe("새 글");
  });

  it("일반 사용자는 글을 작성할 수 없다 (FORBIDDEN)", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(
      caller.posts.create({ title: "테스트", content: "내용", tags: [], published: false })
    ).rejects.toThrow();
  });

  it("비로그인 사용자는 글을 작성할 수 없다 (UNAUTHORIZED)", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.posts.create({ title: "테스트", content: "내용", tags: [], published: false })
    ).rejects.toThrow();
  });
});

describe("posts.update (소유자 전용)", () => {
  it("소유자는 글을 수정할 수 있다", async () => {
    const caller = appRouter.createCaller(createOwnerCtx());
    const result = await caller.posts.update({
      id: 1,
      title: "수정된 제목",
      content: "수정된 내용입니다.",
      published: true,
    });
    expect(result.success).toBe(true);
  });

  it("일반 사용자는 글을 수정할 수 없다", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(
      caller.posts.update({ id: 1, title: "수정 시도" })
    ).rejects.toThrow();
  });
});

describe("posts.delete (소유자 전용)", () => {
  it("소유자는 글을 삭제할 수 있다", async () => {
    const caller = appRouter.createCaller(createOwnerCtx());
    const result = await caller.posts.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("일반 사용자는 글을 삭제할 수 없다", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(caller.posts.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("comments", () => {
  it("공개 사용자도 댓글 목록을 조회할 수 있다", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.comments.list({ postId: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].authorName).toBe("방문자");
  });

  it("로그인 없이 댓글을 작성할 수 있다", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.comments.create({
      postId: 1,
      authorName: "테스터",
      content: "댓글 내용",
    });
    expect(result.authorName).toBe("테스터");
  });

  it("소유자는 댓글을 삭제할 수 있다", async () => {
    const caller = appRouter.createCaller(createOwnerCtx());
    const result = await caller.comments.delete({ id: 1 });
    expect(result.success).toBe(true);
  });

  it("일반 사용자는 댓글을 삭제할 수 없다", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    await expect(caller.comments.delete({ id: 1 })).rejects.toThrow();
  });
});

describe("ai.generateInsight (소유자 전용)", () => {
  it("소유자는 AI 인사이트를 생성할 수 있다", async () => {
    const caller = appRouter.createCaller(createOwnerCtx());
    const result = await caller.ai.generateInsight({
      title: "주식 시장 분석",
      content: "2024년 주식 시장은 금리 인하 기대감으로 상승세를 보이고 있습니다.",
    });
    expect(result.insight).toBeTruthy();
    expect(typeof result.insight).toBe("string");
  });

  it("비로그인 사용자는 AI 기능을 사용할 수 없다", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.ai.generateInsight({ title: "테스트", content: "내용" })
    ).rejects.toThrow();
  });
});

describe("auth.logout", () => {
  it("로그아웃 시 세션 쿠키가 삭제된다", async () => {
    const ctx = createOwnerCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
