import { useState, useRef, useEffect, type MouseEvent } from "react";
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
  Pause,
  Clock,
  User,
  Terminal,
  MessageSquare,
  Image,
  Camera,
  Youtube,
  Facebook,
  Music2,
  AudioLines,
  X,
  ChevronRight,
  Menu,
  Sparkles,
  Wand2,
  Send,
} from "lucide-react";
import { allEndpoints, apiCategories, type ApiEndpoint, type ApiCategory } from "@shared/schema";
import wolfLogo from "../assets/wolf-logo.png";

const categoryIcons: Record<string, typeof MessageSquare> = {
  "ai-chat": MessageSquare,
  "ai-tools": Wand2,
  "ai-image": Image,
  music: Music,
  tiktok: Video,
  instagram: Camera,
  "youtube-dl": Youtube,
  facebook: Facebook,
  spotify: Music2,
  shazam: AudioLines,
  ephoto: Sparkles,
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

function TestPopup({
  endpoint,
  baseUrl,
  onClose,
}: {
  endpoint: ApiEndpoint;
  baseUrl: string;
  onClose: () => void;
}) {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const updateInput = (name: string, value: string) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const getFullUrl = () => {
    if (endpoint.method === "POST") return `${baseUrl}${endpoint.path}`;
    const params = endpoint.params
      .filter((p) => inputs[p.name])
      .map((p) => `${p.name}=${encodeURIComponent(inputs[p.name])}`)
      .join("&");
    return params ? `${baseUrl}${endpoint.path}?${params}` : `${baseUrl}${endpoint.path}`;
  };

  const handleExecute = async () => {
    setLoading(true);
    setResult(null);
    try {
      let res: Response;
      if (endpoint.method === "POST") {
        const body: Record<string, string> = {};
        endpoint.params.forEach((p) => {
          if (inputs[p.name]) body[p.name] = inputs[p.name];
        });
        if (Object.keys(body).length === 0 && endpoint.params.length > 0) {
          body[endpoint.params[0].name] = "Hello!";
        }
        res = await fetch(endpoint.path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        const params = endpoint.params
          .filter((p) => inputs[p.name])
          .map((p) => `${p.name}=${encodeURIComponent(inputs[p.name])}`)
          .join("&");
        res = await fetch(`${endpoint.path}${params ? `?${params}` : ""}`);
      }
      const data = await res.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResult(JSON.stringify({ error: err.message }, null, 2));
    }
    setLoading(false);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 200, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      data-testid="popup-test-overlay"
    >
      <div
        className="w-full max-w-2xl rounded-xl overflow-hidden"
        style={{
          background: "#0d0d0d",
          border: "1px solid rgba(0,255,0,0.15)",
          boxShadow: "0 0 60px rgba(0,255,0,0.08)",
          maxHeight: "90vh",
        }}
        data-testid="popup-test-content"
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" style={{ color: "#00ff00" }} />
            <span className="text-sm font-bold tracking-wider" style={{ color: "#ffffff" }}>
              API TESTER
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            data-testid="button-close-popup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 52px)" }}>
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
                style={{
                  background: endpoint.method === "POST" ? "rgba(59,130,246,0.12)" : "rgba(0,255,0,0.12)",
                  color: endpoint.method === "POST" ? "#60a5fa" : "#00ff00",
                }}
              >
                {endpoint.method}
              </span>
              <code className="text-sm font-mono" style={{ color: "#ffffff" }}>
                {endpoint.path}
              </code>
              {endpoint.provider && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded ml-auto"
                  style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}
                >
                  {endpoint.provider}
                </span>
              )}
            </div>

            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
              {endpoint.description}
            </p>

            <div
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-mono"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span style={{ color: "rgba(255,255,255,0.3)" }} className="flex-1 truncate" data-testid="text-full-url">
                {getFullUrl()}
              </span>
              <CopyButton text={getFullUrl()} />
            </div>

            {endpoint.params.length > 0 && (
              <div className="space-y-3">
                <span className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                  PARAMETERS
                </span>
                {endpoint.params.map((p) => (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code
                        className="font-mono px-1.5 py-0.5 rounded text-[11px]"
                        style={{ background: "rgba(0,255,0,0.06)", color: "#00ff00" }}
                      >
                        {p.name}
                      </code>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                        {p.type}
                      </span>
                      {p.required && (
                        <span className="text-[9px] font-bold" style={{ color: "#ff4444" }}>
                          REQ
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                        {p.description}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={inputs[p.name] || ""}
                      onChange={(e) => updateInput(p.name, e.target.value)}
                      placeholder={p.description}
                      className="w-full px-3 py-2 rounded-md text-sm font-mono outline-none transition-colors"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#ffffff",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,255,0,0.3)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                      data-testid={`input-${p.name}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleExecute();
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleExecute}
              disabled={loading}
              className="w-full"
              data-testid="button-execute"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Executing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" /> Execute Request
                </>
              )}
            </Button>

            {result && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                    RESPONSE
                  </span>
                  <CopyButton text={result} />
                </div>
                <pre
                  className="text-xs font-mono p-4 rounded-md overflow-auto"
                  style={{
                    background: "rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "#00ff00",
                    maxHeight: "300px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                  data-testid="text-response"
                >
                  {result}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EndpointCard({
  endpoint,
  baseUrl,
  onTry,
}: {
  endpoint: ApiEndpoint;
  baseUrl: string;
  onTry: (ep: ApiEndpoint) => void;
}) {
  return (
    <div
      data-testid={`card-endpoint-${endpoint.path}`}
      className="rounded-md p-4 space-y-3 transition-all cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(0,255,0,0.15)";
        e.currentTarget.style.background = "rgba(0,255,0,0.02)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
        e.currentTarget.style.background = "rgba(255,255,255,0.02)";
      }}
      onClick={() => onTry(endpoint)}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="font-mono text-[10px] font-bold px-2 py-0.5 rounded"
          style={{
            background: endpoint.method === "POST" ? "rgba(59,130,246,0.12)" : "rgba(0,255,0,0.12)",
            color: endpoint.method === "POST" ? "#60a5fa" : "#00ff00",
          }}
        >
          {endpoint.method}
        </span>
        <code className="text-sm font-mono" style={{ color: "#ffffff" }}>
          {endpoint.path}
        </code>
        {endpoint.provider && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded ml-auto"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)" }}
          >
            {endpoint.provider}
          </span>
        )}
      </div>
      <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
        {endpoint.description}
      </p>
      <div className="flex items-center gap-2 text-[10px]" style={{ color: "rgba(0,255,0,0.6)" }}>
        <Play className="w-3 h-3" />
        <span>Click to test</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("ai-chat");
  const [testEndpoint, setTestEndpoint] = useState<ApiEndpoint | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const handleTry = (ep: ApiEndpoint) => {
    setTestEndpoint(ep);
  };

  const filteredEndpoints = allEndpoints.filter((e) => e.category === activeCategory);

  const activeCategoryData = apiCategories.find((c) => c.id === activeCategory);

  const endpointCounts = apiCategories.map((cat) => ({
    ...cat,
    count: allEndpoints.filter((e) => e.category === cat.id).length,
  }));

  return (
    <div className="min-h-screen flex" style={{ background: "#0a0a0a" }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 lg:hidden"
          style={{ zIndex: 40, background: "rgba(0,0,0,0.6)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen flex-shrink-0 overflow-y-auto transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          width: "260px",
          zIndex: 45,
          background: "#080808",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}
        data-testid="sidebar"
      >
        <div className="p-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <img
            src={wolfLogo}
            alt="WolfApis Logo"
            className="w-9 h-9 rounded-md object-cover"
            style={{ border: "1px solid rgba(0,255,0,0.2)" }}
          />
          <div>
            <h1
              className="text-sm font-bold tracking-widest leading-none"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span style={{ color: "#00ff00" }}>WOLF</span>
              <span style={{ color: "#ffffff" }}>APIS</span>
            </h1>
            <p className="text-[9px] tracking-[0.12em] mt-0.5" style={{ color: "rgba(0,255,0,0.35)" }}>
              v3.0 • {allEndpoints.length} ENDPOINTS
            </p>
          </div>
          <button
            className="lg:hidden ml-auto p-1.5 rounded"
            onClick={() => setSidebarOpen(false)}
            style={{ color: "rgba(255,255,255,0.4)" }}
            data-testid="button-close-sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="p-3 space-y-0.5" data-testid="nav-categories">
          {endpointCounts.map((cat) => {
            const Icon = categoryIcons[cat.id] || Code2;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all"
                style={{
                  background: isActive ? "rgba(0,255,0,0.08)" : "transparent",
                  color: isActive ? "#00ff00" : "rgba(255,255,255,0.5)",
                  border: isActive ? "1px solid rgba(0,255,0,0.15)" : "1px solid transparent",
                }}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSidebarOpen(false);
                }}
                data-testid={`nav-${cat.id}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold tracking-wide block truncate">{cat.name}</span>
                  <span
                    className="text-[9px] block mt-0.5 truncate"
                    style={{ color: isActive ? "rgba(0,255,0,0.5)" : "rgba(255,255,255,0.25)" }}
                  >
                    {cat.description}
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold flex-shrink-0 px-1.5 py-0.5 rounded"
                  style={{
                    background: isActive ? "rgba(0,255,0,0.15)" : "rgba(255,255,255,0.04)",
                    color: isActive ? "#00ff00" : "rgba(255,255,255,0.3)",
                  }}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#00ff00", boxShadow: "0 0 6px #00ff00" }}
              />
              <span className="text-[10px] font-semibold tracking-wider" style={{ color: "#00ff00" }}>
                ALL SYSTEMS LIVE
              </span>
            </div>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
              APIs by Silent Wolf
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
              A tech explorer
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header
          className="sticky top-0"
          style={{
            zIndex: 30,
            background: "rgba(10,10,10,0.92)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="px-5 py-3 flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-md"
              onClick={() => setSidebarOpen(true)}
              style={{ color: "rgba(255,255,255,0.5)" }}
              data-testid="button-open-sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 flex-1">
              {activeCategoryData && (
                <>
                  {(() => {
                    const Icon = categoryIcons[activeCategoryData.id] || Code2;
                    return <Icon className="w-4 h-4" style={{ color: "#00ff00" }} />;
                  })()}
                  <h2 className="text-sm font-bold tracking-wider" style={{ color: "#ffffff" }}>
                    {activeCategoryData.name.toUpperCase()}
                  </h2>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{ background: "rgba(0,255,0,0.06)", color: "rgba(0,255,0,0.6)" }}
                  >
                    {filteredEndpoints.length} endpoint{filteredEndpoints.length !== 1 ? "s" : ""}
                  </span>
                </>
              )}
            </div>

            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ background: "rgba(0,255,0,0.05)", border: "1px solid rgba(0,255,0,0.12)" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#00ff00", boxShadow: "0 0 6px #00ff00" }}
              />
              <span className="text-[10px] font-semibold tracking-wider" style={{ color: "#00ff00" }}>
                LIVE
              </span>
            </div>
          </div>
        </header>

        {activeCategory === "ai-chat" && (
          <section className="px-5 pt-8 pb-4">
            <div className="relative overflow-hidden rounded-xl p-6 sm:p-8" style={{
              background: "linear-gradient(135deg, rgba(0,255,0,0.04), rgba(0,0,0,0.4))",
              border: "1px solid rgba(0,255,0,0.1)",
            }}>
              <div className="absolute top-0 right-0 w-40 h-40 opacity-10" style={{
                background: "radial-gradient(circle, rgba(0,255,0,0.5), transparent 70%)",
              }} />
              <div className="relative space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: "#00ff00" }} />
                  <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: "#00ff00" }}>
                    MULTI-PROVIDER AI HUB
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: "'Orbitron', sans-serif", color: "#ffffff" }}>
                  {allEndpoints.filter(e => e.category === "ai-chat").length}+ AI Chat Models
                </h3>
                <p className="text-sm max-w-lg" style={{ color: "rgba(255,255,255,0.4)" }}>
                  GPT-4o, Claude, Mistral, Gemini, DeepSeek, LLaMA, Mixtral, CodeLlama, and more.
                  All through a single unified API. Click any endpoint below to test it.
                </p>
              </div>
            </div>
          </section>
        )}

        <section className="px-5 py-5">
          {activeCategoryData && (
            <div className="mb-4">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                {activeCategoryData.description}
              </p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            {filteredEndpoints.map((ep) => (
              <EndpointCard key={ep.path} endpoint={ep} baseUrl={baseUrl} onTry={handleTry} />
            ))}
          </div>

          {filteredEndpoints.length === 0 && (
            <div className="text-center py-16">
              <Code2 className="w-8 h-8 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.1)" }} />
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
                No endpoints in this category yet.
              </p>
            </div>
          )}
        </section>
      </main>

      {testEndpoint && (
        <TestPopup
          endpoint={testEndpoint}
          baseUrl={baseUrl}
          onClose={() => setTestEndpoint(null)}
        />
      )}
    </div>
  );
}
