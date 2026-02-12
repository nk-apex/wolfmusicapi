import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { endpointInfo, type SearchResult, type EndpointInfo } from "@shared/schema";

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  return (
    <Button
      size="icon"
      variant="ghost"
      data-testid="button-theme-toggle"
      onClick={() => {
        setDark(!dark);
        document.documentElement.classList.toggle("dark");
      }}
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      )}
    </Button>
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
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
    </Button>
  );
}

function EndpointCard({ endpoint, baseUrl }: { endpoint: EndpointInfo; baseUrl: string }) {
  const exampleUrl =
    endpoint.path === "/api/search"
      ? `${baseUrl}${endpoint.path}?q=Alan+Walker+Faded`
      : `${baseUrl}${endpoint.path}?url=https://youtube.com/watch?v=60ItHLz5WEA`;

  return (
    <Card data-testid={`card-endpoint-${endpoint.path}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="font-mono text-xs">
            {endpoint.method}
          </Badge>
          <code className="text-sm font-mono text-foreground break-all">{endpoint.path}</code>
          {endpoint.format !== "json" && (
            <Badge variant="outline" className="text-xs ml-auto">
              {endpoint.format.toUpperCase()}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{endpoint.description}</p>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Parameters:</p>
          {endpoint.params.map((p) => (
            <div key={p.name} className="flex items-center gap-2 text-xs">
              <code className="font-mono bg-muted px-1.5 py-0.5 rounded-md">{p.name}</code>
              <span className="text-muted-foreground">{p.type}</span>
              {p.required && (
                <Badge variant="destructive" className="text-[10px] px-1 py-0">
                  required
                </Badge>
              )}
              <span className="text-muted-foreground">- {p.description}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-md p-2">
          <code className="text-xs font-mono text-muted-foreground break-all flex-1">{exampleUrl}</code>
          <CopyButton text={exampleUrl} />
        </div>
      </CardContent>
    </Card>
  );
}

function SearchResultCard({ result, baseUrl }: { result: SearchResult; baseUrl: string }) {
  const mp3Url = `${baseUrl}/download/mp3?url=https://youtube.com/watch?v=${result.id}`;
  const mp4Url = `${baseUrl}/download/mp4?url=https://youtube.com/watch?v=${result.id}`;

  return (
    <Card data-testid={`card-result-${result.id}`} className="hover-elevate transition-all duration-200">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className="w-24 h-16 rounded-md bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(https://img.youtube.com/vi/${result.id}/mqdefault.jpg)` }}
          />
          <div className="flex-1 min-w-0 space-y-1">
            <h3 className="text-sm font-medium leading-tight line-clamp-2" data-testid={`text-title-${result.id}`}>
              {result.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
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
              <Button size="sm" variant="default" asChild data-testid={`button-mp3-${result.id}`}>
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
              <Button
                size="sm"
                variant="outline"
                asChild
                data-testid={`button-play-${result.id}`}
              >
                <a
                  href={`https://youtube.com/watch?v=${result.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Watch
                </a>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [tryUrl, setTryUrl] = useState("https://youtube.com/watch?v=60ItHLz5WEA");
  const [tryEndpoint, setTryEndpoint] = useState("/download/mp3");
  const [tryResult, setTryResult] = useState<string | null>(null);
  const [tryLoading, setTryLoading] = useState(false);

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-semibold">MediaDL API</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono">
              v1.0
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 text-center space-y-6">
          <Badge variant="secondary" className="text-xs" data-testid="badge-hero">
            <Globe className="w-3 h-3 mr-1" />
            Open API - Free to Use
          </Badge>
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Download Music & Video
            <br />
            <span className="text-primary">via Simple API</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Search, convert and download YouTube content as MP3 or MP4. Multiple endpoints for maximum compatibility.
            Powered by rinodepot.fr scraping.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button asChild data-testid="button-get-started">
              <a href="#endpoints">
                <Code2 className="w-4 h-4 mr-2" />
                View Endpoints
              </a>
            </Button>
            <Button variant="outline" asChild data-testid="button-try-it">
              <a href="#playground">
                <ArrowRight className="w-4 h-4 mr-2" />
                Try It Out
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{downloadEndpoints.length}</p>
              <p className="text-xs text-muted-foreground">Download Endpoints</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">2</p>
              <p className="text-xs text-muted-foreground">Formats (MP3/MP4)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">0</p>
              <p className="text-xs text-muted-foreground">Auth Required</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        <div id="search" className="space-y-6">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">Search Songs</h2>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                data-testid="input-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for songs, artists, or paste a YouTube URL..."
                className="w-full pl-10 pr-4 h-10 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <Button type="submit" data-testid="button-search" disabled={!searchQuery.trim()}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </form>

          {searchLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Searching...</span>
            </div>
          )}

          {searchResults && searchResults.length > 0 && (
            <div className="grid gap-3" data-testid="container-search-results">
              {searchResults.map((result) => (
                <SearchResultCard key={result.id} result={result} baseUrl={baseUrl} />
              ))}
            </div>
          )}

          {searchError && (
            <Card>
              <CardContent className="p-8 text-center">
                <Zap className="w-10 h-10 mx-auto text-destructive mb-3" />
                <p className="text-muted-foreground">Search failed. Please try again.</p>
              </CardContent>
            </Card>
          )}

          {searchResults && searchResults.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Music className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No results found. Try a different search term.</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div id="endpoints" className="space-y-6">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">API Endpoints</h2>
          </div>

          <Tabs defaultValue="download" className="space-y-4">
            <TabsList data-testid="tabs-endpoints">
              <TabsTrigger value="download" data-testid="tab-download">
                <Download className="w-4 h-4 mr-1" />
                Download ({downloadEndpoints.length})
              </TabsTrigger>
              <TabsTrigger value="search" data-testid="tab-search-api">
                <Search className="w-4 h-4 mr-1" />
                Search ({apiEndpoints.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="download" className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {downloadEndpoints.map((ep) => (
                  <EndpointCard key={ep.path} endpoint={ep} baseUrl={baseUrl} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="search" className="space-y-3">
              {apiEndpoints.map((ep) => (
                <EndpointCard key={ep.path} endpoint={ep} baseUrl={baseUrl} />
              ))}
            </TabsContent>
          </Tabs>
        </div>

        <div id="playground" className="space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">API Playground</h2>
          </div>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Endpoint</label>
                  <select
                    data-testid="select-endpoint"
                    value={tryEndpoint}
                    onChange={(e) => setTryEndpoint(e.target.value)}
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {endpointInfo.map((ep) => (
                      <option key={ep.path} value={ep.path}>
                        {ep.method} {ep.path}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {tryEndpoint === "/api/search" ? "Search Query" : "YouTube URL"}
                  </label>
                  <input
                    type="text"
                    data-testid="input-try-url"
                    value={tryUrl}
                    onChange={(e) => setTryUrl(e.target.value)}
                    placeholder={
                      tryEndpoint === "/api/search"
                        ? "Enter search query..."
                        : "https://youtube.com/watch?v=..."
                    }
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleTryEndpoint} disabled={tryLoading} data-testid="button-try-execute">
                  {tryLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                  Execute
                </Button>
                <div className="flex-1 bg-muted/50 rounded-md px-3 py-2">
                  <code className="text-xs font-mono text-muted-foreground break-all">
                    GET {tryEndpoint}?{tryEndpoint === "/api/search" ? "q" : "url"}={tryUrl}
                  </code>
                </div>
              </div>
              {tryResult && (
                <div className="relative">
                  <div className="absolute top-2 right-2">
                    <CopyButton text={tryResult} />
                  </div>
                  <pre className="bg-muted/50 rounded-md p-4 text-xs font-mono overflow-auto max-h-80 text-foreground">
                    {tryResult}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-semibold">Quick Start</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">JavaScript</Badge>
                  Fetch MP3
                </h3>
                <pre className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-auto text-foreground">{`const res = await fetch(
  '${baseUrl}/download/mp3?url=' +
  encodeURIComponent(youtubeUrl)
);
const data = await res.json();
console.log(data.downloadUrl);`}</pre>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">Python</Badge>
                  Search & Download
                </h3>
                <pre className="bg-muted/50 rounded-md p-3 text-xs font-mono overflow-auto text-foreground">{`import requests

results = requests.get(
  '${baseUrl}/api/search',
  params={'q': 'Alan Walker Faded'}
).json()

for item in results['items']:
    print(item['title'], item['id'])`}</pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between gap-2 flex-wrap text-sm text-muted-foreground">
          <p>MediaDL API - Powered by rinodepot.fr scraping</p>
          <div className="flex items-center gap-3">
            <a
              href="https://rinodepot.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Source <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
