import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Eye,
  Clock,
  Tag,
  MessageCircle,
  Send,
  Pencil,
  Trash2,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn, formatDate, formatRelativeTime, getCategoryStyle } from "@/lib/utils";
import { useIsOwner } from "@/hooks/useIsOwner";

// ─── Comment Form ─────────────────────────────────────────────────────────────
function CommentForm({ postId, onSuccess }: { postId: number; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const utils = trpc.useUtils();

  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      setName("");
      setContent("");
      utils.comments.list.invalidate({ postId });
      onSuccess();
      toast.success("댓글이 등록되었습니다.");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      toast.error("이름과 내용을 모두 입력해주세요.");
      return;
    }
    createComment.mutate({ postId, authorName: name.trim(), content: content.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="이름 (닉네임)"
        maxLength={64}
        className="rounded-xl"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="댓글을 작성해주세요... (투자 관련 의견, 질문 환영)"
        rows={3}
        maxLength={2000}
        className="rounded-xl resize-none"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={createComment.isPending} className="btn-press gap-1.5">
          <Send className="w-3.5 h-3.5" />
          {createComment.isPending ? "등록 중..." : "댓글 등록"}
        </Button>
      </div>
    </form>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────
function CommentItem({ comment, isOwner }: { comment: any; isOwner: boolean }) {
  const utils = trpc.useUtils();
  const deleteComment = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.list.invalidate({ postId: comment.postId });
      toast.success("댓글이 삭제되었습니다.");
    },
  });

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
        {comment.authorName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="font-semibold text-sm">{comment.authorName}</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.createdAt)}</span>
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>댓글 삭제</AlertDialogTitle>
                    <AlertDialogDescription>이 댓글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteComment.mutate({ id: comment.id })}>삭제</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}

// ─── Post Detail Page ─────────────────────────────────────────────────────────
export default function PostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const isOwner = useIsOwner();
  const [aiExpanded, setAiExpanded] = useState(false);
  const utils = trpc.useUtils();

  const { data: post, isLoading, error } = trpc.posts.bySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );

  const { data: commentsData } = trpc.comments.list.useQuery(
    { postId: post?.id ?? 0 },
    { enabled: !!post?.id }
  );

  const deletePost = trpc.posts.delete.useMutation({
    onSuccess: () => {
      toast.success("글이 삭제되었습니다.");
      navigate("/posts");
    },
    onError: (e) => toast.error(e.message),
  });

  const catStyle = getCategoryStyle(post?.categorySlug);

  if (isLoading) {
    return (
      <div className="py-12">
        <div className="container max-w-4xl">
          <Skeleton className="h-4 w-24 mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-48 mb-12" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-24 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="font-bold text-xl mb-2">글을 찾을 수 없습니다</h2>
        <p className="text-muted-foreground text-sm mb-6">삭제되었거나 존재하지 않는 글입니다.</p>
        <Link href="/posts">
          <Button variant="outline" className="btn-press">글 목록으로</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container max-w-4xl">
        {/* Back */}
        <Link href="/posts">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            글 목록으로
          </button>
        </Link>

        {/* Article */}
        <article>
          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {post.categoryName && (
                <span className={cn("inline-flex text-xs font-semibold px-2.5 py-1 rounded-full", catStyle.bg, catStyle.text)}>
                  {post.categoryName}
                </span>
              )}
              {!post.published && (
                <span className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700">
                  임시저장
                </span>
              )}
            </div>

            <h1 className="font-black mb-4 leading-tight">{post.title}</h1>

            {post.summary && (
              <p className="text-lg text-muted-foreground font-light leading-relaxed mb-6 border-l-4 border-blue-200 pl-4">
                {post.summary}
              </p>
            )}

            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {formatDate(post.createdAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  {post.viewCount.toLocaleString()} 조회
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  {commentsData?.length ?? 0} 댓글
                </span>
              </div>

              {/* Owner actions */}
              {isOwner && (
                <div className="flex items-center gap-2">
                  <Link href={`/edit/${post.id}`}>
                    <Button size="sm" variant="outline" className="btn-press gap-1.5">
                      <Pencil className="w-3.5 h-3.5" /> 수정
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="outline" className="btn-press gap-1.5 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" /> 삭제
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>글 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{post.title}" 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며 모든 댓글도 함께 삭제됩니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePost.mutate({ id: post.id })}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Tags */}
            {post.tagList && post.tagList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {post.tagList.map((tag: any) => (
                  <Link key={tag.id} href={`/posts?tag=${tag.slug}`}>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-full border border-gray-100 cursor-pointer transition-colors">
                      <Tag className="w-3 h-3" />#{tag.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </header>

          {/* AI Insight Panel */}
          {post.aiInsight && (
            <div className="mb-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100 overflow-hidden">
              <button
                onClick={() => setAiExpanded(!aiExpanded)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-blue-900">AI 투자 인사이트</div>
                    <div className="text-xs text-blue-600">AI가 분석한 핵심 내용</div>
                  </div>
                </div>
                {aiExpanded ? (
                  <ChevronUp className="w-4 h-4 text-blue-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-blue-400" />
                )}
              </button>
              {aiExpanded && (
                <div className="px-4 pb-4">
                  <div className="prose-blog text-sm text-blue-900">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.aiInsight}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="prose-blog">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>
        </article>

        {/* Divider */}
        <div className="my-16 border-t border-gray-100" />

        {/* Comments Section */}
        <section>
          <h2 className="font-black text-2xl mb-8 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            댓글 <span className="text-muted-foreground font-normal text-lg">({commentsData?.length ?? 0})</span>
          </h2>

          {/* Comment form */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-8">
            <h3 className="font-semibold text-sm mb-4 text-muted-foreground">댓글 작성 (로그인 불필요)</h3>
            <CommentForm postId={post.id} onSuccess={() => {}} />
          </div>

          {/* Comment list */}
          {commentsData && commentsData.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 px-6 divide-y divide-gray-50">
              {commentsData.map((comment) => (
                <CommentItem key={comment.id} comment={comment} isOwner={isAuthenticated} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              첫 번째 댓글을 남겨보세요.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
