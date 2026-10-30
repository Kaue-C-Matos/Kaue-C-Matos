// KAUE-C-MATOS // gerador de SVGs do perfil (tema "lado sombrio": fundo escuro, sabre vermelho)
//
// Uso:
//   node scripts/generate.mjs static  assets   -> peças fixas (header, títulos, stack, contatos, footer)
//   node scripts/generate.mjs dynamic dist     -> peças com dados do GitHub (painel, linguagens, atividade)
//
// Variáveis de ambiente:
//   GITHUB_TOKEN    token para a API GraphQL (no Actions: secrets.GITHUB_TOKEN já basta)
//   FALLBACK_TOKEN  token reserva, usado se o primeiro falhar
//   GH_USER         usuário (padrão: Kaue-C-Matos)
//   MOCK_FILE       JSON com a resposta da GraphQL, para testar sem rede

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const USER = process.env.GH_USER || "Kaue-C-Matos";

// ───────────────────────── CONFIG (edite à vontade) ─────────────────────────
const PROFILE = {
  name: "KAUÊ C. MATOS",
  role: "DESENVOLVEDOR",
  tagline: "Junte-se ao lado sombrio do código.",
};

// Deixe vazio para esconder a seção no README (ver README.md)
const STACK = [];
const CONTACTS = []; // ex.: { id: "linkedin", label: "LINKEDIN", url: "https://..." }

// ───────────────────────── VISUAL ─────────────────────────
const C = {
  bg: "#050506",
  panel: "#0b0b0d",
  metal: "#2b2b31",
  metal2: "#4a4a52",
  silver: "#c9c9d1",
  silver2: "#9a9aa4",
  red: "#ff1a1a",
  red2: "#c8000f",
  core: "#fff1f1",
};

const MONO = "'KMono','Share Tech Mono','Consolas',monospace";
const HEAD = "'KOrb','Orbitron','Eurostile','Arial Black',sans-serif";

function font(pkg, file) {
  const candidates = [
    join(HERE, "node_modules", "@fontsource", pkg, "files", file),
    join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file),
    process.env.FONT_DIR ? join(process.env.FONT_DIR, "node_modules", "@fontsource", pkg, "files", file) : "",
  ].filter(Boolean);
  const p = candidates.find((c) => existsSync(c));
  return p ? readFileSync(p).toString("base64") : null;
}
let FONT_CSS = null;
function fontCSS() {
  if (FONT_CSS !== null) return FONT_CSS;
  const m = font("share-tech-mono", "share-tech-mono-latin-400-normal.woff2");
  const o = font("orbitron", "orbitron-latin-700-normal.woff2");
  FONT_CSS = (m ? `@font-face{font-family:'KMono';src:url(data:font/woff2;base64,${m}) format('woff2');}` : "")
    + (o ? `@font-face{font-family:'KOrb';font-weight:700;src:url(data:font/woff2;base64,${o}) format('woff2');}` : "");
  if (!FONT_CSS) console.warn("! fontes não encontradas — usando fallback do sistema");
  return FONT_CSS;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function rng(seed) {
  let s = 0;
  for (const ch of String(seed)) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function svg(w, h, body, title = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"${title ? ` aria-label="${esc(title)}"` : ""}>
<style>${fontCSS()}
.m{font-family:${MONO};}
.h{font-family:${HEAD};font-weight:700;}
.hum{animation:hum .11s infinite alternate;}
@keyframes hum{from{opacity:.82}to{opacity:1}}
.breathe{animation:breathe 4.2s ease-in-out infinite;}
@keyframes breathe{0%,100%{opacity:.35}45%{opacity:.9}55%{opacity:.9}}
.tw{animation:tw 3s ease-in-out infinite;}
@keyframes tw{50%{opacity:.15}}
.led{animation:led 1.8s ease-in-out infinite;}
@keyframes led{50%{opacity:.35}}
.blink{animation:blink 1s steps(1) infinite;}
@keyframes blink{50%{opacity:0}}
</style>
<defs>
  <filter id="glow" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="5"/></filter>
  <filter id="glow2" x="-50%" y="-300%" width="200%" height="700%"><feGaussianBlur stdDeviation="12"/></filter>
  <filter id="tglow" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6d6d76"/><stop offset=".35" stop-color="#d9d9e0"/><stop offset=".55" stop-color="#55555d"/><stop offset="1" stop-color="#1c1c20"/></linearGradient>
  <linearGradient id="silverText" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#c9c9d1"/><stop offset="1" stop-color="#76767f"/></linearGradient>
  <radialGradient id="nebula" cx=".78" cy=".45" r=".6"><stop offset="0" stop-color="${C.red2}" stop-opacity=".35"/><stop offset=".5" stop-color="${C.red2}" stop-opacity=".08"/><stop offset="1" stop-color="${C.red2}" stop-opacity="0"/></radialGradient>
  <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".25"/></pattern>
</defs>
${body}
</svg>`;
}

function stars(W, H, n, seed, opacity = 1) {
  const r = rng(seed);
  let out = "";
  for (let i = 0; i < n; i++) {
    const x = (r() * W).toFixed(1), y = (r() * H).toFixed(1), s = (r() * 1.3 + 0.3).toFixed(2);
    const tw = r() < 0.3 ? ` class="tw" style="animation-delay:${(r() * 3).toFixed(2)}s"` : "";
    out += `<circle cx="${x}" cy="${y}" r="${s}" fill="#fff" opacity="${(opacity * (0.3 + r() * 0.7)).toFixed(2)}"${tw}/>`;
  }
  return out;
}

// cabo de sabre genérico (design próprio) + lâmina que acende
function saber(x, y, len, { thick = 8, delay = 0.3, dur = 0.7, hilt = 78, glowSize = 1 } = {}) {
  const hy = y - thick * 1.1;
  const hh = thick * 2.2;
  let grip = "";
  for (let g = 0; g < 6; g++) grip += `<rect x="${x + 16 + g * 6}" y="${hy + 1}" width="3" height="${hh - 2}" fill="#0c0c0e"/>`;
  const bx = x + hilt; // início da lâmina
  const anim = (attr) => `<animate attributeName="${attr}" values="0;0;${len}" keyTimes="0;${(delay / (delay + dur)).toFixed(3)};1" dur="${(delay + dur).toFixed(2)}s" fill="freeze"/>`;
  return `<g>
  <g class="hum">
    <rect x="${bx}" y="${y - thick * 1.6}" width="${len}" height="${thick * 3.2}" rx="${thick * 1.6}" fill="${C.red}" opacity="${0.55 * glowSize}" filter="url(#glow2)">${anim("width")}</rect>
    <rect x="${bx}" y="${y - thick * 0.9}" width="${len}" height="${thick * 1.8}" rx="${thick * 0.9}" fill="${C.red}" filter="url(#glow)">${anim("width")}</rect>
  </g>
  <rect x="${bx}" y="${y - thick * 0.42}" width="${len}" height="${thick * 0.84}" rx="${thick * 0.42}" fill="${C.core}">${anim("width")}</rect>
  <rect x="${x}" y="${hy}" width="${hilt}" height="${hh}" rx="3" fill="url(#metal)"/>
  ${grip}
  <rect x="${x + hilt - 16}" y="${hy - 3}" width="16" height="${hh + 6}" rx="2" fill="url(#metal)" stroke="#111" stroke-width="1"/>
  <rect x="${x + 4}" y="${hy - 2}" width="8" height="${hh + 4}" rx="2" fill="#1a1a1e"/>
  <circle cx="${x + 58}" cy="${y}" r="${Math.max(2, thick * 0.32)}" fill="${C.red}" class="led"/>
</g>`;
}

// ───────────────────────── PEÇAS FIXAS ─────────────────────────
function header() {
  const W = 1000, H = 340;
  const body = `
<rect width="${W}" height="${H}" fill="${C.bg}"/>
<rect width="${W}" height="${H}" fill="url(#nebula)" class="breathe"/>
${stars(W, H, 140, "hdr")}
<!-- cantos de HUD -->
<path d="M20 44V20H44M${W - 44} 20H${W - 20}V44M20 ${H - 44}V${H - 20}H44M${W - 44} ${H - 20}H${W - 20}V${H - 44}" fill="none" stroke="${C.red2}" stroke-width="2"/>
<text x="${W / 2}" y="118" class="h" font-size="58" fill="url(#silverText)" text-anchor="middle" letter-spacing="8">${esc(PROFILE.name)}</text>
<text x="${W / 2}" y="160" class="h" font-size="18" fill="${C.red}" text-anchor="middle" letter-spacing="10" filter="url(#tglow)">${esc(PROFILE.role)}</text>
${saber(90, 218, 742, { thick: 7, delay: 0.5, dur: 0.6 })}
<text x="${W / 2}" y="286" class="m" font-size="17" fill="${C.silver}" text-anchor="middle" letter-spacing="2">&gt; ${esc(PROFILE.tagline)}<tspan class="blink" fill="${C.red}"> █</tspan></text>
<text x="${W - 34}" y="${H - 30}" class="m" font-size="12" fill="${C.silver2}" text-anchor="end" letter-spacing="2">GITHUB.COM/${USER.toUpperCase()}</text>
<rect width="${W}" height="${H}" fill="url(#scan)"/>`;
  return svg(W, H, body, `${PROFILE.name} — ${PROFILE.role}`);
}

// linha de varredura de HUD com um pulso vermelho correndo
function scanner(x, y, len, seed = 0) {
  let ticks = "";
  for (let t = 0; t <= len; t += 16) ticks += `<rect x="${(x + t).toFixed(1)}" y="${y - (t % 64 === 0 ? 6 : 3)}" width="1.5" height="${t % 64 === 0 ? 12 : 6}" fill="${C.metal2}"/>`;
  const id = `pg${seed}`;
  return `<defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${C.red}" stop-opacity="0"/><stop offset=".8" stop-color="${C.red}"/><stop offset="1" stop-color="${C.core}"/></linearGradient></defs>
<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="${C.metal2}" stroke-width="1.5"/>
${ticks}
<clipPath id="c${id}"><rect x="${x}" y="${y - 12}" width="${len - 7}" height="24"/></clipPath>
<g clip-path="url(#c${id})">
<rect x="${x}" y="${y - 2}" width="120" height="4" rx="2" fill="url(#${id})" filter="url(#tglow)">
  <animate attributeName="x" values="${x - 120};${x + len - 7}" dur="3.2s" repeatCount="indefinite"/>
</rect>
</g>
<polygon points="${x + len},${y - 6} ${x + len + 6},${y} ${x + len},${y + 6} ${x + len - 6},${y}" fill="${C.red}" class="led"/>`;
}

function sectionTitle(text, sub = "") {
  const W = 1000, H = 60;
  const tw = text.length * (24 * 0.76 + 4);
  const sx = 20 + tw + 16, len = W - sx - 40 - (sub ? sub.length * (13 * 0.54 + 2) + 24 : 0);
  const body = `
<text x="20" y="40" class="h" font-size="24" fill="${C.silver}" letter-spacing="4">${esc(text)}</text>
${len > 60 ? scanner(sx, 32, len, text.length) : ""}
${sub ? `<text x="${W - 16}" y="38" class="m" font-size="13" fill="${C.silver2}" text-anchor="end" letter-spacing="2">${esc(sub)}</text>` : ""}`;
  return svg(W, H, body, text);
}

function stack() {
  const cols = 6, cw = 152, ch = 54, gap = 12, W = 1000;
  const rows = Math.ceil(STACK.length / cols);
  const H = rows * ch + (rows - 1) * gap + 10;
  const ox = (W - (cols * cw + (cols - 1) * gap)) / 2;
  let body = "";
  STACK.forEach((s, i) => {
    const x = ox + (i % cols) * (cw + gap), y = 5 + Math.floor(i / cols) * (ch + gap);
    body += `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="6" fill="${C.panel}" stroke="${C.metal2}" stroke-width="1.2"/>
<rect x="${x}" y="${y + ch - 3}" width="${cw}" height="3" rx="1.5" fill="${C.red}" class="hum" filter="url(#tglow)"/>
<circle cx="${x + cw - 14}" cy="${y + 14}" r="3.5" fill="${C.red}" class="led" style="animation-delay:${(i * 0.15).toFixed(2)}s"/>
<text x="${x + cw / 2}" y="${y + 34}" class="h" font-size="${s.length > 9 ? 13 : 15}" fill="${C.silver}" text-anchor="middle" letter-spacing="2">${esc(s)}</text>`;
  });
  return svg(W, H, body, "Stack");
}

function button(label, i) {
  const W = 230, H = 52;
  const body = `
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="8" fill="${C.panel}" stroke="${C.metal2}" stroke-width="1.5"/>
<rect x="14" y="${H - 9}" width="${W - 28}" height="3" rx="1.5" fill="${C.red}" class="hum" filter="url(#tglow)"/>
<circle cx="24" cy="${H / 2 - 3}" r="4" fill="${C.red}" class="led" style="animation-delay:${i * 0.4}s"/>
<text x="40" y="${H / 2 + 3}" class="h" font-size="16" fill="${C.silver}" letter-spacing="3">${esc(label)}</text>
<text x="${W - 16}" y="${H / 2 + 3}" class="m" font-size="16" fill="${C.red}" text-anchor="end">&gt;</text>`;
  return svg(W, H, body, label);
}

// caça estelar de design próprio, visto de lado: casco claro "gasto", faixas vermelhas, motores acesos
function ship() {
  const hull = "url(#hull)", line = "#8c877d", grime = "#5f5a52";
  let greeb = "";
  [[30, -4, 6, 3], [14, 3, 8, 3], [-6, -6, 5, 4], [-28, 4, 10, 3], [-46, -7, 7, 3], [-52, 3, 4, 5]].forEach(([x, y, w, h]) =>
    greeb += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#7d786f"/>`);
  return `<g>
  <defs>
    <linearGradient id="hull" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1ede4"/><stop offset=".5" stop-color="#cfc9bd"/><stop offset="1" stop-color="#8e897f"/></linearGradient>
    <linearGradient id="trail" x1="0" x2="1"><stop offset="0" stop-color="#ff7a1a" stop-opacity="0"/><stop offset="1" stop-color="#ffb347" stop-opacity=".9"/></linearGradient>
  </defs>
  <!-- rastros dos motores -->
  <rect x="-260" y="-4" width="148" height="8" rx="4" fill="url(#trail)" class="hum"/>
  <rect x="-210" y="24" width="120" height="6" rx="3" fill="url(#trail)" class="hum"/>
  <!-- asa (atrás do casco) -->
  <polygon points="-2,7 -34,34 -78,38 -66,9" fill="#bdb7ab" stroke="${line}" stroke-width="1"/>
  <polygon points="-30,30 -74,34 -72,29 -26,26" fill="${C.red2}"/>
  <line x1="-20" y1="14" x2="-52" y2="34" stroke="${line}" stroke-width=".8"/>
  <!-- motor da asa -->
  <rect x="-92" y="20" width="26" height="14" rx="3" fill="#a7a195" stroke="#6f6a62"/>
  <rect x="-98" y="22" width="6" height="10" fill="#34343a"/>
  <ellipse cx="-104" cy="27" rx="9" ry="5" fill="#ffb347" filter="url(#glow)" class="hum"/>
  <ellipse cx="-101" cy="27" rx="4" ry="2.5" fill="#fff3c4"/>
  <!-- canhão sob o nariz -->
  <rect x="34" y="10" width="58" height="3" fill="#55595f"/>
  <rect x="88" y="9" width="6" height="5" fill="#3a3d42"/>
  <!-- deriva traseira -->
  <polygon points="-40,-12 -60,-34 -76,-34 -70,-12" fill="${hull}" stroke="${line}" stroke-width="1"/>
  <polygon points="-58,-31 -76,-31 -75,-34 -60,-34" fill="${C.red}"/>
  <!-- casco -->
  <path d="M104,0 L62,-8 L-8,-13 L-72,-13 L-82,-8 L-82,8 L-72,13 L-8,13 L62,8 Z" fill="${hull}" stroke="#6f6a62" stroke-width="1.2"/>
  <polygon points="58,-4 -64,-9 -64,-5 58,-1" fill="${C.red2}"/>
  <line x1="20" y1="-11" x2="20" y2="11" stroke="${line}" stroke-width=".8"/>
  <line x1="-22" y1="-13" x2="-22" y2="13" stroke="${line}" stroke-width=".8"/>
  <line x1="-50" y1="-13" x2="-50" y2="13" stroke="${line}" stroke-width=".8"/>
  <line x1="62" y1="3" x2="-72" y2="6" stroke="${line}" stroke-width=".6"/>
  ${greeb}
  <circle cx="-36" cy="7" r="2.2" fill="#6c675f"/><circle cx="4" cy="7" r="1.6" fill="#6c675f"/>
  <!-- sujeira / desgaste -->
  <ellipse cx="-30" cy="-2" rx="16" ry="5" fill="${grime}" opacity=".18"/>
  <ellipse cx="40" cy="5" rx="12" ry="3" fill="${grime}" opacity=".15"/>
  <ellipse cx="-64" cy="0" rx="8" ry="9" fill="${grime}" opacity=".2"/>
  <!-- cabine -->
  <path d="M50,-7 L30,-17 L8,-17 L2,-11 L40,-7 Z" fill="#191c21" stroke="#55595f" stroke-width="1"/>
  <line x1="24" y1="-16" x2="22" y2="-8" stroke="#55595f" stroke-width="1"/>
  <line x1="12" y1="-16" x2="11" y2="-9" stroke="#55595f" stroke-width="1"/>
  <path d="M34,-14 L42,-9" stroke="#9fb3c8" stroke-width="1.2" opacity=".7"/>
  <!-- motor principal -->
  <rect x="-104" y="-11" width="26" height="22" rx="3" fill="#a7a195" stroke="#6f6a62"/>
  <line x1="-96" y1="-11" x2="-96" y2="11" stroke="#6f6a62"/><line x1="-88" y1="-11" x2="-88" y2="11" stroke="#6f6a62"/>
  <rect x="-110" y="-8" width="6" height="16" fill="#34343a"/>
  <ellipse cx="-118" cy="0" rx="13" ry="8" fill="#ffb347" filter="url(#glow)" class="hum"/>
  <ellipse cx="-114" cy="0" rx="6" ry="4" fill="#fff3c4"/>
  <circle cx="-74" cy="-31" r="1.8" fill="${C.red}" class="led"/>
</g>`;
}

function footer() {
  const W = 1000, H = 140, y = 56;
  const body = `
${stars(W, H, 60, "ftr", 0.7)}
<g transform="translate(${W / 2} ${y})">
  <animateTransform attributeName="transform" type="translate" values="-160 ${y};${W + 300} ${y}" dur="8s" repeatCount="indefinite"/>
  <g transform="scale(1.3)">${ship()}</g>
</g>
<line x1="80" y1="110" x2="${W - 80}" y2="110" stroke="${C.metal}" stroke-width="1"/>
<text x="${W / 2}" y="130" class="m" font-size="14" fill="${C.silver2}" text-anchor="middle" letter-spacing="4">FIM DA TRANSMISSÃO</text>`;
  return svg(W, H, body, "Fim da transmissão");
}

// ───────────────────────── DADOS ─────────────────────────
const QUERY = `query($login:String!){
  user(login:$login){
    repositories(ownerAffiliations:OWNER,isFork:false,first:100,orderBy:{field:PUSHED_AT,direction:DESC}){
      totalCount
      nodes{ stargazerCount languages(first:10,orderBy:{field:SIZE,direction:DESC}){ edges{ size node{ name } } } }
    }
    contributionsCollection{
      totalCommitContributions totalPullRequestContributions restrictedContributionsCount
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } }
    }
  }
}`;

async function fetchData() {
  if (process.env.MOCK_FILE) return JSON.parse(readFileSync(process.env.MOCK_FILE, "utf8")).data.user;
  const tokens = [...new Set([process.env.GITHUB_TOKEN, process.env.FALLBACK_TOKEN].filter(Boolean))];
  if (!tokens.length) throw new Error("GITHUB_TOKEN não definido");
  for (let attempt = 1; attempt <= 4; attempt++) {
    const token = tokens[(attempt - 1) % tokens.length];
    try {
      const r = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json", "User-Agent": "kaue-profile" },
        body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
      });
      const j = await r.json();
      if (!r.ok || j.errors) throw new Error(JSON.stringify(j.errors || j));
      return j.data.user;
    } catch (e) {
      console.warn(`tentativa ${attempt} falhou: ${e.message}`);
      if (attempt === 4) throw e;
      await new Promise((res) => setTimeout(res, attempt * 5000));
    }
  }
}

function crunch(u) {
  const cc = u.contributionsCollection;
  const days = cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays).sort((a, b) => a.date.localeCompare(b.date));
  let i = days.length - 1;
  if (i >= 0 && days[i].contributionCount === 0) i--;
  let current = 0;
  while (i >= 0 && days[i].contributionCount > 0) { current++; i--; }
  let longest = 0, run = 0;
  for (const d of days) { run = d.contributionCount > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  const langs = {};
  let stars = 0;
  for (const r of u.repositories.nodes) {
    stars += r.stargazerCount;
    for (const e of r.languages.edges) langs[e.node.name] = (langs[e.node.name] || 0) + e.size;
  }
  const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
  const topLangs = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, size]) => ({ name, pct: (size / total) * 100 }));
  return {
    days, current, longest, stars, topLangs,
    repos: u.repositories.totalCount,
    contrib: cc.contributionCalendar.totalContributions,
    commits: cc.totalCommitContributions + cc.restrictedContributionsCount,
    prs: cc.totalPullRequestContributions,
    last7: days.slice(-7).reduce((a, d) => a + d.contributionCount, 0),
  };
}

const stamp = () => new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo", hour12: false }).slice(0, 16);

// ───────────────────────── PEÇAS DINÂMICAS ─────────────────────────
function panel(W, H, title, seed) {
  return `
<rect width="${W}" height="${H}" fill="${C.bg}"/>
${stars(W, H, 50, seed, 0.6)}
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="10" fill="${C.panel}" fill-opacity=".88" stroke="${C.metal2}" stroke-width="1.5"/>
<rect x="6" y="6" width="${W - 12}" height="46" rx="10" fill="${C.metal}" fill-opacity=".55"/>
<text x="26" y="36" class="h" font-size="16" fill="${C.silver}" letter-spacing="4">${esc(title)}</text>
<circle cx="${W - 64}" cy="29" r="4" fill="${C.red}" class="led"/>
<circle cx="${W - 48}" cy="29" r="4" fill="${C.red}" class="led" style="animation-delay:.3s"/>
<circle cx="${W - 32}" cy="29" r="4" fill="${C.red}" class="led" style="animation-delay:.6s"/>
<rect x="6" y="51" width="${W - 12}" height="2" fill="${C.red}" class="hum" filter="url(#tglow)"/>`;
}

function status(s) {
  const W = 490, H = 350, x1 = 30, x2 = W - 30;
  const rows = [
    ["CONTRIBUIÇÕES [1 ANO]", s.contrib],
    ["COMMITS [1 ANO]", s.commits],
    ["PULL REQUESTS [1 ANO]", s.prs],
    ["REPOSITÓRIOS PÚBLICOS", s.repos],
    ["ESTRELAS RECEBIDAS", s.stars],
    ["SEQUÊNCIA ATUAL", `${s.current} DIAS`],
    ["MAIOR SEQUÊNCIA", `${s.longest} DIAS`],
  ];
  let body = panel(W, H, "PAINEL DE COMANDO", "st");
  rows.forEach(([k, v], i) => {
    const y = 88 + i * 31;
    body += `<text x="${x1}" y="${y}" class="m" font-size="14" fill="${C.silver2}" letter-spacing="1">${esc(k)}</text>
<line x1="${x1}" y1="${y + 10}" x2="${x2}" y2="${y + 10}" stroke="${C.metal}" stroke-width="1"/>
<text x="${x2}" y="${y}" class="h" font-size="16" fill="${C.core}" text-anchor="end" letter-spacing="1">${esc(v)}</text>`;
  });
  const online = s.last7 > 0;
  body += `<text x="${x1}" y="${H - 28}" class="m" font-size="13" fill="${C.silver2}" letter-spacing="1">STATUS: <tspan fill="${online ? C.red : C.silver}" class="${online ? "" : "blink"}">${online ? "OPERACIONAL" : "EM ESPERA"}</tspan></text>
<text x="${x2}" y="${H - 28}" class="m" font-size="12" fill="${C.silver2}" text-anchor="end" letter-spacing="1">${stamp()} BRT</text>`;
  return svg(W, H, body, "Painel de comando");
}

function languages(s) {
  const W = 490, H = 350, x1 = 30, x2 = W - 30;
  let body = panel(W, H, "ARSENAL DE LINGUAGENS", "lg");
  const list = s.topLangs.length ? s.topLangs : [{ name: "SEM DADOS", pct: 0 }];
  const max = Math.max(...list.map((l) => l.pct), 1);
  list.forEach((l, i) => {
    const y = 88 + i * 40;
    const len = Math.max(10, ((x2 - x1 - 90) * l.pct) / max);
    body += `<text x="${x1}" y="${y}" class="m" font-size="14" fill="${C.silver}" letter-spacing="1">${esc(l.name.toUpperCase())}</text>
<text x="${x2}" y="${y}" class="h" font-size="14" fill="${C.core}" text-anchor="end">${l.pct.toFixed(1)}%</text>
${saber(x1, y + 15, len, { thick: 3.4, hilt: 40, delay: 0.3 + i * 0.15, dur: 0.5, glowSize: 0.7 })}`;
  });
  body += `<text x="${x2}" y="${H - 28}" class="m" font-size="12" fill="${C.silver2}" text-anchor="end" letter-spacing="1">POR BYTES · REPOSITÓRIOS PÚBLICOS</text>`;
  return svg(W, H, body, "Linguagens");
}

function activity(s) {
  const W = 1000, H = 300, N = 31;
  const days = s.days.slice(-N);
  const L = 66, R = W - 40, T = 80, B = H - 64;
  const peak = Math.max(0, ...days.map((d) => d.contributionCount));
  const step = Math.ceil(Math.max(4, peak) / 4), top = step * 4;
  const X = (i) => L + (i * (R - L)) / Math.max(1, days.length - 1);
  const Y = (v) => B - (v / top) * (B - T);
  const pts = days.map((d, i) => [X(i), Y(d.contributionCount)]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const len = pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0).toFixed(0);
  const total = days.reduce((a, d) => a + d.contributionCount, 0);
  const draw = `stroke-dasharray="${len}" stroke-dashoffset="0"><animate attributeName="stroke-dashoffset" from="${len}" to="0" dur="2s" fill="freeze"/>`;
  let grid = "";
  for (let k = 0; k <= 4; k++) {
    const v = k * step, y = Y(v);
    grid += `<line x1="${L}" y1="${y}" x2="${R}" y2="${y}" stroke="${C.metal}" stroke-dasharray="${k ? "4 6" : "0"}"/>
<text x="${L - 12}" y="${y + 4}" class="m" font-size="12" fill="${C.silver2}" text-anchor="end">${v}</text>`;
  }
  let xl = "";
  days.forEach((d, i) => {
    if (i % 5 === 0 || i === days.length - 1) {
      const [, mm, dd] = d.date.split("-");
      xl += `<text x="${X(i)}" y="${B + 22}" class="m" font-size="12" fill="${C.silver2}" text-anchor="middle">${dd}/${mm}</text>`;
    }
  });
  const body = `
<rect width="${W}" height="${H}" fill="${C.bg}"/>
${stars(W, H, 90, "act", 0.6)}
<rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="10" fill="${C.panel}" fill-opacity=".85" stroke="${C.metal2}" stroke-width="1.5"/>
<text x="28" y="44" class="h" font-size="18" fill="${C.silver}" letter-spacing="4">ATIVIDADE <tspan class="m" font-size="13" fill="${C.silver2}" letter-spacing="2">// ÚLTIMOS ${days.length} DIAS</tspan></text>
<text x="${W - 28}" y="44" class="m" font-size="14" fill="${C.silver2}" text-anchor="end" letter-spacing="1">TOTAL <tspan fill="${C.core}">${total}</tspan>   PICO <tspan fill="${C.core}">${peak}</tspan>   SEQUÊNCIA <tspan fill="${C.core}">${s.current}</tspan></text>
${grid}
<g class="hum">
  <path d="${line}" fill="none" stroke="${C.red}" stroke-width="10" stroke-linejoin="round" stroke-linecap="round" opacity=".5" filter="url(#glow2)" ${draw}</path>
  <path d="${line}" fill="none" stroke="${C.red}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" filter="url(#glow)" ${draw}</path>
</g>
<path d="${line}" fill="none" stroke="${C.core}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" ${draw}</path>
${xl}
<text x="28" y="${H - 22}" class="m" font-size="12" fill="${C.silver2}" letter-spacing="1">ATUALIZADO ${stamp()} BRT</text>`;
  return svg(W, H, body, "Atividade");
}

// ───────────────────────── MAIN ─────────────────────────
const [mode = "dynamic", out = mode === "static" ? "assets" : "dist"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const write = (name, content) => { writeFileSync(join(out, name), content); console.log(`✓ ${join(out, name)} (${(content.length / 1024).toFixed(1)} KB)`); };

if (mode === "static" || mode === "all") {
  write("header.svg", header());
  write("title-data.svg", sectionTitle("TELEMETRIA", "ATUALIZA 2X POR DIA"));
  write("footer.svg", footer());
  if (STACK.length) { write("title-stack.svg", sectionTitle("TECNOLOGIAS")); write("stack.svg", stack()); }
  if (CONTACTS.length) {
    write("title-contact.svg", sectionTitle("CONTATO"));
    CONTACTS.forEach((c, i) => write(`btn-${c.id}.svg`, button(c.label, i)));
  }
}
if (mode === "dynamic" || mode === "all") {
  const s = crunch(await fetchData());
  write("status.svg", status(s));
  write("languages.svg", languages(s));
  write("activity.svg", activity(s));
}
