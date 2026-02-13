import { useState } from "react";
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
  MessageSquare,
  Image,
} from "lucide-react";
import { allEndpoints, apiCategories, type ApiEndpoint, type SearchResult } from "@shared/schema";
import wolfLogo from "../assets/wolf-logo.png";

const categoryIcons: Record<string, typeof MessageSquare> = {
  "ai-chat": MessageSquare,
  "ai-image": Image,
  music: Music,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      data-testid="button-copy"
      className="p-1.5 rounded-md transition-colors"
      style={{ color: copied ? "#00ff00" : "rgba(255,255,255,0.3)" }}
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

function EndpointCard({ endpoint, baseUrl, onTry }: { endpoint: ApiEndpoint; baseUrl: string; onTry: (ep: ApiEndpoint) => void }) {
  return (
    <div
      data-testid={`card-endpoint-${endpoint.path}`}
      className="rounded-md p-4 space-y-3 transition-all"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.15)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ background: endpoint.method === "POST" ? "rgba(59,130,246,0.12)" : "rgba(0,255,0,0.12)", color: endpoint.method === "POST" ? "#60a5fa" : "#00ff00" }}
        >
          {endpoint.method}
        </span>
        <code className="text-sm font-mono" style={{ color: "#ffffff" }}>{endpoint.path}</code>
        {endpoint.provider && (
          <span className="text-[10px] px-1.5 py-0.5 rounded ml-auto" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}>
            {endpoint.provider}
          </span>
        )}
      </div>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{endpoint.description}</p>
      <div className="space-y-1">
        {endpoint.params.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-xs flex-wrap">
            <code className="font-mono px-1.5 py-0.5 rounded" style={{ background: "rgba(0,255,0,0.06)", color: "#00ff00", fontSize: "11px" }}>{p.name}</code>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>{p.type}</span>
            {p.required && <span className="text-[9px] font-bold" style={{ color: "#ff4444" }}>REQ</span>}
            <span style={{ color: "rgba(255,255,255,0.3)" }}>{p.description}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          className="text-[11px] font-medium flex items-center gap-1 transition-colors"
          style={{ color: "#00ff00" }}
          onClick={() => onTry(endpoint)}
          data-testid={`button-try-${endpoint.path}`}
        >
          <Play className="w-3 h-3" /> Try it
        </button>
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
      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-20 h-14 rounded bg-cover bg-center flex-shrink-0"
          style={{ backgroundImage: `url(https://img.youtube.com/vi/${result.id}/mqdefault.jpg)`, border: "1px solid rgba(255,255,255,0.08)" }}
        />
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="text-xs font-medium leading-tight line-clamp-2" style={{ color: "#ffffff" }} data-testid={`text-title-${result.id}`}>{result.title}</h3>
          <div className="flex items-center gap-3 text-[10px] flex-wrap" style={{ color: "rgba(255,255,255,0.4)" }}>
            {result.channelTitle && <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{result.channelTitle}</span>}
            {result.duration && <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{result.duration}</span>}
          </div>
          <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
            <Button size="sm" asChild data-testid={`button-mp3-${result.id}`}>
              <a href={mp3Url} target="_blank" rel="noopener noreferrer"><Music className="w-3 h-3 mr-1" />MP3</a>
            </Button>
            <Button size="sm" variant="secondary" asChild data-testid={`button-mp4-${result.id}`}>
              <a href={mp4Url} target="_blank" rel="noopener noreferrer"><Video className="w-3 h-3 mr-1" />MP4</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [playgroundEndpoint, setPlaygroundEndpoint] = useState<ApiEndpoint | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleTry = (ep: ApiEndpoint) => {
    setPlaygroundEndpoint(ep);
    setResult(null);
    setSearchResults(null);
    setInputValue("");
    window.scrollTo({ top: document.getElementById("playground")?.offsetTop || 0, behavior: "smooth" });
  };

  const handleExecute = async () => {
    if (!playgroundEndpoint || !inputValue.trim()) return;
    setLoading(true);
    setResult(null);
    setSearchResults(null);

    try {
      const ep = playgroundEndpoint;
      let res: Response;

      if (ep.method === "POST") {
        const body: any = { prompt: inputValue.trim() };
        if (ep.path.includes("/image/")) body.prompt = inputValue.trim();
        res = await fetch(ep.path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        const paramName = ep.params[0]?.name || "q";
        res = await fetch(`${ep.path}?${paramName}=${encodeURIComponent(inputValue.trim())}`);
      }

      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));

      if (ep.path === "/api/search" && Array.isArray(data)) {
        setSearchResults(data);
      }
    } catch (err: any) {
      setResult(JSON.stringify({ error: err.message }, null, 2));
    }
    setLoading(false);
  };

  const getFullUrl = () => {
    if (!playgroundEndpoint) return "";
    if (playgroundEndpoint.method === "POST") {
      return `${baseUrl}${playgroundEndpoint.path}`;
    }
    const paramName = playgroundEndpoint.params[0]?.name || "q";
    return `${baseUrl}${playgroundEndpoint.path}?${paramName}=${inputValue ? encodeURIComponent(inputValue) : ""}`;
  };

  const getInputLabel = () => {
    if (!playgroundEndpoint) return "Input";
    if (playgroundEndpoint.category === "ai-chat" || playgroundEndpoint.category === "ai-image") return "Prompt";
    if (playgroundEndpoint.path === "/api/search") return "Search Query";
    return "YouTube URL";
  };

  const getInputPlaceholder = () => {
    if (!playgroundEndpoint) return "";
    if (playgroundEndpoint.category === "ai-chat") return "e.g. Explain quantum computing in simple terms...";
    if (playgroundEndpoint.category === "ai-image") return "e.g. A futuristic city at sunset, cyberpunk style...";
    if (playgroundEndpoint.path === "/api/search") return "e.g. Alan Walker Faded, Home by NF...";
    return "e.g. https://youtube.com/watch?v=60ItHLz5WEA";
  };

  const filteredEndpoints = activeCategory
    ? allEndpoints.filter((e) => e.category === activeCategory)
    : allEndpoints;

  const endpointCounts = apiCategories.map((cat) => ({
    ...cat,
    count: allEndpoints.filter((e) => e.category === cat.id).length,
  }));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>

      <header
        className="sticky top-0 border-b"
        style={{ zIndex: 50, background: "rgba(10,10,10,0.92)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <img src={wolfLogo} alt="WolfApis Logo" className="w-9 h-9 rounded-md object-cover" style={{ border: "1px solid rgba(0,255,0,0.2)" }} />
            <div>
              <h1 className="text-sm font-bold tracking-widest leading-none" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                <span style={{ color: "#00ff00" }}>WOLF</span><span style={{ color: "#ffffff" }}>APIS</span>
              </h1>
              <p className="text-[10px] tracking-[0.15em] mt-0.5" style={{ color: "rgba(0,255,0,0.35)" }}>
                MULTI-PROVIDER API HUB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
              v2.0
            </span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded" style={{ background: "rgba(0,255,0,0.05)", border: "1px solid rgba(0,255,0,0.12)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff00", boxShadow: "0 0 6px #00ff00" }} />
              <span className="text-[10px] font-semibold tracking-wider" style={{ color: "#00ff00" }}>LIVE</span>
            </div>
          </div>
        </div>
      </header>

      <section className="relative flex-shrink-0">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(0,255,0,0.03), transparent 50%)" }} />
        <div className="relative max-w-5xl mx-auto px-5 pt-14 pb-10 text-center space-y-5">
          <div
            className="inline-flex items-center gap-2 text-[10px] px-4 py-2 rounded-md tracking-[0.15em] font-semibold"
            style={{ border: "1px solid rgba(0,255,0,0.2)", color: "#00ff00", background: "rgba(0,255,0,0.03)" }}
            data-testid="badge-hero"
          >
            <Zap className="w-3 h-3" />
            MULTI-PROVIDER API SERVICE
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold leading-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            <span style={{ color: "#ffffff" }}>All Your </span>
            <span style={{ color: "#00ff00" }}>AI APIs</span>
            <span style={{ color: "#ffffff" }}> in One Place</span>
          </h2>

          <p className="max-w-xl mx-auto text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>
            GPT, Claude, Mistral, Gemini, DeepSeek, Venice, Groq, Cohere
            and more. Plus YouTube music downloads. All through a single unified API.
          </p>

          <div className="flex items-center justify-center gap-6 pt-2">
            {endpointCounts.map((cat) => {
              const Icon = categoryIcons[cat.id] || Code2;
              return (
                <button
                  key={cat.id}
                  className="text-center group transition-all"
                  onClick={() => { setActiveCategory(cat.id); document.getElementById("endpoints")?.scrollIntoView({ behavior: "smooth" }); }}
                  data-testid={`stat-${cat.id}`}
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Icon className="w-4 h-4" style={{ color: "#00ff00" }} />
                    <span className="text-2xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#00ff00" }}>{cat.count}</span>
                  </div>
                  <p className="text-[10px] tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{cat.name.toUpperCase()}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex-1 max-w-5xl mx-auto w-full px-5 pb-8 space-y-8">

        <section id="endpoints">
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-4 h-4" style={{ color: "#00ff00" }} />
            <h3 className="text-sm font-bold tracking-wider" style={{ color: "#ffffff" }}>AVAILABLE APIS</h3>
          </div>

          <div className="flex gap-1.5 flex-wrap mb-5">
            <button
              className="px-3 py-1.5 rounded text-[11px] font-semibold tracking-wider transition-all"
              style={{
                background: activeCategory === null ? "rgba(0,255,0,0.1)" : "rgba(255,255,255,0.02)",
                color: activeCategory === null ? "#00ff00" : "rgba(255,255,255,0.4)",
                border: `1px solid ${activeCategory === null ? "rgba(0,255,0,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}
              onClick={() => setActiveCategory(null)}
              data-testid="filter-all"
            >
              All ({allEndpoints.length})
            </button>
            {endpointCounts.map((cat) => (
              <button
                key={cat.id}
                className="px-3 py-1.5 rounded text-[11px] font-semibold tracking-wider transition-all"
                style={{
                  background: activeCategory === cat.id ? "rgba(0,255,0,0.1)" : "rgba(255,255,255,0.02)",
                  color: activeCategory === cat.id ? "#00ff00" : "rgba(255,255,255,0.4)",
                  border: `1px solid ${activeCategory === cat.id ? "rgba(0,255,0,0.2)" : "rgba(255,255,255,0.06)"}`,
                }}
                onClick={() => setActiveCategory(cat.id)}
                data-testid={`filter-${cat.id}`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          {apiCategories
            .filter((cat) => !activeCategory || activeCategory === cat.id)
            .map((cat) => {
              const catEndpoints = filteredEndpoints.filter((e) => e.category === cat.id);
              if (catEndpoints.length === 0) return null;
              const Icon = categoryIcons[cat.id] || Code2;
              return (
                <div key={cat.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-3.5 h-3.5" style={{ color: "rgba(0,255,0,0.5)" }} />
                    <h4 className="text-xs font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>{cat.name.toUpperCase()}</h4>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>{cat.description}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {catEndpoints.map((ep) => (
                      <EndpointCard key={ep.path} endpoint={ep} baseUrl={baseUrl} onTry={handleTry} />
                    ))}
                  </div>
                </div>
              );
            })}
        </section>

        <section id="playground">
          <div className="flex items-center gap-2 mb-4">
            <Terminal className="w-4 h-4" style={{ color: "#00ff00" }} />
            <h3 className="text-sm font-bold tracking-wider" style={{ color: "#ffffff" }}>PLAYGROUND</h3>
          </div>

          {!playgroundEndpoint ? (
            <div
              className="rounded-md p-8 text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <Terminal className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                Select an endpoint above and click "Try it" to test it here.
              </p>
            </div>
          ) : (
            <div
              className="rounded-md overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
            >
              <div
                className="flex items-center gap-3 px-4 py-2.5 border-b flex-wrap"
                style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}
              >
                <span
                  className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
                  style={{ background: playgroundEndpoint.method === "POST" ? "rgba(59,130,246,0.12)" : "rgba(0,255,0,0.12)", color: playgroundEndpoint.method === "POST" ? "#60a5fa" : "#00ff00" }}
                >
                  {playgroundEndpoint.method}
                </span>
                <code className="text-xs font-mono" style={{ color: "#ffffff" }}>{playgroundEndpoint.path}</code>
                {playgroundEndpoint.provider && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}>
                    {playgroundEndpoint.provider}
                  </span>
                )}
                <button
                  className="ml-auto text-[10px] flex items-center gap-1"
                  style={{ color: "rgba(255,255,255,0.3)" }}
                  onClick={() => { setPlaygroundEndpoint(null); setResult(null); setSearchResults(null); }}
                >
                  Clear
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {getInputLabel().toUpperCase()}
                  </label>
                  <input
                    type="text"
                    data-testid="input-try-url"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={getInputPlaceholder()}
                    className="w-full h-10 rounded-md px-3 text-sm focus:outline-none font-mono"
                    style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)", color: "#ffffff", caretColor: "#00ff00" }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,255,0,0.25)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleExecute(); }}
                  />
                </div>

                <div
                  className="rounded-md px-3 py-2 flex items-center gap-2"
                  style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)" }}
                  data-testid="display-full-url"
                >
                  <Terminal className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(0,255,0,0.4)" }} />
                  <code className="text-[10px] font-mono break-all flex-1 truncate" style={{ color: "rgba(0,255,0,0.5)" }}>
                    {getFullUrl()}
                  </code>
                  <CopyButton text={getFullUrl()} />
                </div>

                <Button onClick={handleExecute} disabled={loading || !inputValue.trim()} data-testid="button-try-execute" className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Execute
                </Button>
              </div>

              {loading && (
                <div className="flex items-center justify-center py-8 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#00ff00" }} />
                  <span className="ml-2 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Fetching response...</span>
                </div>
              )}

              {searchResults && searchResults.length > 0 && (
                <div className="p-5 border-t space-y-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="text-[11px] font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {searchResults.length} results
                  </div>
                  <div className="grid gap-2" data-testid="container-search-results">
                    {searchResults.map((r) => (
                      <SearchResultCard key={r.id} result={r} baseUrl={baseUrl} />
                    ))}
                  </div>
                </div>
              )}

              {result && !searchResults && (
                <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div className="relative">
                    <div className="absolute top-2 right-2" style={{ zIndex: 2 }}>
                      <CopyButton text={result} />
                    </div>
                    <pre className="p-4 text-xs font-mono overflow-auto max-h-80" style={{ background: "rgba(0,0,0,0.4)", color: "#00ff00" }}>
                      {result}
                    </pre>
                  </div>
                </div>
              )}

              {result && searchResults && searchResults.length > 0 && (
                <div className="px-5 pb-4">
                  <details>
                    <summary
                      className="cursor-pointer text-[11px] font-mono px-3 py-2 rounded-md flex items-center gap-2"
                      style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                      data-testid="button-raw-json"
                    >
                      <Code2 className="w-3 h-3" /> Raw JSON
                    </summary>
                    <div className="relative mt-2 rounded-md overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="absolute top-2 right-2" style={{ zIndex: 2 }}><CopyButton text={result} /></div>
                      <pre className="p-4 text-xs font-mono overflow-auto max-h-80" style={{ background: "rgba(0,0,0,0.4)", color: "#00ff00" }}>{result}</pre>
                    </div>
                  </details>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <footer className="border-t mt-auto" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[10px] tracking-widest" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            <span style={{ color: "rgba(0,255,0,0.3)" }}>WOLF</span><span style={{ color: "rgba(255,255,255,0.2)" }}>APIS</span>
          </p>
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
            {allEndpoints.length} endpoints across {apiCategories.length} categories
          </p>
        </div>
      </footer>
    </div>
  );
}
