import { useEffect, useRef, memo } from "react";

// ─── TradingView Market Overview Widget ──────────────────────────────────────
// Renders the official TradingView "market-overview" widget by dynamically
// loading the vendor script and mounting it into a container div.
// The widget is self-contained; no API key is required.

interface TradingViewMarketOverviewProps {
  /** Height of the widget iframe in pixels (default: 400) */
  height?: number;
  /** Whether to show the chart section inside the widget (default: true) */
  showChart?: boolean;
  className?: string;
}

export const TradingViewMarketOverview = memo(function TradingViewMarketOverview({
  height = 400,
  showChart = true,
  className = "",
}: TradingViewMarketOverviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous widget
    container.innerHTML = "";

    // Create the inner div that TradingView targets
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    // Build the config script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "light",
      dateRange: "12M",
      showChart,
      locale: "kr",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      width: "100%",
      height,
      tabs: [
        {
          title: "주요 지수",
          symbols: [
            { s: "KRX:KOSPI", d: "KOSPI" },
            { s: "SP:SPX", d: "S&P 500" },
            { s: "NASDAQ:NDX", d: "NASDAQ 100" },
            { s: "INDEX:NKY", d: "Nikkei 225" },
            { s: "FOREXCOM:DJI", d: "Dow Jones" },
          ],
          originalTitle: "Indices",
        },
        {
          title: "원자재 & FX",
          symbols: [
            { s: "TVC:GOLD", d: "금 (Gold)" },
            { s: "TVC:USOIL", d: "WTI 원유" },
            { s: "FX_IDC:USDKRW", d: "달러/원" },
            { s: "FX:EURUSD", d: "유로/달러" },
          ],
          originalTitle: "Commodities",
        },
      ],
    });

    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = "";
    };
  }, [height, showChart]);

  return (
    <div
      ref={containerRef}
      className={`tradingview-widget-container ${className}`}
      style={{ minHeight: height }}
    />
  );
});

// ─── TradingView Ticker Tape Widget ──────────────────────────────────────────
// Slim horizontal scrolling ticker for the top of the page.

export const TradingViewTickerTape = memo(function TradingViewTickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: "KRX:KOSPI", title: "KOSPI" },
        { proName: "SP:SPX", title: "S&P 500" },
        { proName: "NASDAQ:NDX", title: "NASDAQ" },
        { proName: "BINANCE:BTCUSDT", title: "BTC/USDT" },
        { proName: "BINANCE:ETHUSDT", title: "ETH/USDT" },
        { proName: "TVC:GOLD", title: "금" },
        { proName: "FX_IDC:USDKRW", title: "USD/KRW" },
        { proName: "TVC:USOIL", title: "WTI 원유" },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "light",
      locale: "kr",
    });

    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="tradingview-widget-container w-full"
    />
  );
});
