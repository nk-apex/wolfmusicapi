import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Music,
  Video,
  Copy,
  Check,
  Zap,
  Globe,
  Code2,
  ArrowRight,
  ExternalLink,
  Loader2,
  Download,
  Play,
  Clock,
  User,
  Terminal,
  Radio,
} from "lucide-react";
import { endpointInfo, type SearchResult, type EndpointInfo } from "@shared/schema";

function NeonParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 0, ${p.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(0, 255, 0, 0.5)";
        ctx.fill();
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="icon"
      variant="ghost"
      data-testid={`button-copy-${text.slice(0, 20)}`}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="w-4 h-4" style={{ color: "#00ff00" }} /> : <Copy className="w-4 h-4" />}
    </Button>
  );
}

function GlassCard({ children, className = "", glow = false, ...props }: { children: React.ReactNode; className?: string; glow?: boolean; [key: string]: any }) {
  return (
    <div
      className={`relative rounded-md border border-[#00ff00]/20 ${className}`}
      style={{
        background: "rgba(0, 20, 0, 0.6)",
        backdropFilter: "blur(12px)",
        boxShadow: glow ? "0 0 20px rgba(0, 255, 0, 0.1), inset 0 0 20px rgba(0, 255, 0, 0.02)" : "none",
        transition: "box-shadow 0.3s ease, border-color 0.3s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 0 30px rgba(0, 255, 0, 0.2), inset 0 0 30px rgba(0, 255, 0, 0.03)";
        e.currentTarget.style.borderColor = "rgba(0, 255, 0, 0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = glow ? "0 0 20px rgba(0, 255, 0, 0.1), inset 0 0 20px rgba(0, 255, 0, 0.02)" : "none";
        e.currentTarget.style.borderColor = "rgba(0, 255, 0, 0.2)";
      }}
      {...props}
    >
      {children}
    </div>
  );
}

function EndpointCard({ endpoint, baseUrl }: { endpoint: EndpointInfo; baseUrl: string }) {
  const exampleUrl =
    endpoint.path === "/api/search"
      ? `${baseUrl}${endpoint.path}?q=Alan+Walker+Faded`
      : `${baseUrl}${endpoint.path}?url=https://youtube.com/watch?v=60ItHLz5WEA`;

  return (
    <GlassCard data-testid={`card-endpoint-${endpoint.path}`} glow>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono text-xs font-semibold px-2 py-1 rounded-md"
            style={{ background: "rgba(0, 255, 0, 0.1)", color: "#00ff00" }}
          >
            {endpoint.method}
          </span>
          <code className="text-sm font-mono break-all" style={{ color: "#e0ffe0" }}>{endpoint.path}</code>
          {endpoint.format !== "json" && (
            <span
              className="text-xs px-2 py-0.5 rounded-md ml-auto border"
              style={{ borderColor: "rgba(0, 255, 0, 0.2)", color: "rgba(0, 255, 0, 0.6)" }}
            >
              {endpoint.format.toUpperCase()}
            </span>
          )}
        </div>
        <p className="text-sm" style={{ color: "rgba(0, 255, 0, 0.5)" }}>{endpoint.description}</p>
        <div className="space-y-1">
          {endpoint.params.map((p) => (
            <div key={p.name} className="flex items-center gap-2 text-xs flex-wrap">
              <code className="font-mono px-1.5 py-0.5 rounded-md" style={{ background: "rgba(0, 255, 0, 0.08)", color: "#00ff00" }}>{p.name}</code>
              <span style={{ color: "rgba(0, 255, 0, 0.4)" }}>{p.type}</span>
              {p.required && (
                <span className="text-[10px] font-bold" style={{ color: "#ff4444" }}>REQUIRED</span>
              )}
              <span style={{ color: "rgba(0, 255, 0, 0.4)" }}>- {p.description}</span>
            </div>
          ))}
        </div>
        <div
          className="flex items-center gap-1 rounded-md p-2"
          style={{ background: "rgba(0, 255, 0, 0.03)" }}
        >
          <code className="text-xs font-mono break-all flex-1" style={{ color: "rgba(0, 255, 0, 0.4)" }}>{exampleUrl}</code>
          <CopyButton text={exampleUrl} />
        </div>
      </div>
    </GlassCard>
  );
}

function SearchResultCard({ result, baseUrl }: { result: SearchResult; baseUrl: string }) {
  const mp3Url = `${baseUrl}/download/mp3?url=https://youtube.com/watch?v=${result.id}`;
  const mp4Url = `${baseUrl}/download/mp4?url=https://youtube.com/watch?v=${result.id}`;

  return (
    <GlassCard data-testid={`card-result-${result.id}`} glow>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-24 h-16 rounded-md bg-cover bg-center flex-shrink-0 border"
            style={{
              backgroundImage: `url(https://img.youtube.com/vi/${result.id}/mqdefault.jpg)`,
              borderColor: "rgba(0, 255, 0, 0.2)",
            }}
          />
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-sm font-medium leading-tight line-clamp-2" style={{ color: "#e0ffe0" }} data-testid={`text-title-${result.id}`}>
              {result.title}
            </h3>
            <div className="flex items-center gap-3 text-xs flex-wrap" style={{ color: "rgba(0, 255, 0, 0.4)" }}>
              {result.channelTitle && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {result.channelTitle}
                </span>
              )}
              {result.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {result.duration}
                </span>
              )}
              {result.size && (
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {result.size}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <Button size="sm" asChild data-testid={`button-mp3-${result.id}`}>
                <a href={mp3Url} target="_blank" rel="noopener noreferrer">
                  <Music className="w-3 h-3 mr-1" />
                  MP3
                </a>
              </Button>
              <Button size="sm" variant="secondary" asChild data-testid={`button-mp4-${result.id}`}>
                <a href={mp4Url} target="_blank" rel="noopener noreferrer">
                  <Video className="w-3 h-3 mr-1" />
                  MP4
                </a>
              </Button>
              <Button size="sm" variant="outline" asChild data-testid={`button-play-${result.id}`}>
                <a href={`https://youtube.com/watch?v=${result.id}`} target="_blank" rel="noopener noreferrer">
                  <Play className="w-3 h-3 mr-1" />
                  Watch
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [tryUrl, setTryUrl] = useState("https://youtube.com/watch?v=60ItHLz5WEA");
  const [tryEndpoint, setTryEndpoint] = useState("/download/mp3");
  const [tryResult, setTryResult] = useState<string | null>(null);
  const [tryLoading, setTryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"download" | "search">("download");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const { data: searchResults, isLoading: searchLoading, error: searchError } = useQuery<SearchResult[]>({
    queryKey: ["/api/search", activeSearch],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(activeSearch)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: activeSearch.length > 0,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveSearch(searchQuery.trim());
    }
  };

  const handleTryEndpoint = async () => {
    setTryLoading(true);
    setTryResult(null);
    try {
      const param = tryEndpoint === "/api/search" ? `q=${encodeURIComponent(tryUrl)}` : `url=${encodeURIComponent(tryUrl)}`;
      const res = await fetch(`${tryEndpoint}?${param}`);
      const data = await res.json();
      setTryResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTryResult(JSON.stringify({ error: err.message }, null, 2));
    }
    setTryLoading(false);
  };

  const downloadEndpoints = endpointInfo.filter((e) => e.path.startsWith("/download"));
  const apiEndpoints = endpointInfo.filter((e) => e.path.startsWith("/api"));

  return (
    <div className="min-h-screen relative" style={{ background: "#000000" }}>
      <NeonParticles />

      <div className="relative" style={{ zIndex: 1 }}>
        <header
          className="sticky top-0 border-b"
          style={{
            zIndex: 50,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(16px)",
            borderColor: "rgba(0, 255, 0, 0.15)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-md flex items-center justify-center"
                style={{
                  background: "rgba(0, 255, 0, 0.1)",
                  border: "1px solid rgba(0, 255, 0, 0.3)",
                  boxShadow: "0 0 12px rgba(0, 255, 0, 0.2)",
                }}
              >
                <Zap className="w-5 h-5" style={{ color: "#00ff00" }} />
              </div>
              <h1
                className="text-lg font-bold tracking-wider"
                style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00" }}
              >
                MediaDL
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-mono px-2 py-1 rounded-md border"
                style={{ borderColor: "rgba(0, 255, 0, 0.2)", color: "rgba(0, 255, 0, 0.5)" }}
              >
                v1.0
              </span>
              <div className="flex items-center gap-1">
                <Radio className="w-3 h-3" style={{ color: "#00ff00" }} />
                <span className="text-xs" style={{ color: "#00ff00" }}>ONLINE</span>
              </div>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden py-20">
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center top, rgba(0, 255, 0, 0.06), transparent 60%)",
            }}
          />
          <div className="relative max-w-6xl mx-auto px-4 text-center space-y-6">
            <div
              className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border"
              style={{ borderColor: "rgba(0, 255, 0, 0.3)", color: "rgba(0, 255, 0, 0.7)", background: "rgba(0, 255, 0, 0.05)" }}
              data-testid="badge-hero"
            >
              <Globe className="w-3 h-3" />
              OPEN API // FREE ACCESS
            </div>
            <h2
              className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span style={{ color: "#e0ffe0" }}>Download Music & Video</span>
              <br />
              <span style={{ color: "#00ff00", textShadow: "0 0 30px rgba(0, 255, 0, 0.4)" }}>via Simple API</span>
            </h2>
            <p className="max-w-2xl mx-auto text-lg" style={{ color: "rgba(0, 255, 0, 0.45)", fontFamily: "'JetBrains Mono', monospace" }}>
              Search, convert and download YouTube content as MP3 or MP4.
              Multiple endpoints for maximum compatibility.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button asChild data-testid="button-get-started">
                <a href="#search-test">
                  <Search className="w-4 h-4 mr-2" />
                  Test Endpoints
                </a>
              </Button>
              <Button variant="outline" asChild data-testid="button-view-docs">
                <a href="#endpoints">
                  <Code2 className="w-4 h-4 mr-2" />
                  View Docs
                </a>
              </Button>
            </div>

            <div className="flex justify-center gap-12 pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00", textShadow: "0 0 20px rgba(0, 255, 0, 0.3)" }}>{downloadEndpoints.length}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(0, 255, 0, 0.35)" }}>ENDPOINTS</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00", textShadow: "0 0 20px rgba(0, 255, 0, 0.3)" }}>2</p>
                <p className="text-xs mt-1" style={{ color: "rgba(0, 255, 0, 0.35)" }}>FORMATS</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00", textShadow: "0 0 20px rgba(0, 255, 0, 0.3)" }}>0</p>
                <p className="text-xs mt-1" style={{ color: "rgba(0, 255, 0, 0.35)" }}>AUTH</p>
              </div>
            </div>
          </div>
        </section>

        <section id="search-test" className="max-w-6xl mx-auto px-4 py-12 space-y-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5" style={{ color: "#00ff00" }} />
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#e0ffe0" }}>
              Test Search Endpoint
            </h2>
          </div>
          <p className="text-sm" style={{ color: "rgba(0, 255, 0, 0.4)" }}>
            Search for any song and see the live API response. Try "Home by NF" or "Alan Walker Faded".
          </p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(0, 255, 0, 0.3)" }} />
              <input
                type="text"
                data-testid="input-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for songs, artists..."
                className="w-full pl-10 pr-4 h-10 rounded-md text-sm focus:outline-none"
                style={{
                  background: "rgba(0, 255, 0, 0.05)",
                  border: "1px solid rgba(0, 255, 0, 0.2)",
                  color: "#e0ffe0",
                  caretColor: "#00ff00",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0, 255, 0, 0.5)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(0, 255, 0, 0.1)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0, 255, 0, 0.2)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>
            <Button type="submit" data-testid="button-search" disabled={!searchQuery.trim()}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </form>

          {searchLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#00ff00" }} />
              <span className="ml-2" style={{ color: "rgba(0, 255, 0, 0.5)" }}>Scanning endpoints...</span>
            </div>
          )}

          {searchResults && searchResults.length > 0 && (
            <div className="space-y-3">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono"
                style={{ background: "rgba(0, 255, 0, 0.05)", borderLeft: "2px solid #00ff00", color: "rgba(0, 255, 0, 0.6)" }}
              >
                <Terminal className="w-3 h-3" style={{ color: "#00ff00" }} />
                GET /api/search?q={encodeURIComponent(activeSearch)} — {searchResults.length} results
              </div>
              <div className="grid gap-3" data-testid="container-search-results">
                {searchResults.map((result) => (
                  <SearchResultCard key={result.id} result={result} baseUrl={baseUrl} />
                ))}
              </div>
            </div>
          )}

          {searchError && (
            <GlassCard>
              <div className="p-8 text-center">
                <Zap className="w-10 h-10 mx-auto mb-3" style={{ color: "#ff4444" }} />
                <p style={{ color: "rgba(255, 68, 68, 0.7)" }}>Connection failed. Try again.</p>
              </div>
            </GlassCard>
          )}

          {searchResults && searchResults.length === 0 && (
            <GlassCard>
              <div className="p-8 text-center">
                <Music className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(0, 255, 0, 0.3)" }} />
                <p style={{ color: "rgba(0, 255, 0, 0.4)" }}>No results found. Try a different query.</p>
              </div>
            </GlassCard>
          )}
        </section>

        <section id="endpoints" className="max-w-6xl mx-auto px-4 py-12 space-y-6">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5" style={{ color: "#00ff00" }} />
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#e0ffe0" }}>
              API Endpoints
            </h2>
          </div>

          <div className="flex gap-1 p-1 rounded-md w-fit" style={{ background: "rgba(0, 255, 0, 0.05)", border: "1px solid rgba(0, 255, 0, 0.15)" }}>
            <button
              className="px-4 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                background: activeTab === "download" ? "rgba(0, 255, 0, 0.15)" : "transparent",
                color: activeTab === "download" ? "#00ff00" : "rgba(0, 255, 0, 0.4)",
                boxShadow: activeTab === "download" ? "0 0 10px rgba(0, 255, 0, 0.1)" : "none",
              }}
              onClick={() => setActiveTab("download")}
              data-testid="tab-download"
            >
              <span className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                Download ({downloadEndpoints.length})
              </span>
            </button>
            <button
              className="px-4 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                background: activeTab === "search" ? "rgba(0, 255, 0, 0.15)" : "transparent",
                color: activeTab === "search" ? "#00ff00" : "rgba(0, 255, 0, 0.4)",
                boxShadow: activeTab === "search" ? "0 0 10px rgba(0, 255, 0, 0.1)" : "none",
              }}
              onClick={() => setActiveTab("search")}
              data-testid="tab-search-api"
            >
              <span className="flex items-center gap-1">
                <Search className="w-4 h-4" />
                Search ({apiEndpoints.length})
              </span>
            </button>
          </div>

          {activeTab === "download" && (
            <div className="grid gap-3 sm:grid-cols-2">
              {downloadEndpoints.map((ep) => (
                <EndpointCard key={ep.path} endpoint={ep} baseUrl={baseUrl} />
              ))}
            </div>
          )}

          {activeTab === "search" && (
            <div className="space-y-3">
              {apiEndpoints.map((ep) => (
                <EndpointCard key={ep.path} endpoint={ep} baseUrl={baseUrl} />
              ))}
            </div>
          )}
        </section>

        <section id="playground" className="max-w-6xl mx-auto px-4 py-12 space-y-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5" style={{ color: "#00ff00" }} />
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#e0ffe0" }}>
              API Playground
            </h2>
          </div>
          <GlassCard glow>
            <div className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: "rgba(0, 255, 0, 0.6)" }}>Endpoint</label>
                  <select
                    data-testid="select-endpoint"
                    value={tryEndpoint}
                    onChange={(e) => setTryEndpoint(e.target.value)}
                    className="w-full h-10 rounded-md px-3 text-sm focus:outline-none"
                    style={{
                      background: "rgba(0, 255, 0, 0.05)",
                      border: "1px solid rgba(0, 255, 0, 0.2)",
                      color: "#e0ffe0",
                    }}
                  >
                    {endpointInfo.map((ep) => (
                      <option key={ep.path} value={ep.path} style={{ background: "#000", color: "#00ff00" }}>
                        {ep.method} {ep.path}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" style={{ color: "rgba(0, 255, 0, 0.6)" }}>
                    {tryEndpoint === "/api/search" ? "Search Query" : "YouTube URL"}
                  </label>
                  <input
                    type="text"
                    data-testid="input-try-url"
                    value={tryUrl}
                    onChange={(e) => setTryUrl(e.target.value)}
                    placeholder={tryEndpoint === "/api/search" ? "Enter search query..." : "https://youtube.com/watch?v=..."}
                    className="w-full h-10 rounded-md px-3 text-sm focus:outline-none"
                    style={{
                      background: "rgba(0, 255, 0, 0.05)",
                      border: "1px solid rgba(0, 255, 0, 0.2)",
                      color: "#e0ffe0",
                      caretColor: "#00ff00",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0, 255, 0, 0.5)"; e.currentTarget.style.boxShadow = "0 0 12px rgba(0, 255, 0, 0.1)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(0, 255, 0, 0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button onClick={handleTryEndpoint} disabled={tryLoading} data-testid="button-try-execute">
                  {tryLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Execute
                </Button>
                <div
                  className="flex-1 rounded-md px-3 py-2"
                  style={{ background: "rgba(0, 255, 0, 0.03)" }}
                >
                  <code className="text-xs font-mono break-all" style={{ color: "rgba(0, 255, 0, 0.4)" }}>
                    GET {tryEndpoint}?{tryEndpoint === "/api/search" ? "q" : "url"}={tryUrl}
                  </code>
                </div>
              </div>
              {tryResult && (
                <div className="relative">
                  <div className="absolute top-2 right-2" style={{ zIndex: 2 }}>
                    <CopyButton text={tryResult} />
                  </div>
                  <pre
                    className="rounded-md p-4 text-xs font-mono overflow-auto max-h-80"
                    style={{
                      background: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(0, 255, 0, 0.15)",
                      color: "#00ff00",
                    }}
                  >
                    {tryResult}
                  </pre>
                </div>
              )}
            </div>
          </GlassCard>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-12 space-y-6">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5" style={{ color: "#00ff00" }} />
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#e0ffe0" }}>
              Quick Start
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <GlassCard glow>
              <div className="p-4 space-y-3">
                <h3 className="font-medium text-sm flex items-center gap-2" style={{ color: "#e0ffe0" }}>
                  <span className="text-xs px-2 py-0.5 rounded-md border" style={{ borderColor: "rgba(0, 255, 0, 0.2)", color: "rgba(0, 255, 0, 0.6)" }}>JavaScript</span>
                  Fetch MP3
                </h3>
                <pre
                  className="rounded-md p-3 text-xs font-mono overflow-auto"
                  style={{ background: "rgba(0, 0, 0, 0.5)", color: "#00ff00", border: "1px solid rgba(0, 255, 0, 0.1)" }}
                >{`const res = await fetch(
  '${baseUrl}/download/mp3?url=' +
  encodeURIComponent(youtubeUrl)
);
const data = await res.json();
console.log(data.downloadUrl);`}</pre>
              </div>
            </GlassCard>
            <GlassCard glow>
              <div className="p-4 space-y-3">
                <h3 className="font-medium text-sm flex items-center gap-2" style={{ color: "#e0ffe0" }}>
                  <span className="text-xs px-2 py-0.5 rounded-md border" style={{ borderColor: "rgba(0, 255, 0, 0.2)", color: "rgba(0, 255, 0, 0.6)" }}>Python</span>
                  Search & Download
                </h3>
                <pre
                  className="rounded-md p-3 text-xs font-mono overflow-auto"
                  style={{ background: "rgba(0, 0, 0, 0.5)", color: "#00ff00", border: "1px solid rgba(0, 255, 0, 0.1)" }}
                >{`import requests

results = requests.get(
  '${baseUrl}/api/search',
  params={'q': 'Alan Walker Faded'}
).json()

for item in results:
    print(item['title'], item['id'])`}</pre>
              </div>
            </GlassCard>
          </div>
        </section>

        <footer
          className="border-t mt-12"
          style={{ borderColor: "rgba(0, 255, 0, 0.1)" }}
        >
          <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-2 flex-wrap text-sm">
            <p style={{ color: "rgba(0, 255, 0, 0.3)", fontFamily: "'Orbitron', sans-serif", fontSize: "12px" }}>
              MediaDL API
            </p>
            <a
              href="https://rinodepot.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 transition-colors"
              style={{ color: "rgba(0, 255, 0, 0.4)" }}
            >
              Source <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
