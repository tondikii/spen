import { useState } from "react";

type TxType = "income" | "expense" | "transfer";
type Screen = "home" | "plan" | "report" | "settings" | "daily" | "history";
type Transaction = {
  id: number;
  type: TxType;
  amount: number;
  category: string;
  wallet: string;
  to?: string;
  note: string;
  date: string;
  time: string;
};

const money = (n: number, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
const cat: Record<TxType, { name: string; icon: string }[]> = {
  income: [
    { name: "Gaji", icon: "✦" },
    { name: "Freelance", icon: "⌁" },
    { name: "Bonus", icon: "✺" },
  ],
  expense: [
    { name: "Makan", icon: "◒" },
    { name: "Transport", icon: "◉" },
    { name: "Belanja", icon: "▧" },
    { name: "Tagihan", icon: "⌂" },
    { name: "Hiburan", icon: "♪" },
  ],
  transfer: [{ name: "Transfer", icon: "⇄" }],
};
const initialTransactions: Transaction[] = [
  {
    id: 1,
    type: "income",
    amount: 6500000,
    category: "Gaji",
    wallet: "BCA",
    note: "Gaji September",
    date: "2026-09-01",
    time: "08.20",
  },
  {
    id: 2,
    type: "expense",
    amount: 45000,
    category: "Makan",
    wallet: "GoPay",
    note: "Kopi & sarapan",
    date: "2026-09-01",
    time: "09.14",
  },
  {
    id: 3,
    type: "expense",
    amount: 180000,
    category: "Transport",
    wallet: "BCA",
    note: "Isi bensin",
    date: "2026-09-01",
    time: "17.42",
  },
  {
    id: 4,
    type: "transfer",
    amount: 500000,
    category: "Transfer",
    wallet: "BCA",
    to: "Dana Nikah",
    note: "Setor goal",
    date: "2026-08-31",
    time: "20.10",
  },
  {
    id: 5,
    type: "expense",
    amount: 120000,
    category: "Belanja",
    wallet: "BCA",
    note: "Kebutuhan rumah",
    date: "2026-08-30",
    time: "13.05",
  },
];

function Icon({ children }: { children: string }) {
  return <span className="icon">{children}</span>;
}
function Progress({
  value,
  color = "var(--pine)",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="progress">
      <i style={{ width: `${Math.min(value, 100)}%`, background: color }} />
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [dark, setDark] = useState(false);
  const [currency, setCurrency] = useState("IDR");
  const [wallets, setWallets] = useState([
    { name: "Tunai", amount: 350000, tint: "coral" },
    { name: "BCA", amount: 7350000, tint: "pine" },
    { name: "GoPay", amount: 125000, tint: "gold" },
    { name: "Dana Nikah", amount: 1750000, tint: "goal" },
  ]);
  const [txs, setTxs] = useState(initialTransactions);
  const [modal, setModal] = useState<
    | "tx"
    | "wallet"
    | "walletDetail"
    | "suggest"
    | "insight"
    | "calendar"
    | "period"
    | "categories"
    | null
  >(null);
  const [selectedWallet, setSelectedWallet] = useState("BCA");
  const [dailyDate, setDailyDate] = useState("2026-09-01");
  const [filter, setFilter] = useState("Semua");
  const [aiLoading, setAiLoading] = useState(false);
  const [applied, setApplied] = useState<number[]>([]);
  const [allocation, setAllocation] = useState(1200000);
  const [categories, setCategories] = useState(cat);
  const [setup, setSetup] = useState<number | null>(0);
  const total = wallets.reduce((a, w) => a + w.amount, 0);
  const fmt = (n: number) => money(n, currency);
  const addTx = (tx: Transaction) => {
    setTxs((x) => [tx, ...x]);
    setWallets((ws) =>
      ws.map((w) =>
        w.name === tx.wallet
          ? {
              ...w,
              amount:
                w.amount + (tx.type === "income" ? tx.amount : -tx.amount),
            }
          : tx.to === w.name
            ? { ...w, amount: w.amount + tx.amount }
            : w,
      ),
    );
    setModal(null);
  };
  const nav = (to: Screen) => {
    setScreen(to);
    setModal(null);
  };
  if (setup !== null)
    return (
      <div className={dark ? "app dark" : "app"}>
        <Setup
          step={setup}
          setStep={setSetup}
          done={() => setSetup(null)}
          dark={dark}
          setDark={setDark}
        />
      </div>
    );
  return (
    <div className={dark ? "app dark" : "app"}>
      <main className="viewport">
        {screen === "home" && (
          <Home
            fmt={fmt}
            total={total}
            wallets={wallets}
            txs={txs}
            onWallet={(w) => {
              setSelectedWallet(w);
              setModal("walletDetail");
            }}
            onAddWallet={() => setModal("wallet")}
            onDaily={() => nav("daily")}
            onPlan={() => nav("plan")}
          />
        )}
        {screen === "plan" && (
          <Plan
            fmt={fmt}
            total={total}
            allocation={allocation}
            onSuggest={() => {
              setModal("suggest");
              setAiLoading(true);
              setTimeout(() => setAiLoading(false), 800);
            }}
            onPeriod={() => setModal("period")}
            onPay={() => setModal("tx")}
          />
        )}
        {screen === "report" && (
          <Report
            fmt={fmt}
            onInsight={() => {
              setModal("insight");
              setAiLoading(true);
              setTimeout(() => setAiLoading(false), 700);
            }}
            onDrill={() => {
              setFilter("Makan");
              nav("history");
            }}
          />
        )}
        {screen === "settings" && (
          <Settings
            dark={dark}
            setDark={setDark}
            currency={currency}
            setCurrency={setCurrency}
          />
        )}
        {screen === "daily" && (
          <Daily
            fmt={fmt}
            txs={txs}
            date={dailyDate}
            setDate={setDailyDate}
            calendar={() => setModal("calendar")}
            history={() => nav("history")}
            add={() => setModal("tx")}
          />
        )}
        {screen === "history" && (
          <History fmt={fmt} txs={txs} filter={filter} setFilter={setFilter} />
        )}
        {!["daily", "history"].includes(screen) && (
          <TabBar active={screen} go={nav} add={() => setModal("tx")} />
        )}
        {modal === "tx" && (
          <TransactionForm
            fmt={fmt}
            wallets={wallets.map((w) => w.name)}
            categories={categories}
            setCategories={setCategories}
            close={() => setModal(null)}
            save={addTx}
          />
        )}
        {modal === "wallet" && (
          <WalletForm
            fmt={fmt}
            close={() => setModal(null)}
            save={(name, amount) => {
              setWallets([...wallets, { name, amount, tint: "pine" }]);
              setModal(null);
            }}
          />
        )}
        {modal === "walletDetail" && (
          <WalletSheet
            fmt={fmt}
            wallet={wallets.find((w) => w.name === selectedWallet)!}
            close={() => setModal(null)}
            correct={() => {
              setModal("tx");
            }}
          />
        )}
        {modal === "suggest" && (
          <Suggestion
            loading={aiLoading}
            fmt={fmt}
            applied={applied}
            apply={(i) => {
              setApplied([...applied, i]);
              if (i === 0) setAllocation(1000000);
            }}
            close={() => setModal(null)}
          />
        )}
        {modal === "insight" && (
          <Insight loading={aiLoading} close={() => setModal(null)} />
        )}
        {modal === "calendar" && (
          <Calendar
            date={dailyDate}
            select={(d) => {
              setDailyDate(d);
              setModal(null);
            }}
            close={() => setModal(null)}
          />
        )}
        {modal === "period" && <Period close={() => setModal(null)} />}
      </main>
    </div>
  );
}

function Setup({
  step,
  setStep,
  done,
}: {
  step: number;
  setStep: (n: number) => void;
  done: () => void;
  dark: boolean;
  setDark: (b: boolean) => void;
}) {
  const [name, setName] = useState("Wallet pertamaku");
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("IDR");
  return (
    <main className="setup">
      <div className="setup-top">
        <span className="brand-mark">S</span>
        <span className="step">{step + 1} / 3</span>
      </div>
      <div className="step-dots">
        <i className={step >= 0 ? "on" : ""} />
        <i className={step >= 1 ? "on" : ""} />
        <i className={step >= 2 ? "on" : ""} />
      </div>
      {step === 0 && (
        <>
          <div className="welcome-orb">✦</div>
          <p className="eyebrow">SPEN, RUANG UNTUK UANGMU</p>
          <h1>
            Uang lebih tenang,
            <br />
            <em>hidup lebih lega.</em>
          </h1>
          <p className="lead">
            Rencanakan, catat, dan pahami ritme keuanganmu — tanpa rasa
            tertekan.
          </p>
          <button className="primary" onClick={() => setStep(1)}>
            Mulai perlahan <b>→</b>
          </button>
        </>
      )}
      {step === 1 && (
        <>
          <p className="eyebrow">LANGKAH PERTAMA</p>
          <h1>
            Buat Wallet
            <br />
            pertamamu.
          </h1>
          <p className="lead">Tempat uangmu sekarang berada.</p>
          <label>
            Nama Wallet
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </label>
          <label>
            Saldo awal
            <input
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <button className="primary" onClick={() => setStep(2)}>
            Lanjutkan <b>→</b>
          </button>
        </>
      )}
      {step === 2 && (
        <>
          <p className="eyebrow">HAMPIR SELESAI</p>
          <h1>
            Satu mata uang,
            <br />
            <em>untuk semua.</em>
          </h1>
          <p className="lead">
            Kamu bisa mengubahnya kapan saja dari Settings.
          </p>
          <div className="currency-grid">
            {["IDR", "USD", "SGD", "MYR"].map((x) => (
              <button
                className={currency === x ? "choice selected" : "choice"}
                onClick={() => setCurrency(x)}
                key={x}
              >
                <span>{x === "IDR" ? "Rp" : "$"}</span>
                {x}
                <small>
                  {x === "IDR"
                    ? "Rupiah Indonesia"
                    : x === "USD"
                      ? "US Dollar"
                      : x}
                </small>
              </button>
            ))}
          </div>
          <button className="primary" onClick={done}>
            Masuk ke Spen <b>→</b>
          </button>
        </>
      )}
    </main>
  );
}

function Home({
  fmt,
  total,
  wallets,
  txs,
  onWallet,
  onAddWallet,
  onDaily,
  onPlan,
}: any) {
  return (
    <div className="page home">
      <header>
        <div>
          <p className="eyebrow">SELASA, 1 SEPTEMBER</p>
        </div>
      </header>
      <section className="balance-card">
        <p>
          Saldo total <span className="pulse">●</span>
        </p>
        <strong>{fmt(total)}</strong>
        <div>
          <span>Budget period</span>
          <b>
            1 — 30 Sep <Icon>⌄</Icon>
          </b>
        </div>
      </section>
      <section>
        <div className="section-title">
          <h2>Wallet</h2>
          <button onClick={onAddWallet}>Tambah</button>
        </div>
        <div className="wallet-row">
          {wallets.map((w: any, index: number) => (
            <button
              className={`wallet-card ${w.tint}`}
              key={`wallet-${index}-${String(w.name)}`}
              onClick={() => onWallet(w.name)}
            >
              <small>{w.name}</small>
              <b>{fmt(w.amount)}</b>
            </button>
          ))}
          <button className="wallet-add" onClick={onAddWallet}>
            ＋<small>Tambah Wallet</small>
          </button>
        </div>
      </section>
      <section className="plan-snapshot">
        <div>
          <p className="eyebrow">SPARE BUDGET</p>
          <h2>{fmt(850000)}</h2>
          <span>masih bisa dialokasikan</span>
        </div>
        <button onClick={onPlan}>
          Lihat Rencana <b>→</b>
        </button>
        <Progress value={61} />
        <div className="mini-stats">
          <span>
            Pendapatan <b>{fmt(6500000)}</b>
          </span>
          <span>
            Terpakai <b>{fmt(2175000)}</b>
          </span>
        </div>
      </section>
      <section className="recent">
        <div className="section-title">
          <h2>Terbaru</h2>
          <button onClick={onDaily}>Lihat Semua</button>
        </div>
        {txs.slice(0, 3).map((t, index) => (
          <TxRow key={`recent-${t.id}-${index}`} tx={t} fmt={fmt} />
        ))}
      </section>
    </div>
  );
}

function TxRow({ tx, fmt }: any) {
  const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "−" : "↔";
  return (
    <div className="tx-row">
      <span className={`cat-icon ${tx.type}`}>
        {cat[tx.type as TxType].find((c) => c.name === tx.category)?.icon ??
          "◇"}
      </span>
      <div>
        <b>{tx.category}</b>
        <small>
          {tx.type === "transfer"
            ? `${tx.wallet} → ${tx.to}`
            : `${tx.wallet} · ${tx.note}`}
        </small>
      </div>
      <div className={tx.type}>
        <b>
          {sign} {fmt(tx.amount)}
        </b>
        <small>{tx.time}</small>
      </div>
    </div>
  );
}

function Plan({ fmt, total, allocation, onSuggest, onPeriod, onPay }: any) {
  return (
    <div className="page plan-page">
      <header className="plan-head">
        <div>
          <h1>Rencana</h1>
          <button className="period" onClick={onPeriod}>
            1–30 Sep <b>⌄</b>
          </button>
        </div>
        <button className="ai-button" onClick={onSuggest}>
          ✦ AI Suggestion
        </button>
      </header>
      <section className="available">
        <p className="eyebrow">SALDO TERSEDIA</p>
        <strong>{fmt(total)}</strong>
        <div>
          <span>
            Tersedia bebas <b>{fmt(total - 1750000)}</b>
          </span>
          <span>
            Terikat goal <b>{fmt(1750000)}</b>
          </span>
        </div>
      </section>
      <section className="spare">
        <div>
          <p>Spare budget</p>
          <h2>{fmt(850000)}</h2>
          <small>pendapatan − fixed expense − goal</small>
        </div>
        <span className="calm-ring">61%</span>
      </section>
      <PlanCard
        title="Pendapatan"
        action="＋ Tambah"
        items={[
          {
            name: "Gaji",
            sub: "Realisasi dari transaksi",
            value: "6.500.000 / 6.500.000",
            pct: 100,
            button: "Catat",
          },
        ]}
        color="var(--income)"
        fmt={fmt}
        onPay={onPay}
      />
      <PlanCard
        title="Fixed expense"
        action="＋ Tambah"
        items={[
          {
            name: "Sewa kamar",
            sub: "Lunas ✓",
            value: "1.200.000 / 1.200.000",
            pct: 100,
            button: "Bayar",
          },
          {
            name: "Internet",
            sub: "Belum dibayar",
            value: "0 / 350.000",
            pct: 0,
            button: "Bayar",
          },
        ]}
        color="var(--expense)"
        fmt={fmt}
        onPay={onPay}
      />
      <PlanCard
        title="Goal"
        action="＋ Tambah"
        items={[
          {
            name: "Dana Nikah",
            sub: "Kontribusi bulanan Rp 500.000",
            value: "1.750.000 / 15.000.000",
            pct: 12,
            button: "Menabung",
          },
        ]}
        color="var(--gold)"
        fmt={fmt}
        onPay={onPay}
      />
      <PlanCard
        title="Alokasi"
        action="＋ Tambah"
        items={[
          {
            name: "Makan",
            sub: "Melebihi Budget",
            value: `1.350.000 / ${fmt(allocation)}`,
            pct: 135,
            button: "",
          },
          {
            name: "Transport",
            sub: "Sisa Rp 220.000",
            value: "180.000 / 400.000",
            pct: 45,
            button: "",
          },
        ]}
        color="var(--expense)"
        fmt={fmt}
        onPay={onPay}
      />
    </div>
  );
}
function PlanCard({ title, action, items, color, onPay }: any) {
  return (
    <section className="plan-card">
      <div className="section-title">
        <h2>{title}</h2>
        <button>{action}</button>
      </div>
      {items.map((i: any) => (
        <div className="plan-item" key={i.name}>
          <div className="plan-item-top">
            <span className="cat-icon expense">
              {i.name === "Dana Nikah" ? "✦" : i.name === "Gaji" ? "✦" : "◒"}
            </span>
            <div>
              <b>{i.name}</b>
              <small className={i.sub === "Melebihi Budget" ? "danger" : ""}>
                {i.sub}
              </small>
            </div>
            <strong>{i.value}</strong>
          </div>
          <Progress
            value={i.pct}
            color={i.pct > 100 ? "var(--expense)" : color}
          />
          {i.button && (
            <button className="quiet-action" onClick={onPay}>
              {i.button} →
            </button>
          )}
        </div>
      ))}
    </section>
  );
}

function Report({ fmt, onInsight, onDrill }: any) {
  const slices = [
    { n: "Makan", v: 48, c: "#d97968" },
    { n: "Sewa", v: 30, c: "#d8a94b" },
    { n: "Transport", v: 14, c: "#7e9d92" },
    { n: "Lainnya", v: 8, c: "#c9c3b9" },
  ];
  return (
    <div className="page report">
      <header>
        <div>
          <p className="eyebrow">BUDGET PERIOD</p>
          <h1>Report</h1>
        </div>
        <button className="period">1–30 Sep ⌄</button>
      </header>
      <div className="report-summary">
        <div>
          <span>Pendapatan</span>
          <b className="income">{fmt(6500000)}</b>
        </div>
        <div>
          <span>Pengeluaran</span>
          <b className="expense">{fmt(2175000)}</b>
        </div>
        <div>
          <span>Net saving</span>
          <b>{fmt(4325000)}</b>
        </div>
      </div>
      <section className="chart-card">
        <div className="section-title">
          <h2>Pengeluaran</h2>
          <span>September</span>
        </div>
        <div className="pie-area">
          <div className="pie" />
          <div className="pie-label">
            <b>{fmt(2175000)}</b>
            <small>total keluar</small>
          </div>
        </div>
        <div className="legend">
          {slices.map((s) => (
            <button key={s.n} onClick={onDrill}>
              <i style={{ background: s.c }} />
              <span>{s.n}</span>
              <b>{s.v}%</b>
            </button>
          ))}
        </div>
      </section>
      <section className="chart-card line-card">
        <div className="section-title">
          <h2>Net saving</h2>
          <button>3 bulan ⌄</button>
        </div>
        <div className="line">
          <svg viewBox="0 0 320 120" preserveAspectRatio="none">
            <path
              d="M2 100 C55 94, 58 50, 105 65 S172 42, 214 55 S275 18, 318 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              d="M2 100 C55 94, 58 50, 105 65 S172 42, 214 55 S275 18, 318 24 L318 120 L2 120Z"
              fill="currentColor"
              opacity=".1"
            />
          </svg>
          <div>
            <span>Jul</span>
            <span>Agu</span>
            <span>Sep</span>
          </div>
        </div>
      </section>
      <button className="insight-cta" onClick={onInsight}>
        <span>✦</span>
        <div>
          <b>Tanya insight untuk bulan ini</b>
          <small>Ringkas, jelas, dan bisa ditindaklanjuti.</small>
        </div>
        <i>→</i>
      </button>
    </div>
  );
}

function Settings({ dark, setDark, currency, setCurrency }: any) {
  const [toast, setToast] = useState("");
  return (
    <div className="page settings">
      <header>
        <h1>Settings</h1>
      </header>
      <p className="eyebrow group-label">TAMPILAN</p>
      <section className="setting-group">
        <div className="setting-row">
          <span className="setting-icon">◐</span>
          <div>
            <b>Theme gelap</b>
            <small>Lebih nyaman di malam hari</small>
          </div>
          <button
            className={dark ? "toggle on" : "toggle"}
            onClick={() => setDark(!dark)}
          >
            <i />
          </button>
        </div>
      </section>
      <p className="eyebrow group-label">PENGATURAN</p>
      <section className="setting-group">
        <div className="setting-row">
          <span className="setting-icon">Rp</span>
          <div>
            <b>Mata uang</b>
            <small>{currency} · tanpa konversi</small>
          </div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {["IDR", "USD", "SGD", "MYR", "EUR", "JPY"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
      </section>
      <p className="eyebrow group-label">DATA</p>
      <section className="setting-group">
        <button
          className="setting-row"
          onClick={() => setToast("Backup JSON siap dibagikan.")}
        >
          <span className="setting-icon">↓</span>
          <div>
            <b>Backup data</b>
            <small>Ekspor semua data ke JSON</small>
          </div>
          <i>›</i>
        </button>
        <button
          className="setting-row"
          onClick={() => setToast("Pilih file backup untuk memulihkan data.")}
        >
          <span className="setting-icon">↑</span>
          <div>
            <b>Restore data</b>
            <small>Timpa data dari file JSON</small>
          </div>
          <i>›</i>
        </button>
      </section>
      {toast && (
        <div className="toast">
          ✓ {toast}
          <button onClick={() => setToast("")}>×</button>
        </div>
      )}
      <div className="settings-foot">
        <span className="brand-mark">S</span>
        <b>Spen</b>
        <small>Versi 1.0 · untuk uang yang lebih tenang</small>
      </div>
    </div>
  );
}

function Daily({ fmt, txs, date, setDate, calendar, history, add }: any) {
  const dayTx = txs.filter((x: any) => x.date === date);
  const income = dayTx
    .filter((x: any) => x.type === "income")
    .reduce((a: number, x: any) => a + x.amount, 0);
  const expense = dayTx
    .filter((x: any) => x.type === "expense")
    .reduce((a: number, x: any) => a + x.amount, 0);
  const label =
    date === "2026-09-01"
      ? "Hari Ini"
      : date === "2026-08-31"
        ? "Kemarin"
        : "Sab, 30 Agu";
  const shift = (d: number) => setDate(d < 0 ? "2026-08-31" : "2026-09-01");
  return (
    <div className="page daily">
      <header className="subhead">
        <button onClick={() => history()}>‹</button>
        <div>
          <p className="eyebrow">TRANSAKSI HARIAN</p>
          <button className="date-label" onClick={calendar}>
            {label} <b>⌄</b>
          </button>
        </div>
        <button onClick={calendar}>▦</button>
      </header>
      <div className="day-step">
        <button onClick={() => shift(-1)}>‹</button>
        <span>{label}</span>
        <button onClick={() => shift(1)}>›</button>
      </div>
      <div className="day-summary">
        <div>
          <span>Masuk</span>
          <b className="income">+ {fmt(income)}</b>
        </div>
        <div>
          <span>Keluar</span>
          <b className="expense">− {fmt(expense)}</b>
        </div>
      </div>
      {dayTx.length ? (
        <section className="daily-list">
          {dayTx.map((t: any) => (
            <TxRow key={t.id} tx={t} fmt={fmt} />
          ))}
        </section>
      ) : (
        <section className="empty">
          <span>◌</span>
          <h2>Belum ada catatan</h2>
          <p>Tidak ada transaksi pada 31 Agustus.</p>
          <button className="primary" onClick={add}>
            Tambah transaksi
          </button>
        </section>
      )}
      <button className="all-history" onClick={history}>
        Lihat Semua Transaksi <b>→</b>
      </button>
    </div>
  );
}
function History({ fmt, txs, filter, setFilter }: any) {
  const filtered =
    filter === "Semua" ? txs : txs.filter((x: any) => x.category === filter);
  const groups = ["2026-09-01", "2026-08-31", "2026-08-30"];
  return (
    <div className="page history">
      <header className="subhead">
        <button>‹</button>
        <div>
          <p className="eyebrow">SEMUA CATATAN</p>
          <h1>Riwayat Transaksi</h1>
        </div>
        <button>⌕</button>
      </header>
      <div className="chips">
        {["Semua", "Makan", "Pengeluaran", "Pemasukan"].map((x) => (
          <button
            className={filter === x ? "selected" : ""}
            onClick={() => setFilter(x)}
            key={x}
          >
            {x}
          </button>
        ))}
        <button>⚱ Filter</button>
      </div>
      {groups.map((d) => {
        const arr = filtered.filter((x: any) => x.date === d);
        if (!arr.length) return null;
        return (
          <section className="history-day" key={d}>
            <div className="sticky-day">
              <b>
                {d === "2026-09-01" ? "Hari Ini, 1 Sep" : "Kemarin, 31 Agu"}
              </b>
              <span>
                {arr.reduce(
                  (a: number, x: any) =>
                    a + (x.type === "expense" ? -x.amount : x.amount),
                  0,
                ) > 0
                  ? "+"
                  : "−"}{" "}
                {fmt(
                  Math.abs(
                    arr.reduce(
                      (a: number, x: any) =>
                        a + (x.type === "expense" ? -x.amount : x.amount),
                      0,
                    ),
                  ),
                )}
              </span>
            </div>
            {arr.map((t: any) => (
              <TxRow key={t.id} tx={t} fmt={fmt} />
            ))}
          </section>
        );
      })}
      <div className="load-more">Memuat transaksi sebelumnya · · ·</div>
    </div>
  );
}

function TabBar({ active, go, add }: any) {
  return (
    <nav className="tabbar">
      <button
        className={active === "home" ? "active" : ""}
        onClick={() => go("home")}
      >
        <span>⌂</span>Beranda
      </button>
      <button
        className={active === "plan" ? "active" : ""}
        onClick={() => go("plan")}
      >
        <span>▤</span>Rencana
      </button>
      <button className="add" onClick={add} aria-label="Tambah transaksi">
        <span>＋</span>
      </button>
      <button
        className={active === "report" ? "active" : ""}
        onClick={() => go("report")}
      >
        <span>◔</span>Report
      </button>
      <button
        className={active === "settings" ? "active" : ""}
        onClick={() => go("settings")}
      >
        <span>☼</span>Settings
      </button>
    </nav>
  );
}

function Sheet({ children, close }: any) {
  return (
    <div className="overlay" onMouseDown={close}>
      <div className="sheet" onMouseDown={(e) => e.stopPropagation()}>
        <i className="grab" />
        {children}
      </div>
    </div>
  );
}
function WalletSheet({ wallet, fmt, close, correct }: any) {
  return (
    <Sheet close={close}>
      <div className="sheet-wallet">
        <span className={`big-wallet ${wallet.tint}`}>{wallet.name[0]}</span>
        <p>{wallet.name}</p>
        <h1>{fmt(wallet.amount)}</h1>
      </div>
      <div className="sheet-actions">
        <button onClick={correct}>
          <span>±</span>
          <div>
            <b>Koreksi saldo</b>
            <small>Buat transaksi penyesuaian</small>
          </div>
          <i>›</i>
        </button>
        <button>
          <span>✎</span>
          <div>
            <b>Edit Wallet</b>
            <small>Ubah nama Wallet</small>
          </div>
          <i>›</i>
        </button>
        <button className="danger">
          <span>⌑</span>
          <div>
            <b>Arsipkan Wallet</b>
            <small>Transaksi tetap tersimpan</small>
          </div>
          <i>›</i>
        </button>
      </div>
    </Sheet>
  );
}
function WalletForm({ fmt, close, save }: any) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <div className="full-modal">
      <header>
        <button onClick={close}>×</button>
        <h2>Wallet baru</h2>
        <button
          onClick={() => save(name || "Wallet baru", Number(amount) || 0)}
        >
          Simpan
        </button>
      </header>
      <div className="form">
        <p className="form-note">Wallet adalah tempat uangmu disimpan.</p>
        <label>
          Nama Wallet
          <input
            placeholder="Mis. Jago, Tunai, GoPay"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </label>
        <label>
          Saldo awal
          <input
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <small>
            Saldo ini bisa dikoreksi nanti melalui transaksi penyesuaian.
          </small>
        </label>
      </div>
    </div>
  );
}
function TransactionForm({
  fmt,
  wallets,
  categories,
  setCategories,
  close,
  save,
}: any) {
  const [type, setType] = useState<TxType>("expense");
  const [wallet, setWallet] = useState(wallets[0]);
  const [to, setTo] = useState(wallets[1] || wallets[0]);
  const [category, setCategory] = useState("Makan");
  const [amount, setAmount] = useState("");
  const [editor, setEditor] = useState<"new" | "edit" | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [icon, setIcon] = useState("◒");
  const changeType = (t: TxType) => {
    setType(t);
    setCategory(categories[t][0].name);
    setEditor(null);
  };
  const openEditor = (mode: "new" | "edit") => {
    const current = categories[type].find((x: any) => x.name === category);
    setCategoryName(mode === "edit" ? category : "");
    setIcon(mode === "edit" ? current?.icon || "◒" : "◒");
    setEditor(mode);
  };
  const saveCategory = () => {
    const name = categoryName.trim();
    if (!name) return;
    if (editor === "new") {
      setCategories({
        ...categories,
        [type]: [...categories[type], { name, icon }],
      });
      setCategory(name);
    } else {
      setCategories({
        ...categories,
        [type]: categories[type].map((x: any) =>
          x.name === category ? { name, icon } : x,
        ),
      });
      setCategory(name);
    }
    setEditor(null);
  };
  const archive = () => {
    if (categories[type].length <= 1) return;
    const rest = categories[type].filter((x: any) => x.name !== category);
    setCategories({ ...categories, [type]: rest });
    setCategory(rest[0].name);
    setEditor(null);
  };
  const submit = () => {
    if (!amount) return;
    save({
      id: Date.now(),
      type,
      amount: Number(amount),
      category: type === "transfer" ? "Transfer" : category,
      wallet,
      to: type === "transfer" ? to : undefined,
      note: type === "income" ? "Catatan baru" : "Dicatat dari Spen",
      date: "2026-09-01",
      time: "10.24",
    });
  };
  return (
    <div className="full-modal tx-form">
      <header>
        <button onClick={close}>×</button>
        <h2>Tambah Transaksi</h2>
        <button onClick={submit}>Simpan</button>
      </header>
      <div className="form">
        <div className="type-tabs">
          {(["income", "expense", "transfer"] as TxType[]).map((t) => (
            <button
              className={type === t ? `selected ${t}` : ""}
              onClick={() => changeType(t)}
              key={t}
            >
              {t === "income"
                ? "Masuk"
                : t === "expense"
                  ? "Keluar"
                  : "Transfer"}
            </button>
          ))}
        </div>
        <label>
          {type === "transfer" ? "Dari Wallet" : "Wallet"}
          <select value={wallet} onChange={(e) => setWallet(e.target.value)}>
            {wallets.map((w: string, index: number) => (
              <option key={`from-wallet-${index}-${w}`}>{w}</option>
            ))}
          </select>
        </label>
        {type === "transfer" && (
          <label>
            Ke Wallet
            <select value={to} onChange={(e) => setTo(e.target.value)}>
              {wallets
                .filter((w: string) => w !== wallet)
                .map((w: string, index: number) => (
                  <option key={`to-wallet-${index}-${w}`}>{w}</option>
                ))}
            </select>
          </label>
        )}
        {type !== "transfer" && (
          <div>
            <div className="label-line">
              <span>Kategori</span>
              <button onClick={() => openEditor("edit")}>
                Kelola kategori
              </button>
            </div>
            <div className="category-grid">
              {categories[type].map((c: any, index: number) => (
                <button
                  className={category === c.name ? "selected" : ""}
                  onClick={() => setCategory(c.name)}
                  key={`category-${type}-${index}`}
                >
                  <span>{c.icon}</span>
                  {c.name}
                </button>
              ))}
              <button onClick={() => openEditor("new")}>
                <span>＋</span>Tambah
              </button>
            </div>
            {editor && (
              <div className="category-editor">
                <div className="editor-top">
                  <b>{editor === "new" ? "Kategori baru" : "Edit kategori"}</b>
                  <button onClick={() => setEditor(null)}>×</button>
                </div>
                <label>
                  Nama kategori
                  <input
                    autoFocus
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Mis. Kesehatan"
                  />
                </label>
                <span className="icon-label">Pilih ikon</span>
                <div className="icon-library">
                  {[
                    "◒",
                    "◉",
                    "▧",
                    "⌂",
                    "♪",
                    "✦",
                    "☕",
                    "✈",
                    "♥",
                    "✚",
                    "♧",
                    "⌁",
                    "◎",
                    "☀",
                    "◈",
                  ].map((i, index) => (
                    <button
                      className={icon === i ? "selected" : ""}
                      onClick={() => setIcon(i)}
                      key={`icon-${index}-${i}`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
                <div className="editor-actions">
                  <button className="save-category" onClick={saveCategory}>
                    Simpan kategori
                  </button>
                  {editor === "edit" && (
                    <button className="archive-category" onClick={archive}>
                      Arsipkan
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <label>
          Nominal
          <input
            className="amount-input"
            inputMode="numeric"
            placeholder="Rp 0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label>
          Catatan <input placeholder="Opsional" />
        </label>
        {type === "expense" && Number(amount) > 1200000 && (
          <div className="soft-warning">
            Perlahan ya — ini akan melebihi alokasi Makan, tetapi tetap bisa
            dicatat.
          </div>
        )}
        <button className="primary" onClick={submit}>
          Simpan transaksi
        </button>
      </div>
    </div>
  );
}
function Suggestion({ loading, fmt, applied, apply, close }: any) {
  const tips = [
    {
      t: "Rapikan alokasi Makan",
      d: "Realisasi sudah melewati rencana. Naikkan alokasi dari Rp 1.200.000 menjadi Rp 1.500.000 agar rencanamu lebih realistis.",
    },
    {
      t: "Jaga ruang untuk goal",
      d: "Dengan spare budget saat ini, kontribusi Dana Nikah Rp 500.000 masih nyaman untuk dipertahankan.",
    },
    {
      t: "Sisihkan buffer kecil",
      d: "Tambahkan alokasi “Tak terduga” sebesar Rp 250.000 dari spare budget.",
    },
  ];
  return (
    <Sheet close={close}>
      <div className="ai-sheet-head">
        <span>✦</span>
        <div>
          <p className="eyebrow">AI SUGGESTION</p>
          <h2>
            Rencana yang lebih
            <br />
            <em>lega.</em>
          </h2>
        </div>
      </div>
      {loading ? (
        <div className="ai-loading">
          <span>✦</span>
          <b>Membaca pola keuanganmu…</b>
          <small>Menyiapkan saran yang bisa kamu pilih.</small>
        </div>
      ) : (
        <div className="suggestions">
          {tips.map((x, i) => (
            <article key={x.t}>
              <span>{i + 1}</span>
              <div>
                <b>{x.t}</b>
                <p>{x.d}</p>
                <button
                  className={applied.includes(i) ? "applied" : ""}
                  onClick={() => apply(i)}
                >
                  {applied.includes(i) ? "✓ Diterapkan" : "Terapkan"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <button className="sheet-close" onClick={close}>
        Selesai
      </button>
    </Sheet>
  );
}
function Insight({ loading, close }: any) {
  return (
    <Sheet close={close}>
      <div className="ai-sheet-head">
        <span>✦</span>
        <div>
          <p className="eyebrow">AI INSIGHT</p>
          <h2>September, sejauh ini.</h2>
        </div>
      </div>
      {loading ? (
        <div className="ai-loading">
          <span>✦</span>
          <b>Menghubungkan titik-titik…</b>
        </div>
      ) : (
        <div className="insight">
          <p>
            Pengeluaranmu bulan ini masih terkendali. <b>Makan</b> menjadi
            kategori terbesar (48%), dan sudah melampaui alokasi yang dibuat.
          </p>
          <p>
            Net saving-mu <b>Rp 4.325.000</b> — naik dibanding bulan lalu. Ini
            ruang yang baik untuk menjaga Dana Nikah tetap bergerak.
          </p>
          <div>
            ✦ <span>Langkah kecil minggu ini</span>
            <b>
              Coba batasi makan di luar hingga Rp 150.000 untuk sisa periode.
            </b>
          </div>
        </div>
      )}
      <button className="sheet-close" onClick={close}>
        Mengerti
      </button>
    </Sheet>
  );
}
function Calendar({ date, select, close }: any) {
  return (
    <Sheet close={close}>
      <div className="calendar">
        <div>
          <button>‹</button>
          <h2>September 2026</h2>
          <button>›</button>
        </div>
        <p>Sen Sel Rab Kam Jum Sab Min</p>
        <div className="calendar-grid">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
            <button
              className={n === 1 ? "selected" : ""}
              onClick={() => select(n === 1 ? "2026-09-01" : "2026-08-31")}
              key={n}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
function Period({ close }: any) {
  return (
    <Sheet close={close}>
      <div className="period-sheet">
        <p className="eyebrow">BUDGET PERIOD</p>
        <h2>Mulai periode</h2>
        <p>Tentukan tanggal agar rencana mengikuti ritme gajianmu.</p>
        <div className="start-days">
          {[1, 5, 10, 15, 25].map((d) => (
            <button className={d === 1 ? "selected" : ""} key={d}>
              {d}
            </button>
          ))}
        </div>
        <button className="primary" onClick={close}>
          Simpan perubahan
        </button>
      </div>
    </Sheet>
  );
}
