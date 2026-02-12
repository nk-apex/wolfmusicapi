import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Search,
  Music,
  Video,
  Copy,
  Check,
  Zap,
  Code2,
  ExternalLink,
  Loader2,
  Download,
  Play,
  Clock,
  User,
  Terminal,
  ChevronDown,
  Shield,
  Lock,
  Settings,
} from "lucide-react";
import { endpointInfo, type SearchResult, type EndpointInfo } from "@shared/schema";
import wolfLogo from "../assets/wolf-logo.png";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      data-testid={`button-copy`}
      className="p-1.5 rounded-md transition-colors"
      style={{ color: copied ? "#00ff00" : "rgba(255,255,255,0.4)" }}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function EndpointCard({ endpoint, baseUrl }: { endpoint: EndpointInfo; baseUrl: string }) {
  const exampleUrl =
    endpoint.path === "/api/search"
      ? `${baseUrl}${endpoint.path}?q=Alan+Walker+Faded`
      : `${baseUrl}${endpoint.path}?url=https://youtube.com/watch?v=60ItHLz5WEA`;

  return (
    <div
      data-testid={`card-endpoint-${endpoint.path}`}
      className="rounded-md p-4 space-y-3 transition-all"
      style={{
        background: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0, 255, 0, 0.2)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)"; e.currentTarget.style.background = "rgba(255, 255, 255, 0.02)"; }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ background: "rgba(0, 255, 0, 0.12)", color: "#00ff00", letterSpacing: "0.05em" }}
        >
          {endpoint.method}
        </span>
        <code className="text-sm font-mono" style={{ color: "#ffffff" }}>{endpoint.path}</code>
        {endpoint.format !== "json" && (
          <span className="text-[10px] px-1.5 py-0.5 rounded ml-auto" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
            {endpoint.format.toUpperCase()}
          </span>
        )}
      </div>
      <p className="text-xs" style={{ color: "rgba(255, 255, 255, 0.45)" }}>{endpoint.description}</p>
      <div className="space-y-1">
        {endpoint.params.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs flex-wrap">
            <code className="font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(0, 255, 0, 0.06)", color: "#00ff00", fontSize: "11px" }}>{p.name}</code>
            <span style={{ color: "rgba(255,255,255,0.35)" }}>{p.type}</span>
            {p.required && <span className="text-[9px] font-bold" style={{ color: "#ff4444" }}>REQUIRED</span>}
            <span style={{ color: "rgba(255,255,255,0.35)" }}>- {p.description}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 rounded px-2 py-1.5" style={{ background: "rgba(0,0,0,0.3)" }}>
        <code className="text-[10px] font-mono break-all flex-1" style={{ color: "rgba(255,255,255,0.35)" }}>{exampleUrl}</code>
        <CopyButton text={exampleUrl} />
      </div>
    </div>
  );
}

function SearchResultCard({ result, baseUrl }: { result: SearchResult; baseUrl: string }) {
  const mp3Url = `${baseUrl}/download/mp3?url=https://youtube.com/watch?v=${result.id}`;
  const mp4Url = `${baseUrl}/download/mp4?url=https://youtube.com/watch?v=${result.id}`;

  return (
    <div
      data-testid={`card-result-${result.id}`}
      className="rounded-md p-3 transition-all"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0, 255, 0, 0.2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-20 h-14 rounded bg-cover bg-center flex-shrink-0"
          style={{
            backgroundImage: `url(https://img.youtube.com/vi/${result.id}/mqdefault.jpg)`,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-xs font-medium leading-tight line-clamp-2" style={{ color: "#ffffff" }} data-testid={`text-title-${result.id}`}>
            {result.title}
          </h3>
          <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: "rgba(255,255,255,0.4)" }}>
            {result.channelTitle && <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{result.channelTitle}</span>}
            {result.duration && <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{result.duration}</span>}
            {result.size && <span className="flex items-center gap-1"><Download className="w-2.5 h-2.5" />{result.size}</span>}
          </div>
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <Button size="sm" asChild data-testid={`button-mp3-${result.id}`}>
              <a href={mp3Url} target="_blank" rel="noopener noreferrer"><Music className="w-3 h-3 mr-1" />MP3</a>
            </Button>
            <Button size="sm" variant="secondary" asChild data-testid={`button-mp4-${result.id}`}>
              <a href={mp4Url} target="_blank" rel="noopener noreferrer"><Video className="w-3 h-3 mr-1" />MP4</a>
            </Button>
            <Button size="sm" variant="outline" asChild data-testid={`button-play-${result.id}`}>
              <a href={`https://youtube.com/watch?v=${result.id}`} target="_blank" rel="noopener noreferrer"><Play className="w-3 h-3 mr-1" />Watch</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [tryUrl, setTryUrl] = useState("");
  const [tryEndpoint, setTryEndpoint] = useState("/api/search");
  const [tryResult, setTryResult] = useState<string | null>(null);
  const [tryLoading, setTryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"download" | "search">("download");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState<"playground" | "docs">("playground");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleTryEndpoint = async () => {
    if (!tryUrl.trim()) return;
    setTryLoading(true);
    setTryResult(null);
    setSearchResults(null);
    try {
      const param = tryEndpoint === "/api/search" ? `q=${encodeURIComponent(tryUrl)}` : `url=${encodeURIComponent(tryUrl)}`;
      const res = await fetch(`${tryEndpoint}?${param}`);
      const data = await res.json();
      setTryResult(JSON.stringify(data, null, 2));
      if (tryEndpoint === "/api/search" && Array.isArray(data)) {
        setSearchResults(data);
        setLastSearchQuery(tryUrl);
      }
    } catch (err: any) {
      setTryResult(JSON.stringify({ error: err.message }, null, 2));
    }
    setTryLoading(false);
  };

  const downloadEndpoints = endpointInfo.filter((e) => e.path.startsWith("/download"));
  const apiEndpoints = endpointInfo.filter((e) => e.path.startsWith("/api"));
  const fullUrl = `${baseUrl}${tryEndpoint}?${tryEndpoint === "/api/search" ? "q" : "url"}=${tryUrl ? encodeURIComponent(tryUrl) : ""}`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>

      <header
        className="sticky top-0 border-b"
        style={{
          zIndex: 50,
          background: "rgba(10, 10, 10, 0.9)",
          backdropFilter: "blur(20px)",
          borderColor: "rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <img
              src={wolfLogo}
              alt="WolfMusicApi Logo"
              className="w-9 h-9 rounded-md object-cover"
              style={{ border: "1px solid rgba(0, 255, 0, 0.25)" }}
            />
            <div>
              <h1 className="text-sm font-bold tracking-widest leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                <span style={{ color: "#00ff00" }}>WOLF-MUSIC</span><span style={{ color: "#ffffff" }}>API</span>
              </h1>
              <p className="text-[10px] tracking-[0.2em] mt-0.5" style={{ color: "rgba(0, 255, 0, 0.4)" }}>
                YOUTUBE DOWNLOAD SERVICE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] font-mono px-2 py-1 rounded"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
            >
              v1.0
            </span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "rgba(0, 255, 0, 0.06)", border: "1px solid rgba(0, 255, 0, 0.15)" }}>
              <Lock className="w-3 h-3" style={{ color: "#00ff00" }} />
              <span className="text-[10px] font-semibold tracking-wider" style={{ color: "#00ff00" }}>ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      <section className="relative flex-shrink-0" style={{ minHeight: "380px" }}>
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 80%, rgba(0, 255, 0, 0.04), transparent 55%)" }}
        />
        <div className="relative max-w-5xl mx-auto px-5 pt-16 pb-10 text-center space-y-5">
          <div
            className="inline-flex items-center gap-2 text-[10px] px-4 py-2 rounded-md tracking-[0.15em] font-semibold"
            style={{
              border: "1px solid rgba(0, 255, 0, 0.25)",
              color: "#00ff00",
              background: "rgba(0, 255, 0, 0.04)",
            }}
            data-testid="badge-hero"
          >
            <Zap className="w-3 h-3" />
            FREE MUSIC DOWNLOAD API
          </div>

          <h2
            className="text-3xl sm:text-4xl font-bold leading-tight"
            style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "-0.01em" }}
          >
            <span style={{ color: "#ffffff" }}>Search & Download </span>
            <span style={{ color: "#00ff00" }}>YouTube Music</span>
          </h2>

          <p className="max-w-lg mx-auto text-sm leading-relaxed" style={{ color: "rgba(255, 255, 255, 0.45)" }}>
            Multi-endpoint API for searching, converting, and downloading
            YouTube content as MP3 or MP4 with zero authentication required.
          </p>

          <div
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-md"
            style={{
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "rgba(255, 255, 255, 0.6)",
              background: "rgba(255, 255, 255, 0.02)",
            }}
            data-testid="badge-author"
          >
            <Shield className="w-3.5 h-3.5" style={{ color: "#00ff00" }} />
            By <strong style={{ color: "#ffffff" }}>WolfMusicApi</strong>
          </div>
        </div>
      </section>

      <div className="flex-1 max-w-5xl mx-auto w-full px-5 pb-8">

        <div
          className="flex items-center gap-0 border-b mb-6"
          style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
        >
          <button
            className="px-5 py-3 text-xs font-semibold tracking-wider transition-colors relative"
            style={{
              color: activeSection === "playground" ? "#00ff00" : "rgba(255, 255, 255, 0.4)",
              borderBottom: activeSection === "playground" ? "2px solid #00ff00" : "2px solid transparent",
              marginBottom: "-1px",
            }}
            onClick={() => setActiveSection("playground")}
            data-testid="tab-playground"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5" />
              PLAYGROUND
            </span>
          </button>
          <button
            className="px-5 py-3 text-xs font-semibold tracking-wider transition-colors relative"
            style={{
              color: activeSection === "docs" ? "#00ff00" : "rgba(255, 255, 255, 0.4)",
              borderBottom: activeSection === "docs" ? "2px solid #00ff00" : "2px solid transparent",
              marginBottom: "-1px",
            }}
            onClick={() => setActiveSection("docs")}
            data-testid="tab-docs"
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5" />
              ENDPOINTS
            </span>
          </button>
        </div>

        {activeSection === "playground" && (
          <div className="space-y-5">
            <div
              className="rounded-md overflow-hidden"
              style={{ border: "1px solid rgba(255, 255, 255, 0.06)", background: "rgba(255, 255, 255, 0.02)" }}
            >
              <div
                className="flex items-center gap-3 px-4 py-2.5 border-b flex-wrap"
                style={{ borderColor: "rgba(255, 255, 255, 0.06)", background: "rgba(0, 0, 0, 0.3)" }}
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
                  <select
                    data-testid="select-endpoint"
                    value={tryEndpoint}
                    onChange={(e) => {
                      setTryEndpoint(e.target.value);
                      setTryResult(null);
                      setSearchResults(null);
                      setTryUrl(e.target.value === "/api/search" ? "" : "https://youtube.com/watch?v=60ItHLz5WEA");
                    }}
                    className="text-xs font-mono bg-transparent focus:outline-none cursor-pointer pr-1"
                    style={{ color: "#ffffff", border: "none" }}
                  >
                    {endpointInfo.map((ep) => (
                      <option key={ep.path} value={ep.path} style={{ background: "#0a0a0a", color: "#00ff00" }}>
                        {ep.method} {ep.path}
                      </option>
                    ))}
                  </select>
                </div>
                <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
                <button
                  className="flex items-center gap-1.5 text-xs transition-colors"
                  style={{ color: "#00ff00" }}
                  onClick={handleTryEndpoint}
                  disabled={tryLoading || !tryUrl.trim()}
                  data-testid="button-load-sample"
                >
                  <Code2 className="w-3 h-3" />
                  Execute
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded transition-colors"
                    style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)" }}
                    onClick={() => setActiveSection("docs")}
                  >
                    <Settings className="w-3 h-3" />
                    Docs
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {tryEndpoint === "/api/search" ? "SONG NAME" : "YOUTUBE URL"}
                    </label>
                    <input
                      type="text"
                      data-testid="input-try-url"
                      value={tryUrl}
                      onChange={(e) => setTryUrl(e.target.value)}
                      placeholder={tryEndpoint === "/api/search" ? "e.g. Home by NF, Alan Walker Faded..." : "https://youtube.com/watch?v=..."}
                      className="w-full h-10 rounded-md px-3 text-sm focus:outline-none font-mono"
                      style={{
                        background: "rgba(0, 0, 0, 0.4)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        color: "#ffffff",
                        caretColor: "#00ff00",
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0, 255, 0, 0.3)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)"; }}
                      onKeyDown={(e) => { if (e.key === "Enter") handleTryEndpoint(); }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                      FULL API URL
                    </label>
                    <div
                      className="h-10 rounded-md px-3 flex items-center gap-2"
                      style={{ background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                      data-testid="display-full-url"
                    >
                      <code className="text-[11px] font-mono break-all flex-1 truncate" style={{ color: "rgba(0, 255, 0, 0.6)" }}>
                        {fullUrl}
                      </code>
                      <CopyButton text={fullUrl} />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleTryEndpoint}
                  disabled={tryLoading || !tryUrl.trim()}
                  data-testid="button-try-execute"
                  className="w-full"
                >
                  {tryLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Execute Request
                </Button>
              </div>
            </div>

            {tryLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#00ff00" }} />
                <span className="ml-2 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Fetching response...</span>
              </div>
            )}

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-[11px] font-mono"
                  style={{ background: "rgba(0,255,0,0.03)", borderLeft: "2px solid #00ff00", color: "rgba(255,255,255,0.5)" }}
                >
                  <Terminal className="w-3 h-3" style={{ color: "#00ff00" }} />
                  GET /api/search?q={encodeURIComponent(lastSearchQuery)} -- {searchResults.length} results
                </div>
                <div className="grid gap-2" data-testid="container-search-results">
                  {searchResults.map((result) => (
                    <SearchResultCard key={result.id} result={result} baseUrl={baseUrl} />
                  ))}
                </div>
              </div>
            )}

            {searchResults && searchResults.length === 0 && (
              <div className="py-12 text-center">
                <Music className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(255,255,255,0.15)" }} />
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>No results found. Try a different song name.</p>
              </div>
            )}

            {tryResult && !searchResults && (
              <div className="relative rounded-md overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="absolute top-2 right-2" style={{ zIndex: 2 }}>
                  <CopyButton text={tryResult} />
                </div>
                <pre
                  className="p-4 text-xs font-mono overflow-auto max-h-80"
                  style={{ background: "rgba(0, 0, 0, 0.5)", color: "#00ff00" }}
                >
                  {tryResult}
                </pre>
              </div>
            )}

            {tryResult && searchResults && searchResults.length > 0 && (
              <details className="group">
                <summary
                  className="cursor-pointer text-[11px] font-mono px-3 py-2 rounded-md flex items-center gap-2"
                  style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  data-testid="button-raw-json"
                >
                  <Code2 className="w-3 h-3" />
                  View Raw JSON Response
                </summary>
                <div className="relative mt-2 rounded-md overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="absolute top-2 right-2" style={{ zIndex: 2 }}>
                    <CopyButton text={tryResult} />
                  </div>
                  <pre
                    className="p-4 text-xs font-mono overflow-auto max-h-80"
                    style={{ background: "rgba(0, 0, 0, 0.5)", color: "#00ff00" }}
                  >
                    {tryResult}
                  </pre>
                </div>
              </details>
            )}
          </div>
        )}

        {activeSection === "docs" && (
          <div className="space-y-5">
            <div className="flex gap-1 p-1 rounded-md w-fit" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <button
                className="px-4 py-1.5 rounded text-[11px] font-semibold tracking-wider transition-all"
                style={{
                  background: activeTab === "download" ? "rgba(0, 255, 0, 0.1)" : "transparent",
                  color: activeTab === "download" ? "#00ff00" : "rgba(255,255,255,0.4)",
                }}
                onClick={() => setActiveTab("download")}
                data-testid="tab-download"
              >
                Download ({downloadEndpoints.length})
              </button>
              <button
                className="px-4 py-1.5 rounded text-[11px] font-semibold tracking-wider transition-all"
                style={{
                  background: activeTab === "search" ? "rgba(0, 255, 0, 0.1)" : "transparent",
                  color: activeTab === "search" ? "#00ff00" : "rgba(255,255,255,0.4)",
                }}
                onClick={() => setActiveTab("search")}
                data-testid="tab-search-api"
              >
                Search ({apiEndpoints.length})
              </button>
            </div>

            {activeTab === "download" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {downloadEndpoints.map((ep) => (
                  <EndpointCard key={ep.path} endpoint={ep} baseUrl={baseUrl} />
                ))}
              </div>
            )}

            {activeTab === "search" && (
              <div className="space-y-2">
                {apiEndpoints.map((ep) => (
                  <EndpointCard key={ep.path} endpoint={ep} baseUrl={baseUrl} />
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2 pt-4">
              <div className="rounded-md p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="font-medium text-xs flex items-center gap-2" style={{ color: "#ffffff" }}>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(0,255,0,0.08)", color: "rgba(0,255,0,0.6)" }}>JavaScript</span>
                  Fetch MP3
                </h3>
                <pre className="rounded p-3 text-[11px] font-mono overflow-auto" style={{ background: "rgba(0,0,0,0.4)", color: "#00ff00" }}>{`const res = await fetch(
  '${baseUrl}/download/mp3?url=' +
  encodeURIComponent(youtubeUrl)
);
const data = await res.json();
console.log(data.downloadUrl);`}</pre>
              </div>
              <div className="rounded-md p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="font-medium text-xs flex items-center gap-2" style={{ color: "#ffffff" }}>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(0,255,0,0.08)", color: "rgba(0,255,0,0.6)" }}>Python</span>
                  Search & Download
                </h3>
                <pre className="rounded p-3 text-[11px] font-mono overflow-auto" style={{ background: "rgba(0,0,0,0.4)", color: "#00ff00" }}>{`import requests

results = requests.get(
  '${baseUrl}/api/search',
  params={'q': 'Alan Walker Faded'}
).json()

for item in results:
    print(item['title'], item['id'])`}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer
        className="border-t mt-auto"
        style={{ borderColor: "rgba(255, 255, 255, 0.04)" }}
      >
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[10px] tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            <span style={{ color: "rgba(0, 255, 0, 0.3)" }}>WOLF-MUSIC</span><span style={{ color: "rgba(255, 255, 255, 0.2)" }}>API</span>
          </p>
          <a
            href="https://rinodepot.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] transition-colors"
            style={{ color: "rgba(255, 255, 255, 0.25)" }}
          >
            Source <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
