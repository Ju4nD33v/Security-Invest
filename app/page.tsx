"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Bell, BookOpen, Bot, BrainCircuit, BriefcaseBusiness, ChevronDown, CircleHelp, Eye, EyeOff, FileBarChart, Globe2, LayoutDashboard, LockKeyhole, LogOut, Menu, Moon, Plus, Search, Send, Settings as SettingsIcon, ShieldCheck, SlidersHorizontal, Sparkles, Sun, TrendingDown, TrendingUp, UserRound, WalletCards, X } from "lucide-react";
import { FormEvent, useState, useRef, useContext, createContext, Dispatch, SetStateAction, useEffect } from "react";

type Screen = "home" | "login" | "signup" | "recover" | "dashboard" | "portfolio" | "investments" | "market" | "reports" | "profile" | "settings";
type ProfileData = { name: string; email: string; phone: string; avatarUrl: string };
type AuthenticatedUser = { fullName: string; email: string | null; phone: string | null; avatarUrl: string | null };
type PortfolioSummary = { cashBalance: number; investedValue: number; currentValue: number; totalEquity: number; unrealizedPnl: number; unrealizedPnlPercent: number; positionCount: number };
type PortfolioPosition = { symbol: string; quantity: number | string; average_price: number | string; marketDataAvailable: boolean; quote?: { price: number; currency: string }; investedValue?: number; currentValue?: number; unrealizedPnl?: number; unrealizedPnlPercent?: number };
type PortfolioData = { summary: PortfolioSummary; positions: PortfolioPosition[] };
type MarketSearchResult = { symbol?: string; name?: string; exchangeShortName?: string };

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const assets = [
  ["PETR4", "Petrobras PN", "R$ 41,72", "+1,84%", "up"],
  ["IVVB11", "S&P 500 ETF", "R$ 401,15", "+1,12%", "up"],
  ["VALE3", "Vale ON", "R$ 58,39", "−0,72%", "down"],
  ["ITUB4", "Itaú Unibanco PN", "R$ 36,01", "+0,43%", "up"],
];

function tagOf(ticker: string) {
  return ticker.includes("11") ? "ETFs" : "Renda variável";
}

const nav = [
  ["dashboard", LayoutDashboard, "Dashboard"],
  ["portfolio", WalletCards, "Carteira"],
  ["investments", BriefcaseBusiness, "Investimentos"],
  ["market", TrendingUp, "Mercado"],
  ["reports", FileBarChart, "Relatórios"],
  ["profile", UserRound, "Perfil"],
  ["settings", SettingsIcon, "Configurações"],
] as const;

/* ---------- Toasts ---------- */
type Toast = { id: number; message: string };
const ToastContext = createContext<(message: string) => void>(() => {});
function useToast() {
  return useContext(ToastContext);
}
function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  function showToast(message: string) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }
  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toaststack" aria-live="polite">
        {toasts.map((t) => (
          <div className="toast" key={t.id}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ---------- Modal ---------- */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modalveil" onClick={onClose}>
      <div className="modalbox" onClick={(e) => e.stopPropagation()}>
        <div className="modalhead">
          <h3>{title}</h3>
          <button aria-label="Fechar" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modalbody">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Dropdown menu (used for "•••" buttons) ---------- */
function MoreMenu({ options, triggerClass = "roundmore" }: { options: { label: string; onClick: () => void }[]; triggerClass?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="moremenu-wrap">
      <button className={triggerClass} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>•••</button>
      {open && (
        <>
          <div className="menuveil" onClick={() => setOpen(false)} />
          <div className="moremenu" role="menu">
            {options.map((o) => (
              <button key={o.label} role="menuitem" onClick={() => { o.onClick(); setOpen(false); }}>{o.label}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------- Shared UI ---------- */
function Logo({ dark = false }: { dark?: boolean }) {
  return <div className="logo"><span className={dark ? "mark darkmark" : "mark"}>S</span><span>security<span>invest</span></span></div>;
}
function Btn({ children, onClick, variant = "primary", type = "button", disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "outline"; type?: "button" | "submit"; disabled?: boolean }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`btn ${variant}`}>{children}</button>;
}
function LineChart() {
  return (
    <svg viewBox="0 0 800 220" className="linechart" role="img" aria-label="Evolução da carteira nos últimos seis meses">
      <defs>
        <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#2563eb" stopOpacity=".22" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="grid" d="M0 36H800M0 92H800M0 148H800M0 204H800" />
      <path fill="url(#fill)" d="M0 182 L42 173 90 178 136 135 184 144 230 117 282 128 330 95 380 111 432 73 478 88 530 38 578 64 622 44 671 69 720 28 760 43 800 18V220H0Z" />
      <path className="plot" d="M0 182 L42 173 90 178 136 135 184 144 230 117 282 128 330 95 380 111 432 73 478 88 530 38 578 64 622 44 671 69 720 28 760 43 800 18" />
    </svg>
  );
}
function Ring() {
  return <div className="ring"><span>Renda<br />48%</span></div>;
}
function AssetRow({ a }: { a: string[] }) {
  const up = a[4] === "up";
  return (
    <div className="assetrow">
      <span className="ticker">{a[0].slice(0, 2)}</span>
      <div><b>{a[0]}</b><small>{a[1]}</small></div>
      <strong>{a[2]}</strong>
      <em className={up ? "gain" : "loss"}>{up ? "+" : ""}{a[3]}</em>
    </div>
  );
}
function Signal({ icon, label, count, note, tone }: { icon: React.ReactNode; label: string; count: string; note: string; tone: string }) {
  return <div className={`signalcard ${tone}`}><span>{icon}</span><b>{count}</b><div><strong>{label}</strong><small>{note}</small></div></div>;
}
function Stat({ label, value, change }: { label: string; value: string; change: string }) {
  return <div className="stat"><small>{label}</small><strong>{value}</strong><span className="positive"><ArrowUpRight size={13} />{change}</span></div>;
}
function Metric({ title, value, note, green = false }: { title: string; value: string; note: string; green?: boolean }) {
  return <div className="stat"><small>{title}</small><strong>{value}</strong><span className={green ? "positive" : ""}>{note}</span></div>;
}
function MarketTicker() {
  const quotes = [
    ["MAIORES ALTAS", "PETR4", "+3,42%", "up"],
    ["", "ITUB4", "+2,18%", "up"],
    ["", "WEGE3", "+1,67%", "up"],
    ["MAIORES QUEDAS", "VALE3", "−2,31%", "down"],
    ["", "MGLU3", "−1,88%", "down"],
    ["", "AZUL4", "−1,26%", "down"],
  ];
  return (
    <div className="tickerbar" aria-label="Cotações ilustrativas em movimento">
      <div className="tickertrack">
        {[...quotes, ...quotes].map(([label, ticker, value, tone], i) => (
          <span className="quotechip" key={`${ticker}-${i}`}>
            {label && <small>{label}</small>}
            <b>{ticker}</b>
            <em className={tone}>{tone === "up" ? <TrendingUp /> : <TrendingDown />}{value}</em>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Landing ---------- */
function Landing({ go }: { go: (s: Screen) => void }) {
  const showToast = useToast();
  return (
    <main className="landing">
      <header className="publicnav">
        <Logo />
        <nav><a href="#produto">Produto</a><a href="#agente">Agente de IA</a><a href="#planos">Planos</a><a href="#perguntas">Perguntas</a></nav>
        <div><Btn variant="ghost" onClick={() => go("login")}>Entrar</Btn><Btn onClick={() => go("signup")}>Abrir conta</Btn></div>
      </header>
      <MarketTicker />
      <section className="hero">
        <div className="eyebrow"><ShieldCheck size={15} /> Inteligência que protege seu patrimônio</div>
        <h1>Invista com clareza.<br /><em>Decida com confiança.</em></h1>
        <p>Uma carteira completa com um agente de IA para apoiar sua leitura de investimentos, identificar movimentos e investigar possíveis compras e vendas.</p>
        <div className="heroactions">
          <Btn onClick={() => go("signup")}>Começar agora <ArrowUpRight size={17} /></Btn>
          <Btn variant="outline" onClick={() => go("login")}>Explorar plataforma</Btn>
        </div>
        <a className="plans-link" href="#planos">Conheça os planos e recursos <ChevronDown size={16} /></a>
        <div className="trust"><span><ShieldCheck /> Dados protegidos</span><span><Sparkles /> Insights inteligentes</span><span><TrendingUp /> Dados em tempo real</span></div>
      </section>
      <section className="terminal-wrap" id="produto">
        <div className="terminal">
          <div className="terminaltop">
            <div><span className="dot red"></span><span className="dot yellow"></span><span className="dot green"></span></div>
            <span>visão geral · securityinvest</span>
            <span className="live">● mercado aberto</span>
          </div>
          <div className="showcase">
            <div className="mini-side">
              <Logo dark />
              <div className="sideitem active"><LayoutDashboard />Visão geral</div>
              <div className="sideitem"><WalletCards />Carteira</div>
              <div className="sideitem"><TrendingUp />Mercado</div>
            </div>
            <div className="showmain">
              <div className="showhead"><div><small>Boa tarde, Olívia</small><h3>Seu patrimônio, em movimento.</h3></div><div className="avatar">OL</div></div>
              <div className="showstats">
                <Stat label="Patrimônio total" value="R$ 124.850,62" change="+8,4%" />
                <Stat label="Rentabilidade" value="+R$ 9.673,18" change="Este ano" />
                <Stat label="Ativos" value="12" change="Diversificados" />
              </div>
              <div className="showgrid">
                <div className="chartbox"><div className="cardtitle"><span>Evolução patrimonial</span><b>6 meses <ChevronDown size={14} /></b></div><LineChart /></div>
                <div className="allocation"><span>Alocação</span><Ring /><small>Renda variável</small></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="ai-feature" id="agente">
        <div>
          <p className="kicker">Seu agente de IA, sempre ao lado</p>
          <h2>Entenda antes de agir.</h2>
          <p>Converse sobre uma ação, explore possíveis cenários e receba insights inteligentes sobre sua carteira. O agente não substitui a sua análise e pode cometer erros.</p>
          <div className="ai-points">
            <span><BrainCircuit /> Sinais de compra e venda para investigar</span>
            <span><Bot /> Perguntas sobre ativos específicos</span>
            <span><ShieldCheck /> Você decide — sempre</span>
          </div>
          <Btn onClick={() => go("investments")}>Conhecer insights inteligentes <ArrowUpRight size={16} /></Btn>
        </div>
        <div className="agent-preview">
          <div className="agent-title"><span><Bot size={18} /></span><b>SYT Assistente</b><i>●</i></div>
          <div className="agent-bubble">Posso ajudar você a entender os possíveis movimentos de PETR4 ou organizar os sinais da sua carteira.</div>
          <div className="agent-question">O que observar em PETR4? <ArrowUpRight size={14} /></div>
          <small>IA simulada · os insights podem conter erros</small>
        </div>
      </section>
      <section className="benefits">
        <div><p className="kicker">Uma plataforma, uma visão</p><h2>Menos ruído. Mais estratégia.</h2></div>
        <div className="benefitlist">
          <article><span className="iconbox"><Eye /></span><h3>Visibilidade total</h3><p>Veja cada posição, movimentação e resultado em uma leitura clara.</p></article>
          <article><span className="iconbox"><SlidersHorizontal /></span><h3>Decisões informadas</h3><p>Indicadores essenciais para acompanhar o que realmente importa.</p></article>
          <article><span className="iconbox"><LockKeyhole /></span><h3>Segurança nativa</h3><p>Uma experiência pensada para cuidar do que você construiu.</p></article>
        </div>
      </section>
      <section className="plans" id="planos">
        <div className="plansintro">
          <p className="kicker">Planos transparentes</p>
          <h2>Comece gratuito.<br />Evolua quando fizer sentido.</h2>
          <p>Escolha como quer acompanhar seus investimentos e usar os insights inteligentes.</p>
        </div>
        <div className="plansgrid">
          <article className="plancard">
            <span>GRATUITO</span><h3>R$ 0</h3><small>Para começar sem compromisso</small>
            <ul><li>Carteira de investimentos completa</li><li>Visão geral do patrimônio</li><li>Insights gratuitos selecionados</li></ul>
            <Btn variant="outline" onClick={() => go("signup")}>Começar grátis</Btn>
          </article>
          <article className="plancard featured">
            <b className="popular">MAIS ESCOLHIDO</b><span>INICIAL</span><h3>R$ 99,90 <small>/ mês</small></h3><small>Mais contexto para suas decisões</small>
            <ul><li>Todos os recursos do Gratuito</li><li>Até 2 insights inteligentes por mês</li><li>Sinais de compra e venda para investigar</li></ul>
            <Btn onClick={() => go("signup")}>Escolher Inicial</Btn>
          </article>
          <article className="plancard premium">
            <span>PREMIUM</span><h3>R$ 199,90 <small>/ mês</small></h3><small>Para quem quer explorar sem limites</small>
            <ul><li>Todos os recursos do Inicial</li><li>IA ilimitada para perguntas</li><li>Análise de notícias e ações simuladas</li><li>Insights para possíveis compras e vendas</li></ul>
            <Btn onClick={() => go("signup")}>Escolher Premium</Btn>
          </article>
        </div>
        <p className="plansnote">Os insights são gerados por IA e podem conter erros. Eles não constituem recomendação de investimento.</p>
      </section>
      <section className="quote">
        <p>&ldquo;Finalmente consigo entender como meus investimentos conversam entre si.&rdquo;</p>
        <div><span className="quoteavatar">RM</span><span><b>Renata Moreira</b><small>Cliente SecurityInvest</small></span></div>
      </section>
      <section className="faq" id="perguntas">
        <p className="kicker">Perguntas frequentes</p>
        <h2>Comece sem complicação.</h2>
        {["O que é a SecurityInvest?", "Preciso ser especialista para usar a plataforma?", "Meus dados ficam protegidos?"].map((q, i) => (
          <details key={q}>
            <summary>{q}<Plus size={18} /></summary>
            <p>{i === 0 ? "A SecurityInvest é uma plataforma de acompanhamento e análise de investimentos." : "Não. A experiência foi criada para transformar dados financeiros em decisões fáceis de entender."}</p>
          </details>
        ))}
      </section>
      <footer>
        <Logo dark />
        <span>© 2026 SecurityInvest. Investir envolve riscos.</span>
        <div>
          <button className="footerlink" onClick={() => showToast("Página de Privacidade em construção")}>Privacidade</button>
          {" · "}
          <button className="footerlink" onClick={() => showToast("Página de Termos em construção")}>Termos</button>
          {" · "}
          <button className="footerlink" onClick={() => showToast("Página de Segurança em construção")}>Segurança</button>
        </div>
      </footer>
    </main>
  );
}

/* ---------- Auth ---------- */
function Auth({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const showToast = useToast();
  const [sent, setSent] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSign = screen === "signup";
  const recover = screen === "recover";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const endpoint = recover ? "/api/auth/forgot-password" : isSign ? "/api/auth/sign-up" : "/api/auth/sign-in";
    const password = String(form.get("password") ?? "");
    if (isSign && password !== String(form.get("passwordConfirmation") ?? "")) { showToast("As senhas não coincidem"); return; }
    const body = recover ? { email: form.get("email") } : isSign ? { firstName: form.get("firstName"), lastName: form.get("lastName"), email: form.get("email"), password } : { email: form.get("email"), password };
    setLoading(true);
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error?.message || "Não foi possível concluir a solicitação.");
      if (recover) { setSent(true); return; }
      showToast(isSign ? "Confira seu e-mail para confirmar o cadastro" : "Login realizado com sucesso");
      if (!isSign) go("dashboard");
    } catch (error) { showToast(error instanceof Error ? error.message : "Não foi possível concluir a solicitação."); }
    finally { setLoading(false); }
  }

  function socialLogin() {
    showToast("Login com Google ainda não está configurado.");
  }

  return (
    <main className="auth">
      <button className="back" onClick={() => go("home")}>← Voltar ao início</button>
      <section className="authside">
        <Logo dark />
        <div>
          <p className="eyebrow"><ShieldCheck size={15} /> Segurança em cada decisão</p>
          <h1>Seu patrimônio merece uma visão mais inteligente.</h1>
          <p>Organize, acompanhe e evolua seus investimentos em um só lugar.</p>
        </div>
        <div className="authquote">&ldquo;A plataforma deixa o mercado mais claro.&rdquo;<span>— Ricardo M., investidor</span></div>
      </section>
      <section className="authform">
        <div className="formbox">
          <Logo />
          <h2>{recover ? (sent ? "Confira seu e-mail" : "Recupere seu acesso") : isSign ? "Crie sua conta" : "Bem-vindo de volta"}</h2>
          <p>{recover ? (sent ? "Enviamos as instruções para você redefinir sua senha." : "Informe seu e-mail e enviaremos as instruções.") : isSign ? "Comece a cuidar do seu futuro hoje." : "Acesse sua visão de investimentos."}</p>
          {!sent && (
            <form onSubmit={submit}>
              {isSign && (
                <>
                  <div className="namefields"><label>Nome<input name="firstName" required placeholder="Seu nome" /></label><label>Sobrenome<input name="lastName" required placeholder="Seu sobrenome" /></label></div>
                </>
              )}
              <label>E-mail<input name="email" required type="email" placeholder="voce@email.com" /></label>
              {!recover && (
                <>
                  <label>Senha
                    <div className="pass">
                      <input name="password" required minLength={12} type={show ? "text" : "password"} placeholder="Sua senha" />
                      <button type="button" onClick={() => setShow(!show)} aria-label="Alternar visibilidade da senha">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </label>
                  {isSign && <label>Confirmar senha<input name="passwordConfirmation" required minLength={12} type="password" placeholder="Repita sua senha" /></label>}
                </>
              )}
              {!isSign && !recover && (
                <div className="formrow">
                  <label className="check"><input type="checkbox" /> Lembrar de mim</label>
                  <button type="button" className="link" onClick={() => go("recover")}>Esqueci minha senha</button>
                </div>
              )}
              {isSign && <label className="check"><input required type="checkbox" /> Li e aceito os termos de uso e privacidade.</label>}
              <Btn type="submit" disabled={loading}>{loading ? "Aguarde..." : recover ? "Enviar recuperação" : isSign ? "Criar minha conta" : "Entrar na plataforma"} <ArrowUpRight size={17} /></Btn>
            </form>
          )}
          {!recover && (
            <>
              <div className="divider">ou continue com</div>
              <button className="social" onClick={socialLogin}>G <span>Google</span></button>
              <p className="switch">{isSign ? "Já tem uma conta?" : "Ainda não tem conta?"} <button onClick={() => go(isSign ? "login" : "signup")}>{isSign ? "Entrar" : "Criar conta"}</button></p>
            </>
          )}
          {recover && <button className="link center" onClick={() => go("login")}>Voltar para o login</button>}
        </div>
      </section>
    </main>
  );
}

/* ---------- Dashboard shell ---------- */
function Dashboard({ page, go }: { page: Screen; go: (s: Screen) => void }) {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const [assetList] = useState<string[][]>(() => assets.map((a) => [...a, tagOf(a[0])]));
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<ProfileData>({ name: "", email: "", phone: "", avatarUrl: "" });
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);

  async function refreshPortfolio() {
    const response = await fetch("/api/trading/portfolio");
    if (!response.ok) return;
    const payload = await response.json() as PortfolioData;
    if (payload.summary && Array.isArray(payload.positions)) setPortfolio(payload);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/trading/portfolio")
      .then(async (response) => response.ok ? await response.json() as PortfolioData : null)
      .then((payload) => { if (active && payload?.summary && Array.isArray(payload.positions)) setPortfolio(payload); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session").then(async (response) => response.ok ? await response.json() as { user?: AuthenticatedUser } : null).then((payload) => {
      if (active && payload?.user) setProfile({ name: payload.user.fullName, email: payload.user.email ?? "", phone: payload.user.phone ?? "", avatarUrl: payload.user.avatarUrl ?? "" });
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/watchlist")
      .then(async (response) => response.ok ? await response.json() as { watchlist?: { watchlist_assets?: { symbol: string }[] } } : null)
      .then((payload) => { if (active && payload?.watchlist) setFavorites(new Set(payload.watchlist.watchlist_assets?.map((asset) => asset.symbol) ?? [])); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const title: Record<string, string> = { dashboard: "Visão geral", portfolio: "Carteira", investments: "Insights Inteligentes", market: "Mercado", reports: "Relatórios", profile: "Perfil", settings: "Configurações" };

  const initials = profile.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "OL";
  const avatarStyle = profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : undefined;

  const notifications = [
    "PETR4 subiu mais de 3% hoje",
    "Novo insight disponível em Investimentos",
    "Seu resumo semanal está pronto",
  ];

  async function logout() {
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => undefined);
    go("home");
  }

  return (
    <main className={dark ? "app dark" : "app"}>
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="brandrow">
          <Logo dark />
          <button className="mobileclose" onClick={() => setOpen(false)}><X /></button>
        </div>
        <p className="sidecaption">MENU PRINCIPAL</p>
        {nav.map(([id, Icon, label]) => (
          <button key={id} className={page === id ? "navitem selected" : "navitem"} onClick={() => { go(id); setOpen(false); }}>
            <Icon size={19} />{id === "investments" ? "Insights inteligentes" : label}
          </button>
        ))}
        <div className="sidespacer" />
        <button className="navitem" onClick={() => setHelpOpen(true)}><CircleHelp size={19} />Central de ajuda</button>
        <button className="navitem logout" onClick={logout}><LogOut size={19} />Sair</button>
      </aside>
      <div className="mobileveil" onClick={() => setOpen(false)} />
      <section className="workspace">
        <header className="topbar">
          <button className="menubtn" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu /></button>
          <div className="crumb"><span>SecurityInvest</span><b>/</b><strong>{title[page]}</strong></div>
          <div className="topactions">
            <label className="search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ativo..." /></label>
            <div className="moremenu-wrap">
              <button className="iconbutton" aria-label="Notificações" onClick={() => { setNotifOpen((o) => !o); setUnread(false); }}>
                <Bell size={19} />{unread && <i />}
              </button>
              {notifOpen && (
                <>
                  <div className="menuveil" onClick={() => setNotifOpen(false)} />
                  <div className="notifpanel">
                    <b className="notifpanel-title">Notificações</b>
                    {notifications.map((n) => <div className="notifitem" key={n}>{n}</div>)}
                  </div>
                </>
              )}
            </div>
            <button className="profilemini" onClick={() => go("profile")}>
              <span style={avatarStyle}>{initials}</span><b>{profile.name}</b><ChevronDown size={15} />
            </button>
          </div>
        </header>
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: .22 }} className="content">
            {page === "dashboard" ? <Overview go={go} profile={profile} portfolio={portfolio} /> :
              page === "investments" ? <Insights /> :
              page === "portfolio" || page === "market" ? <Assets page={page} assetList={assetList} search={search} favorites={favorites} setFavorites={setFavorites} portfolio={portfolio} refreshPortfolio={refreshPortfolio} /> :
              page === "profile" ? <Profile profile={profile} setProfile={setProfile} /> :
              page === "settings" ? <Settings dark={dark} setDark={setDark} /> :
              <Reports />}
          </motion.div>
        </AnimatePresence>
      </section>

      {helpOpen && (
        <Modal title="Central de ajuda" onClose={() => setHelpOpen(false)}>
          <ul className="helplist">
            <li><b>Como funcionam os insights de IA?</b><br />São gerados a partir de dados simulados e servem como ponto de partida para sua própria análise.</li>
            <li><b>Meus dados estão seguros?</b><br />Este é um protótipo de front-end — nenhum dado real é armazenado ou compartilhado.</li>
            <li><b>Como falo com o suporte?</b><br />Envie um e-mail para <a href="mailto:suporte@securityinvest.com.br">suporte@securityinvest.com.br</a>.</li>
          </ul>
        </Modal>
      )}
    </main>
  );
}

/* ---------- Overview (dashboard home) ---------- */
function Overview({ go, profile, portfolio }: { go: (s: Screen) => void; profile: ProfileData; portfolio: PortfolioData | null }) {
  const showToast = useToast();
  const [hideBalance, setHideBalance] = useState(false);
  const [range, setRange] = useState<"6M" | "1A" | "Máx.">("6M");
  const [allocDetail, setAllocDetail] = useState(false);
  const [newsModal, setNewsModal] = useState<string | null>(null);

  const monthsMap: Record<string, string[]> = {
    "6M": ["Mar", "Abr", "Mai", "Jun", "Jul", "Ago"],
    "1A": ["Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago"],
    "Máx.": ["2022", "2023", "2024", "2025", "2026"],
  };

  const news = [
    "Ibovespa fecha em alta, com bancos e commodities",
    "Dólar recua com cenário externo mais favorável",
    "Copom: o que esperar da próxima decisão",
  ];

  return (
    <>
      <div className="ai-notice" role="note"><ShieldCheck size={20} /><div><b>PAPER TRADING · SALDO VIRTUAL</b><p>Esta carteira é uma simulação. Nenhuma ordem representa compra ou venda real de ativos.</p></div></div>
      <div className="pagehead">
        <div><p>VISÃO DA SUA CARTEIRA</p><h1>Olá, {profile.name.split(" ")[0] || "investidor(a)"} <span>↗</span></h1><small>Acompanhe seus investimentos hoje.</small></div>
        <Btn onClick={() => go("investments")}>Ver oportunidades <ArrowUpRight size={16} /></Btn>
      </div>
      <div className="metrics">
        <div className="mainmetric">
          <div>
            <span>
              Patrimônio total{" "}
              <button className="eyebtn" aria-label={hideBalance ? "Mostrar valores" : "Ocultar valores"} onClick={() => setHideBalance((h) => !h)}>
                {hideBalance ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </span>
            <h2>{hideBalance ? "R$ ••••••" : portfolio ? fmt.format(portfolio.summary.totalEquity) : "—"}</h2>
            <b><TrendingUp size={15} /> {portfolio ? `${portfolio.summary.unrealizedPnlPercent >= 0 ? "+" : ""}${portfolio.summary.unrealizedPnlPercent.toFixed(2).replace(".", ",")}%` : "—"} <small>resultado não realizado</small></b>
          </div>
          <div className="sparkbars">▁▃▂▅▃▆▅▇▆</div>
        </div>
        <Metric title="P&L não realizado" value={hideBalance ? "R$ ••••••" : portfolio ? fmt.format(portfolio.summary.unrealizedPnl) : "—"} note="Dados de mercado disponíveis" green />
        <Metric title="Posições simuladas" value={portfolio ? String(portfolio.summary.positionCount) : "—"} note="Saldo virtual separado" />
        <Metric title="Valor investido" value={hideBalance ? "R$ ••••" : portfolio ? fmt.format(portfolio.summary.investedValue) : "—"} note="Somente posições com cotação" />
      </div>
      <div className="dashboardgrid">
        <section className="panel performance">
          <div className="panelhead">
            <div><h3>Evolução patrimonial</h3><p>Últimos 6 meses</p></div>
            <div className="tabs">
              {(["6M", "1A", "Máx."] as const).map((r) => (
                <button key={r} className={range === r ? "active" : ""} onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
          </div>
          <LineChart />
          <div className="months">{monthsMap[range].map((m) => <span key={m}>{m}</span>)}</div>
        </section>
        <section className="panel allocationpanel">
          <div className="panelhead">
            <div><h3>Alocação</h3><p>Por classe de ativo</p></div>
            <MoreMenu
              triggerClass="more"
              options={[
                { label: "Exportar dados (CSV)", onClick: () => showToast("Exportação simulada iniciada") },
                { label: "Ver detalhes por classe", onClick: () => setAllocDetail(true) },
              ]}
            />
          </div>
          <div className="allocationrow">
            <Ring />
            <div className="legend">
              <p><i className="blue" /> Renda variável <b>48%</b></p>
              <p><i className="navy" /> Renda fixa <b>32%</b></p>
              <p><i className="green" /> Fundos <b>20%</b></p>
            </div>
          </div>
        </section>
        <section className="panel positions">
          <div className="panelhead">
            <div><h3>Suas posições</h3><p>Ativos em destaque</p></div>
            <button className="textbutton" onClick={() => go("portfolio")}>Ver carteira</button>
          </div>
          {portfolio?.positions.length ? portfolio.positions.slice(0, 3).map((position) => <AssetRow key={position.symbol} a={[position.symbol, `${position.quantity} cota(s)`, position.quote ? fmt.format(position.quote.price) : "Cotação indisponível", "—", "up"]} />) : <div className="empty compact"><WalletCards /><h3>Sua carteira ainda está vazia.</h3><p>Adicione seu primeiro investimento para começar a acompanhar.</p><Btn onClick={() => go("portfolio")}><Plus size={15} /> Adicionar investimento</Btn></div>}
        </section>
        <section className="panel news">
          <div className="panelhead"><div><h3>Radar do mercado</h3><p>O que move a bolsa hoje</p></div><BookOpen size={19} /></div>
          {news.map((n, i) => (
            <article className="newsitem" key={n} onClick={() => setNewsModal(n)} style={{ cursor: "pointer" }}>
              <span>0{i + 8}:3{i}</span><b>{n}</b><ArrowUpRight size={15} />
            </article>
          ))}
        </section>
      </div>

      {allocDetail && (
        <Modal title="Alocação por classe" onClose={() => setAllocDetail(false)}>
          <ul className="helplist">
            <li><b>Renda variável — 48%</b><br />Ações e ETFs de bolsa, maior potencial de retorno e risco.</li>
            <li><b>Renda fixa — 32%</b><br />Títulos públicos e privados, previsibilidade e menor volatilidade.</li>
            <li><b>Fundos — 20%</b><br />Fundos multimercado e imobiliários, diversificação automática.</li>
          </ul>
        </Modal>
      )}
      {newsModal && (
        <Modal title="Notícia" onClose={() => setNewsModal(null)}>
          <p>{newsModal}</p>
          <p className="modalnote">Conteúdo ilustrativo, apenas para fins de demonstração — não constitui recomendação de investimento.</p>
        </Modal>
      )}
    </>
  );
}

/* ---------- Assets (Carteira / Mercado) ---------- */
function Assets({
  page, assetList, search, favorites, setFavorites, portfolio, refreshPortfolio,
}: {
  page: Screen;
  assetList: string[][];
  search: string;
  favorites: Set<string>;
  setFavorites: Dispatch<SetStateAction<Set<string>>>;
  portfolio: PortfolioData | null;
  refreshPortfolio: () => Promise<void>;
}) {
  const showToast = useToast();
  const [tag, setTag] = useState("Todos");
  const [filterOpen, setFilterOpen] = useState(false);
  const [onlyUp, setOnlyUp] = useState(false);
  const [onlyDown, setOnlyDown] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<string[] | null>(null);
  const [orderForm, setOrderForm] = useState({ symbol: "", side: "BUY", quantity: "" });
  const [orderPending, setOrderPending] = useState(false);
  const [marketResults, setMarketResults] = useState<MarketSearchResult[]>([]);
  const [marketSearching, setMarketSearching] = useState(false);
  const [marketSearchError, setMarketSearchError] = useState(false);
  const [alertForm, setAlertForm] = useState({ ticker: assetList[0]?.[0] ?? "", condition: "acima", value: "" });

  const subtitle = page === "portfolio" ? "Acompanhe a composição da sua carteira." : page === "market" ? "Dados de mercado para orientar suas decisões." : "Encontre ativos que combinam com sua estratégia.";
  const portfolioAssets = page === "portfolio" && portfolio ? portfolio.positions.filter((position) => position.marketDataAvailable && position.quote).map((position) => {
    const variation = position.unrealizedPnlPercent ?? 0;
    return [position.symbol, `${Number(position.quantity)} cota(s) · PM ${fmt.format(Number(position.average_price))}`, fmt.format(position.quote!.price), `${variation >= 0 ? "+" : ""}${variation.toFixed(2).replace(".", ",")}%`, variation >= 0 ? "up" : "down", tagOf(position.symbol)];
  }) : page === "portfolio" ? [] : assetList;
  const marketAssets = search.trim() ? marketResults.filter((result): result is Required<Pick<MarketSearchResult, "symbol">> & MarketSearchResult => Boolean(result.symbol)).map((result) => [result.symbol!, result.name ?? result.exchangeShortName ?? "Ativo listado", "Consulte a cotação", "—", "up", tagOf(result.symbol!)]) : [];
  const listForPage = page === "market" ? marketAssets : portfolioAssets;

  useEffect(() => {
    if (page !== "market" || !search.trim()) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setMarketSearching(true);
      fetch(`/api/market/search?q=${encodeURIComponent(search.trim())}`)
        .then(async (response) => response.ok ? await response.json() as { data?: MarketSearchResult[] } : null)
        .then((payload) => { if (active) { setMarketResults(Array.isArray(payload?.data) ? payload.data : []); setMarketSearchError(!payload); } })
        .catch(() => { if (active) { setMarketResults([]); setMarketSearchError(true); } })
        .finally(() => { if (active) setMarketSearching(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [page, search]);

  const searched = listForPage.filter((a) => a[0].toLowerCase().includes(search.toLowerCase()) || a[1].toLowerCase().includes(search.toLowerCase()));
  const tagged = searched.filter((a) => {
    if (tag === "Favoritos") return favorites.has(a[0]);
    if (tag === "Renda variável") return a[5] === "Renda variável";
    if (tag === "ETFs") return a[5] === "ETFs";
    return true;
  });
  const toned = tagged.filter((a) => {
    if (onlyUp) return a[4] === "up";
    if (onlyDown) return a[4] === "down";
    return true;
  });

  async function submitOrder(e: FormEvent) {
    e.preventDefault();
    const quantity = Number(orderForm.quantity);
    if (!orderForm.symbol.trim() || !Number.isInteger(quantity) || quantity < 1) return;
    setOrderPending(true);
    try {
      const idempotencyKey = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
      const response = await fetch("/api/trading/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ symbol: orderForm.symbol.trim().toUpperCase(), side: orderForm.side, quantity, orderType: "MARKET" }),
      });
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null;
      if (!response.ok) throw new Error(payload?.error?.message ?? "Não foi possível enviar a ordem simulada.");
      await refreshPortfolio();
      showToast(`Ordem simulada de ${orderForm.side === "BUY" ? "compra" : "venda"} enviada com sucesso.`);
      setOrderForm({ symbol: "", side: "BUY", quantity: "" });
      setAddOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível enviar a ordem simulada.");
    } finally { setOrderPending(false); }
  }

  function submitAlert(e: FormEvent) {
    e.preventDefault();
    if (!alertForm.ticker || !alertForm.value.trim()) return;
    showToast(`Alerta criado: ${alertForm.ticker} ${alertForm.condition === "acima" ? "acima de" : "abaixo de"} R$ ${alertForm.value}`);
    setAlertForm({ ticker: listForPage[0]?.[0] ?? "", condition: "acima", value: "" });
    setAddOpen(false);
  }

  async function toggleFav(ticker: string) {
    const isFavorite = favorites.has(ticker);
    try {
      const response = await fetch(isFavorite ? `/api/watchlist/assets/${encodeURIComponent(ticker)}` : "/api/watchlist/assets", {
        method: isFavorite ? "DELETE" : "POST",
        headers: isFavorite ? undefined : { "Content-Type": "application/json" },
        body: isFavorite ? undefined : JSON.stringify({ symbol: ticker }),
      });
      if (!response.ok) throw new Error("Não foi possível atualizar a watchlist.");
      setFavorites((current) => {
        const next = new Set(current);
        if (isFavorite) next.delete(ticker); else next.add(ticker);
        return next;
      });
      showToast(isFavorite ? `${ticker} removido da watchlist` : `${ticker} adicionado à watchlist`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Não foi possível atualizar a watchlist.");
    }
  }

  return (
    <>
      <div className="pagehead">
        <div>
          <p>{page === "market" ? "MERCADO EM TEMPO REAL" : "SEU PATRIMÔNIO"}</p>
          <h1>{page === "portfolio" ? "Sua carteira" : "Mercado"}</h1>
          <small>{subtitle}</small>
        </div>
        <Btn onClick={() => setAddOpen(true)}><Plus size={16} /> {page === "portfolio" ? "Nova ordem simulada" : "Criar alerta"}</Btn>
      </div>
      {page === "portfolio" && (
        <div className="portfoliohero">
          <div><span>Patrimônio total virtual</span><h2>{portfolio ? fmt.format(portfolio.summary.totalEquity) : "—"}</h2><b>↗ {portfolio ? `${portfolio.summary.unrealizedPnlPercent >= 0 ? "+" : ""}${portfolio.summary.unrealizedPnlPercent.toFixed(2).replace(".", ",")}%` : "—"} <small>resultado não realizado</small></b></div>
          <div><span>Saldo virtual disponível</span><h3>{portfolio ? fmt.format(portfolio.summary.cashBalance) : "—"}</h3><small>Exclusivo para simulação</small></div>
          <div><span>Valor investido</span><h3>{portfolio ? fmt.format(portfolio.summary.investedValue) : "—"}</h3><small>{portfolio ? `${portfolio.summary.positionCount} posição(ões)` : "Dados indisponíveis"}</small></div>
        </div>
      )}
      <section className="panel tablepanel">
        <div className="filterbar">
          <div>
            {["Todos", "Favoritos", "Renda variável", "ETFs"].map((t) => (
              <button key={t} className={tag === t ? "filteractive" : ""} onClick={() => setTag(t)}>{t}</button>
            ))}
          </div>
          <button className="filter" onClick={() => setFilterOpen(true)}><SlidersHorizontal size={16} /> Filtros{(onlyUp || onlyDown) ? " •" : ""}</button>
        </div>
        <div className="assettable">
          <div className="thead"><span>Ativo</span><span>Preço atual</span><span>Variação</span><span>Participação</span><span /></div>
          {toned.length ? toned.map((a) => (
            <div className="trow" key={a[0]}>
              <div><span className="ticker">{a[0].slice(0, 2)}</span><b>{a[0]}<small>{a[1]}</small></b></div>
              <strong>{a[2]}</strong>
              <em className={a[4] === "up" ? "gain" : "loss"}>{a[3]}</em>
              <span>{page === "portfolio" ? "18,4%" : "Mercado à vista"}</span>
              <MoreMenu
                options={[
                  { label: favorites.has(a[0]) ? "Remover dos favoritos" : "Adicionar aos favoritos", onClick: () => toggleFav(a[0]) },
                  { label: "Ver detalhes", onClick: () => setDetailItem(a) },
                  ...(page === "portfolio" ? [{ label: "Vender posição", onClick: () => { setOrderForm({ symbol: a[0], side: "SELL", quantity: "" }); setAddOpen(true); } }] : []),
                ]}
              />
            </div>
          )) : (
            <div className="empty">{page === "portfolio" ? <WalletCards /> : <Search />}<h3>{page === "portfolio" ? "Sua carteira ainda está vazia." : marketSearching ? "Buscando ativos…" : page === "market" && !search.trim() ? "Pesquise um ativo" : "Nenhum ativo encontrado"}</h3><p>{page === "portfolio" ? "Adicione seu primeiro investimento para começar a acompanhar seu patrimônio." : page === "market" && !search.trim() ? "Use a busca acima para consultar dados de mercado reais." : marketSearchError ? "Não foi possível consultar os dados de mercado agora." : "Tente buscar por outro código ou nome."}</p>{page === "portfolio" && <Btn onClick={() => setAddOpen(true)}><Plus size={15} /> Adicionar investimento</Btn>}</div>
          )}
        </div>
      </section>

      {addOpen && (
        <Modal title={page === "portfolio" ? "Nova ordem de Paper Trading" : "Criar alerta de mercado"} onClose={() => setAddOpen(false)}>
          {page === "portfolio" ? (
            <form className="modalform" onSubmit={submitOrder}>
              <p className="modalnote">SIMULAÇÃO: o preço é obtido pelo servidor no momento da execução. Nenhum recurso financeiro real será movimentado.</p>
              <label>Operação
                <select value={orderForm.side} onChange={(e) => setOrderForm({ ...orderForm, side: e.target.value })}>
                  <option value="BUY">Comprar</option>
                  <option value="SELL">Vender</option>
                </select>
              </label>
              <label>Ativo<input required value={orderForm.symbol} onChange={(e) => setOrderForm({ ...orderForm, symbol: e.target.value })} placeholder="Ex.: PETR4" maxLength={15} /></label>
              <label>Quantidade<input required type="number" min="1" step="1" inputMode="numeric" value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })} placeholder="Ex.: 10" /></label>
              <Btn type="submit" disabled={orderPending}>{orderPending ? "Enviando ordem..." : "Confirmar ordem simulada"}</Btn>
            </form>
          ) : (
            <form className="modalform" onSubmit={submitAlert}>
              <label>Ativo
                <select value={alertForm.ticker} onChange={(e) => setAlertForm({ ...alertForm, ticker: e.target.value })}>
                  {listForPage.map((a) => <option key={a[0]} value={a[0]}>{a[0]}</option>)}
                </select>
              </label>
              <label>Condição
                <select value={alertForm.condition} onChange={(e) => setAlertForm({ ...alertForm, condition: e.target.value })}>
                  <option value="acima">Preço acima de</option>
                  <option value="abaixo">Preço abaixo de</option>
                </select>
              </label>
              <label>Valor<input required value={alertForm.value} onChange={(e) => setAlertForm({ ...alertForm, value: e.target.value })} placeholder="R$ 0,00" /></label>
              <Btn type="submit">Criar alerta</Btn>
            </form>
          )}
        </Modal>
      )}

      {filterOpen && (
        <Modal title="Filtros" onClose={() => setFilterOpen(false)}>
          <div className="modalform">
            <label className="check"><input type="checkbox" checked={onlyUp} onChange={(e) => { setOnlyUp(e.target.checked); if (e.target.checked) setOnlyDown(false); }} /> Somente ativos em alta</label>
            <label className="check"><input type="checkbox" checked={onlyDown} onChange={(e) => { setOnlyDown(e.target.checked); if (e.target.checked) setOnlyUp(false); }} /> Somente ativos em queda</label>
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <Btn variant="outline" onClick={() => { setOnlyUp(false); setOnlyDown(false); }}>Limpar</Btn>
              <Btn onClick={() => setFilterOpen(false)}>Aplicar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {detailItem && (
        <Modal title={`${detailItem[0]} · ${detailItem[1]}`} onClose={() => setDetailItem(null)}>
          <ul className="helplist">
            <li><b>Preço atual</b><br />{detailItem[2]}</li>
            <li><b>Variação</b><br />{detailItem[3]}</li>
            <li><b>Categoria</b><br />{detailItem[5]}</li>
          </ul>
          <p className="modalnote">Dados simulados para fins de demonstração.</p>
        </Modal>
      )}
    </>
  );
}

/* ---------- Insights (Investimentos) ---------- */
function Insights() {
  const [question, setQuestion] = useState("");
  const [sent, setSent] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const [methodologyOpen, setMethodologyOpen] = useState(false);
  const [analyzeItem, setAnalyzeItem] = useState<{ ticker: string; action: string; reason: string; tone: string } | null>(null);

  function ask(e: FormEvent) {
    e.preventDefault();
    if (question.trim()) { setSent(true); setQuestion(""); }
  }

  const recs = [
    { ticker: "PETR4", action: "Possível compra", reason: "Momentum de curto prazo positivo; observe suporte em R$ 40,80.", tone: "buy" },
    { ticker: "VALE3", action: "Acompanhar / reduzir exposição", reason: "Pressão vendedora e sinal de cautela no cenário simulado.", tone: "sell" },
    { ticker: "ITUB4", action: "Possível compra gradual", reason: "Estabilidade relativa e volume acima da média no modelo.", tone: "buy" },
  ];

  const impactNews = [
    { tag: "MACRO", text: "Dados de inflação simulados surpreendem o mercado" },
    { tag: "SETOR", text: "Setor de energia ganha atenção após anúncio fictício" },
    { tag: "MUNDO", text: "Bolsas globais oscilam em sessão de baixa liquidez" },
  ];

  return (
    <>
      {noticeOpen && (
        <div className="ai-notice" role="note">
          <BrainCircuit size={20} />
          <div>
            <b>Insights gerados por inteligência artificial</b>
            <p>Esta área usa dados simulados e modelos de IA, que podem cometer erros. As informações não constituem recomendação de investimento; seguir ou não qualquer insight é uma decisão livre e exclusiva sua.</p>
          </div>
          <button aria-label="Fechar aviso" onClick={() => setNoticeOpen(false)}><X size={16} /></button>
        </div>
      )}
      <div className="pagehead insighthead">
        <div><p>LEITURA INTELIGENTE · DADOS SIMULADOS</p><h1>O que merece sua atenção hoje</h1><small>Sinais consolidados para você investigar — não para decidir no automático.</small></div>
        <span className="updated"><Sparkles size={14} /> Análise simulada atualizada agora</span>
      </div>
      <div className="insightlayout">
        <section className="insightmain">
          <div className="marketpulse">
            <div><span>Ritmo do mercado</span><h2>Otimismo cauteloso</h2><p>Fluxo comprador em empresas de valor, com volatilidade nos setores cíclicos.</p></div>
            <div className="pulse-meter"><i /><span>62 <small>/100</small></span></div>
          </div>
          <div className="signalrow">
            <Signal icon={<TrendingUp />} label="Possíveis oportunidades" count="03" note="Ativos com momentum positivo" tone="buy" />
            <Signal icon={<TrendingDown />} label="Pontos de atenção" count="02" note="Tendência e risco sob revisão" tone="sell" />
            <Signal icon={<Bell />} label="Eventos no radar" count="04" note="Fatos que podem mexer no mercado" tone="watch" />
          </div>
          <section className="panel recommendations">
            <div className="panelhead">
              <div><h3>Insights para investigar</h3><p>Leituras baseadas em dados fictícios e sinais de mercado.</p></div>
              <button className="textbutton" onClick={() => setMethodologyOpen(true)}>Ver metodologia</button>
            </div>
            {recs.map((r) => (
              <article className="recommendation" key={r.ticker}>
                <span className={`signalicon ${r.tone}`}>{r.tone === "buy" ? <ArrowUpRight /> : <ArrowDownRight />}</span>
                <div className="reccontent">
                  <div><b>{r.ticker}</b><em className={r.tone}>{r.action}</em></div>
                  <p>{r.reason}</p>
                </div>
                <button className="textbutton" onClick={() => setAnalyzeItem(r)}>Analisar</button>
              </article>
            ))}
          </section>
          <section className="panel impactnews">
            <div className="panelhead"><div><h3>Notícias que podem impactar o mercado</h3><p>Conteúdo inteiramente ilustrativo.</p></div></div>
            {impactNews.map((n) => (
              <article key={n.text}><span>{n.tag}</span><b>{n.text}</b><ArrowUpRight size={15} /></article>
            ))}
          </section>
        </section>
        <aside className="ai-chat">
          <div className="chathead"><span><Bot size={18} /></span><div><b>SYT Assistente</b><small>IA simulada · pode errar</small></div><i>●</i></div>
          <div className="chatbody">
            <div className="aibubble">Olá, Olívia. Posso explicar os insights simulados ou ajudar você a analisar uma ação específica.</div>
            {sent && (
              <>
                <div className="userbubble">{question || "Conte-me sobre esse ativo"}</div>
                <div className="aibubble">Com base neste cenário fictício, eu compararia tendência, risco e a sua estratégia antes de agir. Quer ver os principais fatores?</div>
              </>
            )}
            <div className="chatprompts">
              <button onClick={() => setQuestion("O que observar em PETR4?")}>O que observar em PETR4?</button>
              <button onClick={() => setQuestion("Por que VALE3 está em atenção?")}>Por que VALE3 está em atenção?</button>
            </div>
          </div>
          <form className="chatinput" onSubmit={ask}>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Pergunte sobre uma ação..." aria-label="Pergunte ao assistente sobre uma ação" />
            <button type="submit" aria-label="Enviar pergunta"><Send size={17} /></button>
          </form>
        </aside>
      </div>

      {methodologyOpen && (
        <Modal title="Metodologia dos insights" onClose={() => setMethodologyOpen(false)}>
          <p>Os sinais exibidos aqui combinam dados simulados de preço, volume e notícias fictícias para ilustrar como um agente de IA poderia sinalizar pontos de atenção.</p>
          <p className="modalnote">Em produção, cada insight incluiria fontes, nível de confiança e o racional completo do modelo — nada disso constitui recomendação de investimento.</p>
        </Modal>
      )}
      {analyzeItem && (
        <Modal title={`Análise · ${analyzeItem.ticker}`} onClose={() => setAnalyzeItem(null)}>
          <p><b>{analyzeItem.action}</b></p>
          <p>{analyzeItem.reason}</p>
          <p className="modalnote">Esta leitura é gerada por um modelo simulado e pode conter erros. Avalie sempre à luz do seu próprio contexto e objetivos.</p>
        </Modal>
      )}
    </>
  );
}

/* ---------- Profile ---------- */
function Profile({ profile, setProfile }: { profile: ProfileData; setProfile: Dispatch<SetStateAction<ProfileData>> }) {
  const showToast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!profile.name.trim() || !profile.email.trim()) {
      showToast("Preencha nome e e-mail antes de salvar");
      return;
    }
    const [firstName, ...lastNameParts] = profile.name.trim().split(/\s+/);
    if (!lastNameParts.length) { showToast("Informe nome e sobrenome"); return; }
    try {
      const response = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ firstName, lastName: lastNameParts.join(" "), phone: profile.phone || null }) });
      if (!response.ok) throw new Error("Não foi possível salvar o perfil.");
      showToast("Alterações salvas com sucesso");
    } catch (error) { showToast(error instanceof Error ? error.message : "Não foi possível salvar o perfil."); }
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfile((p) => ({ ...p, avatarUrl: url }));
    showToast("Foto atualizada");
  }

  const initials = profile.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "OL";
  const avatarStyle = profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})`, backgroundSize: "cover", backgroundPosition: "center", color: "transparent" } : undefined;

  return (
    <>
      <div className="pagehead">
        <div><p>SUA CONTA</p><h1>Perfil</h1><small>Gerencie suas informações pessoais.</small></div>
        <Btn onClick={() => save()}>Salvar alterações</Btn>
      </div>
      <div className="profilegrid">
        <section className="panel profilecard">
          <div className="bigavatar" style={avatarStyle}>{initials}</div>
          <h2>{profile.name}</h2>
          <p>Investidora desde 2022</p>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onPhoto} />
          <button className="textbutton" onClick={() => fileRef.current?.click()}>Alterar foto</button>
          <hr />
          <span>Perfil completo</span>
          <div className="progress"><i /></div>
          <small>Suas informações ajudam a personalizar sua experiência.</small>
        </section>
        <section className="panel formpanel">
          <h3>Informações pessoais</h3>
          <form className="fields" onSubmit={save}>
            <label>Nome completo<input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} /></label>
            <label>CPF<input defaultValue="***.***.***-09" disabled /></label>
            <label>E-mail<input type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} /></label>
            <label>Telefone<input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} /></label>
          </form>
          <h3>Preferências</h3>
          <div className="switchrow">
            <span><b>Resumo semanal</b><small>Receba sua performance por e-mail.</small></span>
            <input type="checkbox" defaultChecked onChange={() => showToast("Preferência atualizada")} />
          </div>
        </section>
      </div>
    </>
  );
}

/* ---------- Settings ---------- */
function Settings({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const showToast = useToast();
  const [twoFA, setTwoFA] = useState(true);
  const [marketAlerts, setMarketAlerts] = useState(true);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("Português (Brasil)");
  const languages = ["Português (Brasil)", "English (US)", "Español"];

  return (
    <>
      <div className="pagehead"><div><p>PERSONALIZAÇÃO</p><h1>Configurações</h1><small>Defina como prefere usar a plataforma.</small></div></div>
      <section className="settingslist panel">
        <h3>Aparência</h3>
        <div className="settingrow">
          <span><Moon /><span><b>Tema da plataforma</b><small>Escolha a aparência ideal para você.</small></span></span>
          <div className="segmented">
            <button className={!dark ? "on" : ""} onClick={() => setDark(false)}><Sun size={15} />Claro</button>
            <button className={dark ? "on" : ""} onClick={() => setDark(true)}><Moon size={15} />Escuro</button>
          </div>
        </div>
        <h3>Segurança</h3>
        <div className="settingrow">
          <span><LockKeyhole /><span><b>Autenticação em duas etapas</b><small>Adicione uma camada extra de proteção.</small></span></span>
          <input type="checkbox" checked={twoFA} onChange={(e) => { setTwoFA(e.target.checked); showToast(e.target.checked ? "Autenticação em duas etapas ativada" : "Autenticação em duas etapas desativada"); }} />
        </div>
        <div className="settingrow">
          <span><Globe2 /><span><b>Idioma</b><small>{lang}</small></span></span>
          <div className="moremenu-wrap">
            <button className="roundmore" aria-haspopup="listbox" aria-expanded={langOpen} onClick={() => setLangOpen((o) => !o)}><ChevronDown /></button>
            {langOpen && (
              <>
                <div className="menuveil" onClick={() => setLangOpen(false)} />
                <div className="moremenu" role="listbox">
                  {languages.map((l) => (
                    <button key={l} role="option" aria-selected={l === lang} onClick={() => { setLang(l); setLangOpen(false); showToast(l === "Português (Brasil)" ? "Idioma definido" : "Interface segue em PT-BR nesta prévia"); }}>{l}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        <h3>Notificações</h3>
        <div className="settingrow">
          <span><Bell /><span><b>Alertas de mercado</b><small>Movimentos importantes nos seus ativos.</small></span></span>
          <input type="checkbox" checked={marketAlerts} onChange={(e) => { setMarketAlerts(e.target.checked); showToast(e.target.checked ? "Alertas de mercado ativados" : "Alertas de mercado desativados"); }} />
        </div>
      </section>
    </>
  );
}

/* ---------- Reports ---------- */
function Reports() {
  const showToast = useToast();
  const [generating, setGenerating] = useState(false);
  const [reportModal, setReportModal] = useState<null | "rentabilidade" | "composicao">(null);

  function generate() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      showToast("Relatório gerado com sucesso (simulado)");
    }, 900);
  }

  const cards: [string, string, string][] = [
    ["Performance mensal", "+3,24%", "positive"],
    ["Risco da carteira", "Moderado", "neutral"],
    ["Diversificação", "Excelente", "positive"],
  ];

  return (
    <>
      <div className="pagehead">
        <div><p>ANÁLISES</p><h1>Relatórios</h1><small>Visões para acompanhar suas decisões.</small></div>
        <Btn onClick={generate} disabled={generating}>{generating ? "Gerando..." : "Gerar relatório"} <ArrowUpRight size={16} /></Btn>
      </div>
      <section className="reportcards">
        {cards.map((x) => (
          <div className="panel report" key={x[0]}><FileBarChart /><span>{x[0]}</span><h2 className={x[2]}>{x[1]}</h2><small>Atualizado hoje</small></div>
        ))}
      </section>
      <section className="panel reportbig">
        <h3>Relatórios disponíveis</h3>
        <div><b>Resumo de rentabilidade</b><span>PDF · Atualizado em agosto</span><Btn variant="outline" onClick={() => setReportModal("rentabilidade")}>Ver relatório</Btn></div>
        <div><b>Composição da carteira</b><span>PDF · Atualizado em agosto</span><Btn variant="outline" onClick={() => setReportModal("composicao")}>Ver relatório</Btn></div>
      </section>

      {reportModal && (
        <Modal title={reportModal === "rentabilidade" ? "Resumo de rentabilidade" : "Composição da carteira"} onClose={() => setReportModal(null)}>
          {reportModal === "rentabilidade" ? (
            <ul className="helplist">
              <li><b>Rentabilidade no ano</b><br />+8,42%</li>
              <li><b>Resultado acumulado</b><br />R$ 9.673,18</li>
              <li><b>Melhor ativo</b><br />PETR4 (+1,84% no período)</li>
            </ul>
          ) : (
            <ul className="helplist">
              <li><b>Renda variável</b><br />48% da carteira</li>
              <li><b>Renda fixa</b><br />32% da carteira</li>
              <li><b>Fundos</b><br />20% da carteira</li>
            </ul>
          )}
          <p className="modalnote">Relatório simulado, gerado com dados fictícios para fins de demonstração.</p>
        </Modal>
      )}
    </>
  );
}

/* ---------- App ---------- */
function AppInner() {
  const [screen, setScreen] = useState<Screen>("home");
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then((response) => { if (active && response.ok) setScreen("dashboard"); })
      .catch(() => undefined)
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);
  if (checkingSession) return <main className="app-loading" aria-live="polite">Carregando sua sessão…</main>;
  if (screen === "home") return <Landing go={setScreen} />;
  if (["login", "signup", "recover"].includes(screen)) return <Auth screen={screen} go={setScreen} />;
  return <Dashboard page={screen} go={setScreen} />;
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
