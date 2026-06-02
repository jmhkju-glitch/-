import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useParams } from "wouter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Lightbulb,
  Sparkles,
  Eye,
  EyeOff,
  Save,
  Send,
  X,
  Plus,
  BarChart2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Tag,
  Info,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsOwner } from "@/hooks/useIsOwner";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// ─── Sample chart data ────────────────────────────────────────────────────────
const samplePortfolioData = [
  { month: "1월", value: 100 },
  { month: "2월", value: 108 },
  { month: "3월", value: 103 },
  { month: "4월", value: 115 },
  { month: "5월", value: 122 },
  { month: "6월", value: 118 },
  { month: "7월", value: 131 },
  { month: "8월", value: 128 },
];

const sampleSectorData = [
  { name: "기술", value: 35 },
  { name: "금융", value: 20 },
  { name: "헬스케어", value: 15 },
  { name: "소비재", value: 12 },
  { name: "에너지", value: 10 },
  { name: "기타", value: 8 },
];

// ─── Chart Widget ─────────────────────────────────────────────────────────────
function ChartWidget() {
  const [chartType, setChartType] = useState<"portfolio" | "sector">("portfolio");

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-5 border border-blue-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-bold text-blue-900">차트 위젯 미리보기</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setChartType("portfolio")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-lg transition-colors",
              chartType === "portfolio"
                ? "bg-blue-600 text-white"
                : "text-blue-600 hover:bg-blue-100"
            )}
          >
            수익률
          </button>
          <button
            onClick={() => setChartType("sector")}
            className={cn(
              "text-xs px-2.5 py-1 rounded-lg transition-colors",
              chartType === "sector"
                ? "bg-blue-600 text-white"
                : "text-blue-600 hover:bg-blue-100"
            )}
          >
            섹터
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        {chartType === "portfolio" ? (
          <AreaChart data={samplePortfolioData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="editorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "11px" }} />
            <Area type="monotone" dataKey="value" stroke="#60A5FA" strokeWidth={2} fill="url(#editorGradient)" />
          </AreaChart>
        ) : (
          <BarChart data={sampleSectorData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "8px", fontSize: "11px" }} />
            <Bar dataKey="value" fill="#A78BFA" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
      <p className="text-xs text-blue-500 mt-2 text-center">※ 샘플 데이터 - 글 내용에 맞게 활용하세요</p>
    </div>
  );
}

// ─── AI Insight Panel ─────────────────────────────────────────────────────────
function AIInsightPanel({
  title,
  content,
  onInsightGenerated,
  onSummaryGenerated,
}: {
  title: string;
  content: string;
  onInsightGenerated: (insight: string) => void;
  onSummaryGenerated: (summary: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [generatedInsight, setGeneratedInsight] = useState("");
  const [generatedSummary, setGeneratedSummary] = useState("");

  const generateInsight = trpc.ai.generateInsight.useMutation({
    onSuccess: (data) => {
      const insight = typeof data.insight === 'string' ? data.insight : '';
      setGeneratedInsight(insight);
      onInsightGenerated(insight);
      toast.success("AI 인사이트가 생성되었습니다.");
    },
    onError: (e) => toast.error("AI 인사이트 생성 실패: " + e.message),
  });

  const summarize = trpc.ai.summarize.useMutation({
    onSuccess: (data) => {
      const summary = typeof data.summary === 'string' ? data.summary : '';
      setGeneratedSummary(summary);
      onSummaryGenerated(summary);
      toast.success("AI 요약이 생성되었습니다.");
    },
    onError: (e) => toast.error("AI 요약 생성 실패: " + e.message),
  });

  const canGenerate = title.trim().length > 0 && content.trim().length > 50;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-900">AI 투자 인사이트 도우미</div>
            <div className="text-xs text-amber-600">글 내용을 분석하여 인사이트를 제안합니다</div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-amber-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-amber-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {!canGenerate && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-100 rounded-xl p-3">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              제목과 본문(50자 이상)을 작성하면 AI 기능을 사용할 수 있습니다.
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 btn-press text-xs gap-1.5 bg-white border-amber-200 text-amber-800 hover:bg-amber-50"
              disabled={!canGenerate || summarize.isPending}
              onClick={() => summarize.mutate({ title, content })}
            >
              {summarize.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Lightbulb className="w-3.5 h-3.5" />
              )}
              요약 생성
            </Button>
            <Button
              size="sm"
              className="flex-1 btn-press text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white border-0"
              disabled={!canGenerate || generateInsight.isPending}
              onClick={() => generateInsight.mutate({ title, content })}
            >
              {generateInsight.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              인사이트 분석
            </Button>
          </div>

          {generatedSummary && (
            <div className="bg-white rounded-xl p-3 border border-amber-100">
              <div className="text-xs font-semibold text-amber-700 mb-1.5">생성된 요약</div>
              <p className="text-xs text-foreground leading-relaxed">{generatedSummary}</p>
            </div>
          )}

          {generatedInsight && (
            <div className="bg-white rounded-xl p-3 border border-amber-100">
              <div className="text-xs font-semibold text-amber-700 mb-1.5">생성된 인사이트</div>
              <div className="text-xs text-foreground leading-relaxed prose-blog">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedInsight}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Post Editor Page ─────────────────────────────────────────────────────────
export default function PostEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { loading } = useAuth();
  const isOwner = useIsOwner();
  const isEdit = !!id;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [published, setPublished] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [enableAI, setEnableAI] = useState(true);

  const { data: categories } = trpc.categories.list.useQuery();
  const utils = trpc.useUtils();

  // Load existing post for edit using byId (owner-only)
  const { data: existingPost, isLoading: loadingPost } = trpc.posts.byId.useQuery(
    { id: parseInt(id ?? "0") },
    { enabled: isEdit && !!id }
  );

  useEffect(() => {
    if (isEdit && existingPost) {
      setTitle(existingPost.title);
      setContent(existingPost.content);
      setSummary(existingPost.summary ?? "");
      setAiInsight(existingPost.aiInsight ?? "");
      setCategoryId(existingPost.categoryId ?? null);
      setTags(existingPost.tagList?.map((t: any) => t.name) ?? []);
      setPublished(existingPost.published);
    }
  }, [isEdit, existingPost]);

  const createPost = trpc.posts.create.useMutation({
    onSuccess: (post) => {
      toast.success("글이 저장되었습니다!");
      utils.posts.list.invalidate();
      navigate(`/posts/${post.slug}`);
    },
    onError: (e) => toast.error("저장 실패: " + e.message),
  });

  const updatePost = trpc.posts.update.useMutation({
    onSuccess: () => {
      toast.success("글이 수정되었습니다!");
      utils.posts.list.invalidate();
      navigate("/posts");
    },
    onError: (e) => toast.error("수정 실패: " + e.message),
  });

  const handleSave = (pub: boolean) => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      toast.error("내용을 입력해주세요.");
      return;
    }

    if (isEdit) {
      updatePost.mutate({
        id: parseInt(id),
        title: title.trim(),
        content,
        summary: summary.trim() || undefined,
        aiInsight: aiInsight.trim() || undefined,
        categoryId,
        tags,
        published: pub,
      });
    } else {
      createPost.mutate({
        title: title.trim(),
        content,
        summary: summary.trim() || undefined,
        aiInsight: aiInsight.trim() || undefined,
        categoryId: categoryId ?? undefined,
        tags,
        published: pub,
      });
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t) && tags.length < 10) {
      setTags([...tags, t]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const isPending = createPost.isPending || updatePost.isPending;

  // Auth guard
  if (loading) {
    return (
      <div className="py-12 container max-w-5xl">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="py-24 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-blue-400" />
        </div>
        <h2 className="font-bold text-xl mb-2">소유자 전용 페이지</h2>
        <p className="text-muted-foreground text-sm mb-6">글 작성은 블로그 소유자만 사용할 수 있습니다.</p>
        <a href={getLoginUrl()}>
          <Button className="btn-press">소유자 로그인</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="container max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/posts">
              <button className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <h1 className="font-black text-2xl">{isEdit ? "글 수정" : "새 글 작성"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className="btn-press gap-1.5"
            >
              {previewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {previewMode ? "편집" : "미리보기"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isPending}
              className="btn-press gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              임시저장
            </Button>
            <Button
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isPending}
              className="btn-press gap-1.5"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              발행하기
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main editor */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요..."
                className="text-2xl font-black border-0 shadow-none focus-visible:ring-0 p-0 h-auto placeholder:text-gray-300"
              />
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                요약 (선택)
              </label>
              <Textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="글의 핵심 내용을 2-3문장으로 요약하세요. AI 요약 기능을 활용할 수 있습니다."
                rows={2}
                className="resize-none border-0 shadow-none focus-visible:ring-0 p-0 text-sm"
              />
            </div>

            {/* Content editor / preview */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {previewMode ? "미리보기" : "마크다운 편집"}
                </span>
                <span className="text-xs text-muted-foreground">{content.length}자</span>
              </div>

              {previewMode ? (
                <div className="p-6 min-h-[400px] prose-blog">
                  {content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">내용을 입력하면 미리보기가 표시됩니다.</p>
                  )}
                </div>
              ) : (
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`# 제목\n\n마크다운으로 투자 분석을 작성하세요...\n\n## 시장 분석\n\n**핵심 포인트:**\n- 포인트 1\n- 포인트 2\n\n> 중요한 인용구나 데이터를 여기에 넣으세요.\n\n## 투자 전략\n\n내용을 작성하세요...`}
                  className="min-h-[400px] resize-none border-0 shadow-none focus-visible:ring-0 rounded-none p-5 font-mono text-sm"
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Category */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                카테고리
              </label>
              <div className="space-y-1">
                <button
                  onClick={() => setCategoryId(null)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left",
                    !categoryId ? "bg-foreground text-background font-semibold" : "hover:bg-gray-50 text-muted-foreground"
                  )}
                >
                  선택 안함
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors text-left",
                      categoryId === cat.id
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
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 block flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> 태그
              </label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  placeholder="태그 입력 후 Enter"
                  className="text-sm rounded-xl h-8"
                />
                <Button size="sm" variant="outline" onClick={addTag} className="btn-press h-8 px-2">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 text-xs bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200"
                    >
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* AI Toggle */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <button
                onClick={() => setEnableAI(!enableAI)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-semibold text-foreground">AI 인사이트</span>
                </div>
                <div className={cn(
                  "w-10 h-6 rounded-full transition-colors",
                  enableAI ? "bg-amber-500" : "bg-gray-200"
                )}>
                  <div className={cn(
                    "w-5 h-5 rounded-full bg-white transition-transform",
                    enableAI ? "translate-x-4.5" : "translate-x-0.5"
                  )} />
                </div>
              </button>
            </div>

            {/* AI Insight */}
            {enableAI && (
              <AIInsightPanel
                title={title}
                content={content}
                onInsightGenerated={setAiInsight}
                onSummaryGenerated={setSummary}
              />
            )}

            {/* Chart Widget */}
            <ChartWidget />

            {/* Markdown tips */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">마크다운 팁</h4>
              <div className="space-y-1 text-xs text-muted-foreground font-mono">
                <div># 제목 1 / ## 제목 2</div>
                <div>**굵게** / *기울임*</div>
                <div>`코드` / ```코드블록```</div>
                <div>&gt; 인용구</div>
                <div>- 목록 / 1. 번호목록</div>
                <div>[링크](URL)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
