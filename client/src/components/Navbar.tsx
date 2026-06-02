import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, PenLine, LogOut, LogIn, ChevronDown } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useIsOwner } from "@/hooks/useIsOwner";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const isOwner = useIsOwner();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  const { data: categories } = trpc.categories.list.useQuery();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/posts?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const navLinks = [
    { label: "홈", href: "/" },
    { label: "전체 글", href: "/posts" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100"
          : "bg-transparent"
      )}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 rounded-full bg-blue-200 opacity-70 group-hover:scale-110 transition-transform duration-200" />
                <div className="absolute inset-1 rounded-full bg-foreground" />
              </div>
              <span className="font-black text-lg tracking-tight text-foreground">
                투자<span className="text-blue-400">인사이트</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer",
                    location === link.href
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-gray-100"
                  )}
                >
                  {link.label}
                </span>
              </Link>
            ))}

            {/* Categories dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors duration-150">
                카테고리 <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 origin-top scale-95 group-hover:scale-100">
                {categories?.map((cat) => (
                  <Link key={cat.id} href={`/posts?category=${cat.slug}`}>
                    <div className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-gray-50 cursor-pointer transition-colors">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color ?? "#ccc" }}
                      />
                      {cat.name}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors duration-150"
              aria-label="검색"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {isAuthenticated ? (
              <>
                {isOwner && (
                  <Link href="/write">
                    <Button size="sm" className="hidden md:flex items-center gap-1.5 btn-press">
                      <PenLine className="w-3.5 h-3.5" />
                      글쓰기
                    </Button>
                  </Link>
                )}
                <button
                  onClick={() => logout()}
                  className="hidden md:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors duration-150"
                  aria-label="로그아웃"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="sm" variant="outline" className="hidden md:flex items-center gap-1.5 btn-press">
                  <LogIn className="w-3.5 h-3.5" />
                  로그인
                </Button>
              </a>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors duration-150"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-4 animate-fade-up">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="키워드로 검색..."
                className="pl-9 bg-white border-gray-200 rounded-xl"
              />
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-fade-up">
          <div className="container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className="px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-gray-50 cursor-pointer"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </div>
              </Link>
            ))}
            <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              카테고리
            </div>
            {categories?.map((cat) => (
              <Link key={cat.id} href={`/posts?category=${cat.slug}`}>
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-foreground hover:bg-gray-50 cursor-pointer"
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color ?? "#ccc" }} />
                  {cat.name}
                </div>
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2">
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <Link href="/write">
                    <Button size="sm" className="flex-1 btn-press" onClick={() => setMobileOpen(false)}>
                      <PenLine className="w-3.5 h-3.5 mr-1.5" /> 글쓰기
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => { logout(); setMobileOpen(false); }}>
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <a href={getLoginUrl()} className="block">
                  <Button size="sm" variant="outline" className="w-full btn-press">
                    <LogIn className="w-3.5 h-3.5 mr-1.5" /> 로그인
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
