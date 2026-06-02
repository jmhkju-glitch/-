import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getAllCategories,
  getAllTags,
  getPostList,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  incrementViewCount,
  getCommentsByPostId,
  createComment,
  deleteComment,
} from "./db";
import { ENV } from "./_core/env";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/g, "")
      .substring(0, 100) +
    "-" +
    Date.now().toString(36)
  );
}

function isOwner(openId: string): boolean {
  return openId === ENV.ownerOpenId;
}

// ─── Owner-only procedure ─────────────────────────────────────────────────────
const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isOwner(ctx.user.openId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "소유자만 접근할 수 있습니다." });
  }
  return next({ ctx });
});

// ─── Routers ──────────────────────────────────────────────────────────────────
export const appRouter = router({

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Categories ─────────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(() => getAllCategories()),
  }),

  // ─── Tags ───────────────────────────────────────────────────────────────────
  tags: router({
    list: publicProcedure.query(() => getAllTags()),
  }),

  // ─── Posts ──────────────────────────────────────────────────────────────────
  posts: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().int().min(1).default(1),
          pageSize: z.number().int().min(1).max(50).default(9),
          categorySlug: z.string().optional(),
          tagSlug: z.string().optional(),
          search: z.string().optional(),
          showDrafts: z.boolean().default(false),
        })
      )
      .query(async ({ input, ctx }) => {
        const showDrafts = input.showDrafts && ctx.user && isOwner(ctx.user.openId);
        return getPostList({
          page: input.page,
          pageSize: input.pageSize,
          categorySlug: input.categorySlug,
          tagSlug: input.tagSlug,
          search: input.search,
          published: showDrafts ? undefined : true,
        });
      }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input, ctx }) => {
        const post = await getPostBySlug(input.slug);
        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "글을 찾을 수 없습니다." });
        if (!post.published) {
          if (!ctx.user || !isOwner(ctx.user.openId)) {
            throw new TRPCError({ code: "NOT_FOUND", message: "글을 찾을 수 없습니다." });
          }
        }
        await incrementViewCount(post.id);
        return post;
      }),

    create: ownerProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          content: z.string().min(1),
          summary: z.string().optional(),
          aiInsight: z.string().optional(),
          categoryId: z.number().int().optional(),
          tags: z.array(z.string()).default([]),
          published: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const slug = generateSlug(input.title);
        const post = await createPost(
          {
            title: input.title,
            slug,
            content: input.content,
            summary: input.summary ?? null,
            aiInsight: input.aiInsight ?? null,
            categoryId: input.categoryId ?? null,
            published: input.published,
            authorId: ctx.user.id,
          },
          input.tags
        );
        return post;
      }),

    update: ownerProcedure
      .input(
        z.object({
          id: z.number().int(),
          title: z.string().min(1).max(255).optional(),
          content: z.string().min(1).optional(),
          summary: z.string().optional(),
          aiInsight: z.string().optional(),
          categoryId: z.number().int().nullable().optional(),
          tags: z.array(z.string()).optional(),
          published: z.boolean().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, tags: tagNames, ...data } = input;
        await updatePost(id, data, tagNames);
        return { success: true };
      }),

    byId: ownerProcedure
      .input(z.object({ id: z.number().int() }))
      .query(async ({ input }) => {
        const post = await getPostById(input.id);
        if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "글을 찾을 수 없습니다." });
        return post;
      }),

    delete: ownerProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(async ({ input }) => {
        await deletePost(input.id);
        return { success: true };
      }),
  }),

  // ─── Comments ────────────────────────────────────────────────────────────────
  comments: router({
    list: publicProcedure
      .input(z.object({ postId: z.number().int() }))
      .query(({ input }) => getCommentsByPostId(input.postId)),

    create: publicProcedure
      .input(
        z.object({
          postId: z.number().int(),
          authorName: z.string().min(1).max(64),
          content: z.string().min(1).max(2000),
        })
      )
      .mutation(({ input }) => createComment(input)),

    delete: ownerProcedure
      .input(z.object({ id: z.number().int() }))
      .mutation(({ input }) => deleteComment(input.id).then(() => ({ success: true }))),
  }),

  // ─── AI ──────────────────────────────────────────────────────────────────────
  ai: router({
    generateInsight: ownerProcedure
      .input(
        z.object({
          title: z.string(),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        // AI 기능을 사용하려면 OpenAI API를 연동하세요.
        // 현재는 기본 템플릿만 제공합니다.
        const insight = `## 투자 인사이트

### 핵심 요약
${input.title}에 대한 분석 내용입니다.

### 투자 포인트
- 시장 동향 분석
- 위험 요소 검토

### 주의사항
- 투자 결정 전 충분한 조사가 필요합니다.`;
        return { insight };
      })
      }),

    summarize: ownerProcedure
      .input(z.object({ title: z.string(), content: z.string() }))
      .mutation(async ({ input }) => {
        // AI 기능을 사용하려면 OpenAI API를 연동하세요.
        // 현재는 기본 요약만 제공합니다.
        const summary = `${input.title}의 핵심 내용을 요약한 내용입니다. 자세한 내용은 전체 글을 참고하세요.`;
        return { summary };
      })
      }),
  }),
});

export type AppRouter = typeof appRouter;
