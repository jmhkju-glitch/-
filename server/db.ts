import { and, desc, eq, ilike, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Category,
  Comment,
  InsertComment,
  InsertPost,
  InsertUser,
  Post,
  Tag,
  categories,
  comments,
  postTags,
  posts,
  tags,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(categories.id);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

// ─── Tags ─────────────────────────────────────────────────────────────────────
export async function getAllTags(): Promise<Tag[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tags).orderBy(tags.name);
}

export async function getOrCreateTag(name: string): Promise<Tag> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const slug = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "");
  const existing = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(tags).values({ name, slug }).onDuplicateKeyUpdate({ set: { name } });
  const created = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return created[0]!;
}

// ─── Posts ────────────────────────────────────────────────────────────────────
export interface PostListItem extends Post {
  categoryName?: string | null;
  categorySlug?: string | null;
  categoryColor?: string | null;
  tagList?: { id: number; name: string; slug: string }[];
}

export interface PostListResult {
  posts: PostListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getPostList(params: {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
  published?: boolean;
}): Promise<PostListResult> {
  const db = await getDb();
  if (!db) return { posts: [], total: 0, page: 1, pageSize: 10, totalPages: 0 };

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (params.published !== undefined) {
    conditions.push(eq(posts.published, params.published));
  }
  if (params.categorySlug) {
    const cat = await getCategoryBySlug(params.categorySlug);
    if (cat) conditions.push(eq(posts.categoryId, cat.id));
  }
  if (params.search) {
    conditions.push(
      or(
        like(posts.title, `%${params.search}%`),
        like(posts.content, `%${params.search}%`)
      )
    );
  }

  let postIds: number[] | null = null;
  if (params.tagSlug) {
    const tag = await db.select().from(tags).where(eq(tags.slug, params.tagSlug)).limit(1);
    if (tag[0]) {
      const tagPosts = await db
        .select({ postId: postTags.postId })
        .from(postTags)
        .where(eq(postTags.tagId, tag[0].id));
      postIds = tagPosts.map((r) => r.postId);
      if (postIds.length === 0) {
        return { posts: [], total: 0, page, pageSize, totalPages: 0 };
      }
      conditions.push(inArray(posts.id, postIds));
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [countResult, postRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(where),
    db
      .select({
        post: posts,
        categoryName: categories.name,
        categorySlug: categories.slug,
        categoryColor: categories.color,
      })
      .from(posts)
      .leftJoin(categories, eq(posts.categoryId, categories.id))
      .where(where)
      .orderBy(desc(posts.createdAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  const totalPages = Math.ceil(total / pageSize);

  // Fetch tags for each post
  const postIdList = postRows.map((r) => r.post.id);
  let tagMap: Record<number, { id: number; name: string; slug: string }[]> = {};
  if (postIdList.length > 0) {
    const tagRows = await db
      .select({ postId: postTags.postId, tagId: tags.id, tagName: tags.name, tagSlug: tags.slug })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(inArray(postTags.postId, postIdList));
    for (const row of tagRows) {
      if (!tagMap[row.postId]) tagMap[row.postId] = [];
      tagMap[row.postId].push({ id: row.tagId, name: row.tagName, slug: row.tagSlug });
    }
  }

  const result: PostListItem[] = postRows.map((r) => ({
    ...r.post,
    categoryName: r.categoryName,
    categorySlug: r.categorySlug,
    categoryColor: r.categoryColor,
    tagList: tagMap[r.post.id] ?? [],
  }));

  return { posts: result, total, page, pageSize, totalPages };
}

export async function getPostBySlug(slug: string): Promise<PostListItem | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      post: posts,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryColor: categories.color,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.slug, slug))
    .limit(1);
  if (!result[0]) return undefined;

  const tagRows = await db
    .select({ tagId: tags.id, tagName: tags.name, tagSlug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, result[0].post.id));

  return {
    ...result[0].post,
    categoryName: result[0].categoryName,
    categorySlug: result[0].categorySlug,
    categoryColor: result[0].categoryColor,
    tagList: tagRows.map((r) => ({ id: r.tagId, name: r.tagName, slug: r.tagSlug })),
  };
}

export async function getPostById(id: number): Promise<PostListItem | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      post: posts,
      categoryName: categories.name,
      categorySlug: categories.slug,
      categoryColor: categories.color,
    })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .where(eq(posts.id, id))
    .limit(1);
  if (!result[0]) return undefined;

  const tagRows = await db
    .select({ tagId: tags.id, tagName: tags.name, tagSlug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, id));

  return {
    ...result[0].post,
    categoryName: result[0].categoryName,
    categorySlug: result[0].categorySlug,
    categoryColor: result[0].categoryColor,
    tagList: tagRows.map((r) => ({ id: r.tagId, name: r.tagName, slug: r.tagSlug })),
  };
}

export async function createPost(
  data: Omit<InsertPost, "id" | "createdAt" | "updatedAt" | "viewCount">,
  tagNames: string[]
): Promise<Post> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(posts).values({ ...data, viewCount: 0 });
  const created = await db.select().from(posts).where(eq(posts.slug, data.slug)).limit(1);
  const post = created[0]!;
  if (tagNames.length > 0) {
    const tagObjs = await Promise.all(tagNames.map(getOrCreateTag));
    await db.insert(postTags).values(tagObjs.map((t) => ({ postId: post.id, tagId: t.id })));
  }
  return post;
}

export async function updatePost(
  id: number,
  data: Partial<Omit<InsertPost, "id" | "createdAt" | "updatedAt">>,
  tagNames?: string[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(posts).set(data).where(eq(posts.id, id));
  if (tagNames !== undefined) {
    await db.delete(postTags).where(eq(postTags.postId, id));
    if (tagNames.length > 0) {
      const tagObjs = await Promise.all(tagNames.map(getOrCreateTag));
      await db.insert(postTags).values(tagObjs.map((t) => ({ postId: id, tagId: t.id })));
    }
  }
}

export async function deletePost(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(postTags).where(eq(postTags.postId, id));
  await db.delete(comments).where(eq(comments.postId, id));
  await db.delete(posts).where(eq(posts.id, id));
}

export async function incrementViewCount(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(posts).set({ viewCount: sql`${posts.viewCount} + 1` }).where(eq(posts.id, id));
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export async function getCommentsByPostId(postId: number): Promise<Comment[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));
}

export async function createComment(data: InsertComment): Promise<Comment> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(comments).values(data);
  const result = await db
    .select()
    .from(comments)
    .where(eq(comments.postId, data.postId))
    .orderBy(desc(comments.createdAt))
    .limit(1);
  return result[0]!;
}

export async function deleteComment(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(comments).where(eq(comments.id, id));
}
