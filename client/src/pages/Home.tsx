import { Link } from "wouter";
import {
  TrendingUp,
  ArrowRight,
  BarChart2,
  Globe,
  Layers,
  Target,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { TradingViewMarketOverview } from "@/components/TradingViewWidget";

// 표시할 카테고리 슬러그 — 부동산·암호화폐 제외
const VISIBLE_CATEGORIES = ["stocks", "macro", "etf-fund", "strategy"];

const categoryIcons: Record<string, React.ReactNode> = {
  stocks: <BarChart2 className="w-6 h-6" />,
  macro: <Globe className="w-6 h-6" />,
  "etf-fund": <Layers className="w-6 h-6" />,
  strategy: <Target className="w-6 h-6" />,
};

export default function Home() {
  const { isAuthenticated } = useAuth();
  const { data: categories } = trpc.categories.list.useQuery();

  const visibleCategories = categories?.filter((c) =>
    VISIBLE_CATEGORIES.includes(c.slug)
  );

  return (
    <div className="overflow-x-hidden">
      {/* ─── Categories — 첫 화면 ───────────────────────────────────────────── */}
      <section className="pt-24 pb-16 relative overflow-hidden">
        {/* 배경 기하학 요소 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="geo-circle w-64 h-64 -top-12 -right-12 animate-float"
            style={{ backgroundColor: "oklch(0.75 0.08 230 / 0.12)" }}
          />
          <div
            className="geo-circle w-36 h-36 bottom-8 -left-8 animate-float"
            style={{ backgroundColor: "oklch(0.85 0.06 10 / 0.14)", animationDelay: "2s" }}
          />
          <div
            className="geo-rect w-20 h-20 top-1/3 right-1/4 rotate-12 animate-float"
            style={{ backgroundColor: "oklch(0.78 0.07 290 / 0.10)", animationDelay: "3.5s" }}
          />
        </div>

        <div className="container relative z-10">
          {/* 섹션 헤더 */}
          <div className="flex items-end justify-between mb-8 animate-fade-up">
            <div>
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">카테고리</p>
              <h2 className="font-black text-3xl md:text-4xl">투자 분야별 탐색</h2>
            </div>
            <div className="hidden md:flex items-center gap-3">
              {!isAuthenticated && (
                <a href={getLoginUrl()}>
                  <Button variant="outline" size="sm" className="btn-press rounded-xl">
                    로그인하기
                  </Button>
                </a>
              )}
              <Link href="/posts">
                <Button variant="ghost" size="sm" className="items-center gap-1.5 text-sm">
                  전체 글 보기 <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* 카테고리 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {visibleCategories?.map((cat, i) => {
              const icon = categoryIcons[cat.slug];
              return (
                <Link key={cat.id} href={`/posts?category=${cat.slug}`}>
                  <div
                    className="group flex flex-col items-center gap-4 p-8 bg-white hover:bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-up"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200"
                      style={{ backgroundColor: cat.color ?? "#6B9FD4" }}
                    >
                      {icon ?? (
                        <span className="font-bold text-lg">{cat.name.charAt(0)}</span>
                      )}
                    </div>
                    <span className="text-base font-bold text-center">{cat.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 모바일 버튼 */}
          <div className="flex md:hidden items-center justify-center gap-3 mt-8">
            <Link href="/posts">
              <Button className="btn-press rounded-xl">
                전체 글 보기 <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            {!isAuthenticated && (
              <a href={getLoginUrl()}>
                <Button variant="outline" className="btn-press rounded-xl">
                  로그인하기
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* ─── Market Overview Section ────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="mb-10">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-2">시장 현황</p>
            <h2 className="font-black">실시간 글로벌 시장</h2>
            <p className="text-muted-foreground text-sm mt-2 font-light">
              주요 지수 · 암호화폐 · 원자재 · 환율 — TradingView 제공
            </p>
          </div>
          <div className="bg-gray-50 rounded-3xl overflow-hidden border border-gray-100">
            <TradingViewMarketOverview height={520} showChart={true} />
          </div>
        </div>
      </section>

      {/* ─── CTA Section ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-foreground text-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="geo-circle w-64 h-64 -top-16 -right-16" style={{ backgroundColor: "oklch(0.75 0.08 230 / 0.1)" }} />
          <div className="geo-circle w-40 h-40 bottom-0 left-10" style={{ backgroundColor: "oklch(0.85 0.06 10 / 0.08)" }} />
        </div>
        <div className="container relative z-10 text-center space-y-6">
          <h2 className="font-black text-white">투자 여정을 함께 기록하세요</h2>
          <p className="text-white/60 max-w-md mx-auto font-light">
            AI 인사이트와 함께 나만의 투자 블로그를 시작하세요. 분석하고, 기록하고, 성장하세요.
          </p>
          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button size="lg" variant="secondary" className="btn-press rounded-xl">
                지금 시작하기 <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
