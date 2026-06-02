import { Link } from "wouter";
import { TrendingUp } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background mt-24">
      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative w-7 h-7">
                <div className="absolute inset-0 rounded-full bg-blue-300 opacity-60" />
                <div className="absolute inset-1 rounded-full bg-white" />
              </div>
              <span className="font-black text-base tracking-tight">
                투자<span className="text-blue-300">인사이트</span>
              </span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              주식, 거시경제, ETF 분석과 AI 인사이트를 제공하는 투자 블로그입니다.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">카테고리</h4>
            <ul className="space-y-2">
              {[
                { label: "주식", slug: "stocks" },
                { label: "거시경제", slug: "macro" },
                { label: "ETF/펀드", slug: "etf-fund" },
                { label: "투자전략", slug: "strategy" },
              ].map((item) => (
                <li key={item.slug}>
                  <Link href={`/posts?category=${item.slug}`}>
                    <span className="text-sm text-white/60 hover:text-white transition-colors cursor-pointer">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">투자 유의사항</h4>
            <p className="text-xs text-white/40 leading-relaxed">
              본 블로그의 모든 내용은 개인적인 견해이며 투자 권유가 아닙니다. 투자에 관한 최종 결정은 본인의 판단과 책임 하에 이루어져야 합니다. 과거 수익률이 미래 수익률을 보장하지 않습니다.
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            © {year} 투자인사이트 블로그. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>투자는 항상 신중하게</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
