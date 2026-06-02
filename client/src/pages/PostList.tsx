import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import {
  Search,
  SlidersHorizontal,
  TrendingUp,
  Eye,
  Clock,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  PenLine,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, truncate, stripMarkdown, getCategoryStyle } from "@/lib/utils";

function PostCard({ post }: { post: any }) {
  const catStyle = getCategoryStyle(post.categorySlug);
  const summary = post.summary
    ? truncate(post.summary, 130)
    : truncate(stripMarkdown(post.content), 130);

  return (
    <Link href={`/posts/${post.slug}`}>
      <article className="bg-white rounded-2xl p-6 card-hover cursor-pointer border border-gray-100 group h-full flex flex-col">
        {post.categoryName && (
          <div className="mb-3">
            <span className={cn("inline-flex text-xs font-semibold px-2.5 py-1 rounded-full", catStyle.bg, catStyle.text)}>
              {post.categoryName}
            </span>
          </div>
        )}
        <h3 className="font-bold text-lg leading-snug mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 flex-none">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3 flex-1">
          {summary}
        </p>
        {post.tagList?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tagList.slice(0, 4).map((tag: any) => (
              <span key={tag.id} className="text-xs text-muted-foreground bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                #{tag.name}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(post.createdAt)}</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount.toLocaleString()}</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150" />
        </div>
      </article>
    </Link>
  );
}

export default function PostList() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");
  const [categorySlug, setCategorySlug] = useState(params.get("category") ?? "");
  const [tagSlug, setTagSlug] = useState(params.get("tag") ?? "");

  const { isAuthenticated } = useAuth();
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();

  const { data, isLoading } = trpc.posts.list.useQuery({
    page,
    pageSize: 9,
    categorySlug: categorySlug || undefined,
    tagSlug: tagSlug || undefined,
    search: search || undefined,
  });

  // Sync URL params on mount
  useEffect(() => {
    const cat = params.get("category") ?? "";
    const tag = params.get("tag") ?? "";
    const q = params.get("search") ?? "";
    setCategorySlug(cat);
    setTagSlug(tag);
    setSearch(q);
    setSearchInput(q);
    setPage(1);
  }, [searchStr]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const clearFilters = () => {
    setCategorySlug("");
    setTagSlug("");
    setSearch("");
    setSearchInput("");
    setPage(1);
    navigate("/posts");
  };

  const hasFilters = categorySlug || tagSlug || search;
  const activeCategory = categories?.find((c) => c.slug === categorySlug);
  const activeTag = tags?.find((t) => t.slug === tagSlug);

  return (
    <div className="py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">블로그</p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="font-black">
              {activeCategory ? activeCategory.name : activeTag ? `#${activeTag.name}` : "전체 글"}
            </h1>
            {isAuthenticated && (
              <Link href="/write">
                <Button className="btn-press flex items-center gap-1.5 flex-shrink-0">
                  <PenLine className="w-3.5 h-3.5" /> 글쓰기
                </Button>
              </Link>
            )}
          </div>
          {data && (
            <p className="text-muted-foreground text-sm mt-1">
              총 <span className="font-semibold text-foreground">{data.total}</span>개의 글
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filters */}
          <aside className="lg:w-64 flex-shrink-0 space-y-6">
            {/* Search */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" /> 검색
              </h3>
              <form onSubmit={handleSearch}>
                <div className="flex gap-2">
                  <Input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="키워드 검색..."
                    className="text-sm rounded-xl"
                  />
                  <Button type="submit" size="sm" className="btn-press flex-shrink-0">
                    <Search className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> 카테고리
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => { setCategorySlug(""); setPage(1); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors",
                    !categorySlug ? "bg-foreground text-background font-semibold" : "hover:bg-gray-50 text-muted-foreground"
                  )}
                >
                  전체
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setCategorySlug(cat.slug); setPage(1); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors",
                      categorySlug === cat.slug
                        ? "bg-foreground text-background font-semibold"
                        : "hover:bg-gray-50 text-muted-foreground"
                    )}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color ?? "#ccc" }} />
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <h3 className="font-bold text-sm mb-3">태그</h3>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => { setTagSlug(tagSlug === tag.slug ? "" : tag.slug); setPage(1); }}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border transition-colors",
                        tagSlug === tag.slug
                          ? "bg-foreground text-background border-foreground"
                          : "bg-gray-50 text-muted-foreground border-gray-200 hover:border-gray-400"
                      )}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> 필터 초기화
              </button>
            )}
          </aside>

          {/* Post grid */}
          <div className="flex-1 min-w-0">
            {/* Active filters */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-6">
                {activeCategory && (
                  <span className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 py-1.5 rounded-full font-medium">
                    {activeCategory.name}
                    <button onClick={() => setCategorySlug("")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {activeTag && (
                  <span className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 py-1.5 rounded-full font-medium">
                    #{activeTag.name}
                    <button onClick={() => setTagSlug("")}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {search && (
                  <span className="flex items-center gap-1.5 text-xs bg-foreground text-background px-3 py-1.5 rounded-full font-medium">
                    "{search}"
                    <button onClick={() => { setSearch(""); setSearchInput(""); }}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 space-y-3">
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            ) : data?.posts.length === 0 ? (
              <div className="text-center py-24">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">글이 없습니다</h3>
                <p className="text-muted-foreground text-sm">
                  {hasFilters ? "다른 필터를 시도해보세요." : "아직 작성된 글이 없습니다."}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {data?.posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination */}
                {data && data.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn-press"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={p === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(p)}
                        className={cn("btn-press w-9", p === page && "font-bold")}
                      >
                        {p}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                      className="btn-press"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
