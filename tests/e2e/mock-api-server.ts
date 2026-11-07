// Servidor HTTP mínimo que imita a API-Football com as fixtures de tests/fixtures/api-football.
// Executado direto pelo Node (type stripping): `node tests/e2e/mock-api-server.ts`.
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import { join } from "node:path";

const FIXTURES = join(process.cwd(), "tests/fixtures/api-football");
const PORT = Number(process.env.MOCK_PORT ?? 4010);

const load = (name: string): string => readFileSync(join(FIXTURES, `${name}.json`), "utf8");

const LEAGUE_ID = "71"; // liga de pontos corridos
const CUP_ID = "73"; // copa com fase de grupos

function route(path: string, q: URLSearchParams): string | null {
  const league = q.get("league");
  switch (path) {
    case "/leagues":
      return load("leagues-team");
    case "/teams":
      return load("teams-brazil");
    case "/standings":
      return load(league === CUP_ID ? "standings-cup-groups" : "standings-league");
    case "/players/topscorers":
      return load("topscorers");
    case "/players/topassists":
      return load(league === LEAGUE_ID ? "topassists" : "topassists-empty");
    case "/fixtures":
      return load("fixtures-team");
    default:
      return null;
  }
}

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname === "/health") {
    res.writeHead(200).end("ok");
    return;
  }
  const body = route(url.pathname, url.searchParams);
  if (body === null) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ errors: { endpoint: "not mocked" }, response: [] }));
    return;
  }
  res.writeHead(200, {
    "content-type": "application/json",
    "x-ratelimit-requests-remaining": "99",
  });
  res.end(body);
}).listen(PORT, () => console.log(`mock api-football on :${PORT}`));
