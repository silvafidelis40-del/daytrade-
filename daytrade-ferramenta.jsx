import { useState, useMemo, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function formatBRL(v) {
  const abs = Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `R$ ${abs}`;
}
function hoje() {
  return new Date().toISOString().split("T")[0];
}
function parseDateBR(d) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}`;
}
function calcDARF(operacoes, mesIdx, ano) {
  const ops = operacoes.filter(o => {
    const d = new Date(o.data + "T12:00:00");
    return d.getMonth() === mesIdx && d.getFullYear() === ano;
  });
  const lucro = ops.reduce((acc, o) => acc + o.valor, 0);
  if (lucro <= 0) return { lucro, darf: 0, vencimento: null };
  const irrf = lucro * 0.01;
  const darf = lucro * 0.20 - irrf;
  const mesPag = mesIdx === 11 ? 0 : mesIdx + 1;
  const anoPag = mesIdx === 11 ? ano + 1 : ano;
  const venc = `${anoPag}-${String(mesPag + 1).padStart(2, "0")}-20`;
  return { lucro, darf: darf < 10 ? 0 : parseFloat(darf.toFixed(2)), vencimento: venc };
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 16px" }}>
      <div style={{ fontWeight: 700, fontSize: 15, fontFamily: "monospace", color: val >= 0 ? "#4ade80" : "#f87171" }}>
        {val >= 0 ? "+" : "−"}{formatBRL(Math.abs(val))}
      </div>
    </div>
  );
}

function ModalEntrada({ tipo, onSalvar, onFechar }) {
  const [valor, setValor] = useState("");
  const [data, setData] = useState(hoje());
  const [nota, setNota] = useState("");
  const ehGanho = tipo === "ganho";
  const cor = ehGanho ? "#16a34a" : "#dc2626";
  const corClaro = ehGanho ? "#4ade80" : "#f87171";

  function salvar() {
    const num = parseFloat(valor.replace(",", "."));
    if (!num || num <= 0) return;
    onSalvar({ valor: ehGanho ? num : -num, data, nota });
    onFechar();
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "flex-end", zIndex: 200 }}>
      <div style={{ background: "#1e293b", borderRadius: "20px 20px 0 0", padding: "28px 22px 40px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: corClaro }}>
            {ehGanho ? "✅ Quanto ganhei?" : "❌ Quanto perdi?"}
          </div>
          <button onClick={onFechar} style={{ background: "none", border: "none", color: "#64748b", fontSize: 26, cursor: "pointer", padding: 0 }}>×</button>
        </div>
        <div style={{ background: "#0f172a", borderRadius: 14, padding: "16px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22, color: "#64748b", fontWeight: 700 }}>R$</span>
          <input
            autoFocus type="number" placeholder="0,00"
            value={valor} onChange={e => setValor(e.target.value)}
            onKeyDown={e => e.key === "Enter" && salvar()}
            style={{ flex: 1, background: "none", border: "none", color: corClaro, fontSize: 36, fontWeight: 800, fontFamily: "monospace", outline: "none", width: "100%" }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 5 }}>Data</div>
          <input type="date" value={data} onChange={e => setData(e.target.value)}
            style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "11px 12px", color: "#f1f5f9", fontSize: 14, boxSizing: "border-box" }} />
        </div>
        <input type="text" placeholder="Anotação (opcional) — ex: PETR4" value={nota} onChange={e => setNota(e.target.value)}
          style={{ width: "100%", background: "#0f172a", border: "1px solid #334155", borderRadius: 10, padding: "11px 12px", color: "#f1f5f9", fontSize: 14, boxSizing: "border-box", marginBottom: 18 }} />
        <button onClick={salvar}
          style={{ width: "100%", background: cor, border: "none", borderRadius: 12, padding: "16px", color: "#fff", fontSize: 18, fontWeight: 800, cursor: "pointer" }}>
          Salvar
        </button>
      </div>
    </div>
  );
}

function NavBar({ tela, setTela }) {
  const nav = { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#1e293b", borderTop: "1px solid #334155", display: "flex", zIndex: 100 };
  const btn = (a) => ({ flex: 1, background: "none", border: "none", color: a ? "#4ade80" : "#475569", padding: "13px 0 10px", cursor: "pointer", fontSize: 11, fontWeight: a ? 700 : 400, borderTop: a ? "2px solid #4ade80" : "2px solid transparent", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 });
  return (
    <div style={nav}>
      {[{ id: "inicio", e: "🏠", l: "Início" }, { id: "historico", e: "📋", l: "Histórico" }, { id: "impostos", e: "🧾", l: "Impostos" }].map(i => (
        <button key={i.id} style={btn(tela === i.id)} onClick={() => setTela(i.id)}>
          <span style={{ fontSize: 22 }}>{i.e}</span>{i.l}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth();

  // ── Persistência localStorage ──────────────────────────────────────────────
  const [operacoes, setOperacoes] = useState(() => {
    try {
      const salvo = localStorage.getItem("daytrade_ops");
      return salvo ? JSON.parse(salvo) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { localStorage.setItem("daytrade_ops", JSON.stringify(operacoes)); } catch {}
  }, [operacoes]);

  const [modal, setModal] = useState(null);
  const [tela, setTela] = useState("inicio");

  function salvar(op) { setOperacoes(prev => [...prev, { id: Date.now(), ...op }]); }
  function deletar(id) { setOperacoes(prev => prev.filter(o => o.id !== id)); }

  const saldo = useMemo(() => operacoes.reduce((a, o) => a + o.valor, 0), [operacoes]);
  const ganhos = useMemo(() => operacoes.filter(o => o.valor > 0).reduce((a, o) => a + o.valor, 0), [operacoes]);
  const perdas = useMemo(() => operacoes.filter(o => o.valor < 0).reduce((a, o) => a + o.valor, 0), [operacoes]);

  // ── Resumo do mês atual ────────────────────────────────────────────────────
  const resumoMes = useMemo(() => {
    const ops = operacoes.filter(o => {
      const d = new Date(o.data + "T12:00:00");
      return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
    });
    const resultado = ops.reduce((a, o) => a + o.valor, 0);
    const darf = calcDARF(operacoes, mesAtual, anoAtual).darf;
    return { ops: ops.length, resultado, darf };
  }, [operacoes, mesAtual, anoAtual]);

  // ── Gráfico ────────────────────────────────────────────────────────────────
  const dadosGrafico = useMemo(() => {
    const sorted = [...operacoes].sort((a, b) => new Date(a.data) - new Date(b.data));
    let acc = 0;
    const pontos = [{ label: "Início", acumulado: 0 }];
    sorted.forEach(o => {
      acc += o.valor;
      pontos.push({ label: parseDateBR(o.data), acumulado: parseFloat(acc.toFixed(2)) });
    });
    return pontos;
  }, [operacoes]);

  // ── Alertas DARF ───────────────────────────────────────────────────────────
  const darfAlertas = useMemo(() => {
    const alertas = [];
    const agora = new Date();
    for (let i = 0; i <= 1; i++) {
      const mes = mesAtual - i;
      const ano = mes < 0 ? anoAtual - 1 : anoAtual;
      const mesIdx = mes < 0 ? 12 + mes : mes;
      const d = calcDARF(operacoes, mesIdx, ano);
      if (d.darf > 0) {
        const venc = new Date(d.vencimento + "T12:00:00");
        const dias = Math.ceil((venc - agora) / 86400000);
        alertas.push({ mes: MESES[mesIdx], ...d, dias, vencida: dias < 0 });
      }
    }
    return alertas;
  }, [operacoes, mesAtual, anoAtual]);

  const totalDarfAno = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => calcDARF(operacoes, i, anoAtual).darf).reduce((a, b) => a + b, 0),
  [operacoes, anoAtual]);

  const recentes = useMemo(() =>
    [...operacoes].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 4),
  [operacoes]);

  const page = { minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", fontFamily: "system-ui, sans-serif", paddingBottom: 80, maxWidth: 480, margin: "0 auto" };

  // ── TELA INÍCIO ─────────────────────────────────────────────────────────────
  if (tela === "inicio") return (
    <div style={page}>
      {/* Saldo total */}
      <div style={{ background: "#0f172a", padding: "20px 20px 0", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>Saldo total</div>
        <div style={{ fontFamily: "monospace", fontSize: 40, fontWeight: 900, color: saldo >= 0 ? "#4ade80" : "#f87171", lineHeight: 1 }}>
          {saldo >= 0 ? "+" : "−"}{formatBRL(Math.abs(saldo))}
        </div>
        <div style={{ display: "flex", gap: 18, marginTop: 10, paddingBottom: 14 }}>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: "#64748b" }}>Ganhos </span>
            <span style={{ color: "#4ade80", fontFamily: "monospace", fontWeight: 700 }}>{formatBRL(ganhos)}</span>
          </div>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: "#64748b" }}>Perdas </span>
            <span style={{ color: "#f87171", fontFamily: "monospace", fontWeight: 700 }}>{formatBRL(Math.abs(perdas))}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 18px 0" }}>

        {/* ── Resumo do mês — NOVO ── */}
        <div style={{
          background: "linear-gradient(135deg, #0f2a1a, #1a3a2a)",
          border: "1px solid #166534", borderRadius: 14,
          padding: "14px 18px", marginBottom: 14,
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700, marginBottom: 2 }}>
              {MESES[mesAtual]}
            </div>
            <div style={{ fontSize: 13, color: "#86efac" }}>
              {resumoMes.ops === 0
                ? "Nenhuma operação ainda"
                : `${resumoMes.ops} operaç${resumoMes.ops > 1 ? "ões" : "ão"}`}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {resumoMes.ops > 0 && (
              <>
                <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 18, color: resumoMes.resultado >= 0 ? "#4ade80" : "#f87171" }}>
                  {resumoMes.resultado >= 0 ? "+" : "−"}{formatBRL(Math.abs(resumoMes.resultado))}
                </div>
                {resumoMes.darf > 0 && (
                  <div style={{ fontSize: 12, color: "#fbbf24", marginTop: 2 }}>
                    DARF {formatBRL(resumoMes.darf)}
                  </div>
                )}
                {resumoMes.darf === 0 && resumoMes.resultado > 0 && (
                  <div style={{ fontSize: 12, color: "#4ade80", marginTop: 2 }}>✓ Isento de DARF</div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Gráfico */}
        <div style={{ background: "#1e293b", borderRadius: 16, padding: "16px 8px 10px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#64748b", paddingLeft: 12, marginBottom: 10 }}>Evolução do saldo</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={dadosGrafico} margin={{ left: -10, right: 10, top: 4, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v >= 0 ? "+" : ""}${v}`} />
              <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 4" />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="acumulado" stroke={saldo >= 0 ? "#4ade80" : "#f87171"} strokeWidth={2.5}
                dot={(props) => <circle key={props.index} cx={props.cx} cy={props.cy} r={props.index === 0 ? 3 : 4} fill={props.value >= 0 ? "#4ade80" : "#f87171"} />}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Alertas DARF */}
        {darfAlertas.map((d, i) => (
          <div key={i} style={{ background: d.vencida ? "#450a0a" : "#1c1209", border: `1px solid ${d.vencida ? "#7f1d1d" : "#78350f"}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, color: d.vencida ? "#fca5a5" : "#fbbf24", fontWeight: 700 }}>
                {d.vencida ? "⚠️ DARF vencida!" : "🧾 DARF a pagar"}
              </div>
              <div style={{ fontSize: 12, color: "#92400e", marginTop: 3 }}>
                {d.mes} · {d.vencida ? `Venceu há ${Math.abs(d.dias)} dias` : `Vence em ${d.dias} dias (dia 20)`}
              </div>
            </div>
            <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 20, color: "#fbbf24" }}>{formatBRL(d.darf)}</div>
          </div>
        ))}

        {/* Botões Ganhei / Perdi */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
          <button onClick={() => setModal("ganho")} style={{ background: "linear-gradient(135deg, #14532d, #16a34a)", border: "none", borderRadius: 16, padding: "22px 10px", color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 32 }}>✅</span>Ganhei
          </button>
          <button onClick={() => setModal("perda")} style={{ background: "linear-gradient(135deg, #7f1d1d, #dc2626)", border: "none", borderRadius: 16, padding: "22px 10px", color: "#fff", fontSize: 17, fontWeight: 800, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 32 }}>❌</span>Perdi
          </button>
        </div>

        {/* Últimas operações */}
        {recentes.length > 0 && (
          <div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 10, fontWeight: 600 }}>Últimas operações</div>
            {recentes.map(o => (
              <div key={o.id} style={{ background: "#1e293b", borderRadius: 12, padding: "13px 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 18, color: o.valor >= 0 ? "#4ade80" : "#f87171" }}>
                    {o.valor >= 0 ? "+" : "−"}{formatBRL(Math.abs(o.valor))}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{parseDateBR(o.data)}{o.nota ? ` · ${o.nota}` : ""}</div>
                </div>
                <button onClick={() => deletar(o.id)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 20, padding: 6 }}>✕</button>
              </div>
            ))}
            {operacoes.length > 4 && (
              <button onClick={() => setTela("historico")} style={{ width: "100%", background: "none", border: "1px solid #334155", borderRadius: 10, padding: "11px", color: "#64748b", fontSize: 13, cursor: "pointer", marginTop: 4 }}>
                Ver todas ({operacoes.length} operações) →
              </button>
            )}
          </div>
        )}

        {operacoes.length === 0 && (
          <div style={{ textAlign: "center", padding: "32px 20px", color: "#334155" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#475569" }}>Sem operações ainda</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Clique em Ganhei ou Perdi para começar</div>
          </div>
        )}

        {/* Indicador de dados salvos */}
        <div style={{ textAlign: "center", padding: "16px 0 4px" }}>
          <span style={{ fontSize: 11, color: "#1e3a5f" }}>💾 Dados salvos automaticamente</span>
        </div>
      </div>

      {modal && <ModalEntrada tipo={modal} onSalvar={salvar} onFechar={() => setModal(null)} />}
      <NavBar tela={tela} setTela={setTela} />
    </div>
  );

  // ── TELA HISTÓRICO ───────────────────────────────────────────────────────────
  if (tela === "historico") return (
    <div style={page}>
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontWeight: 800, fontSize: 20 }}>Histórico</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{operacoes.length} operações · saldo {saldo >= 0 ? "+" : "−"}{formatBRL(Math.abs(saldo))}</div>
      </div>
      <div style={{ padding: "16px 18px" }}>
        {[...operacoes].sort((a, b) => new Date(b.data) - new Date(a.data)).map(o => (
          <div key={o.id} style={{ background: "#1e293b", borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 20, color: o.valor >= 0 ? "#4ade80" : "#f87171" }}>
                {o.valor >= 0 ? "+" : "−"}{formatBRL(Math.abs(o.valor))}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginTop: 3 }}>{parseDateBR(o.data)}{o.nota ? ` · ${o.nota}` : ""}</div>
            </div>
            <button onClick={() => deletar(o.id)} style={{ background: "#450a0a", border: "none", borderRadius: 8, color: "#fca5a5", cursor: "pointer", padding: "8px 14px", fontSize: 13 }}>Apagar</button>
          </div>
        ))}
        {operacoes.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: "#334155" }}>Sem operações ainda.</div>
        )}
      </div>
      <NavBar tela={tela} setTela={setTela} />
    </div>
  );

  // ── TELA IMPOSTOS ────────────────────────────────────────────────────────────
  if (tela === "impostos") return (
    <div style={page}>
      <div style={{ padding: "20px 18px 16px", borderBottom: "1px solid #1e293b" }}>
        <div style={{ fontWeight: 800, fontSize: 20 }}>Impostos {anoAtual}</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>DARF mensal e Imposto de Renda</div>
      </div>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ background: "#1e293b", borderRadius: 14, padding: "18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Total DARF no ano</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>Código: 6015</div>
          </div>
          <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 24, color: "#fbbf24" }}>{formatBRL(totalDarfAno)}</div>
        </div>

        {Array.from({ length: 12 }, (_, i) => {
          const d = calcDARF(operacoes, i, anoAtual);
          if (d.lucro === 0) return null;
          const venc = d.vencimento ? new Date(d.vencimento + "T12:00:00") : null;
          const agora = new Date();
          const dias = venc ? Math.ceil((venc - agora) / 86400000) : null;
          const vencida = dias !== null && dias < 0 && d.darf > 0;
          return (
            <div key={i} style={{ background: "#1e293b", borderLeft: `4px solid ${d.darf > 0 ? (vencida ? "#ef4444" : "#fbbf24") : "#22c55e"}`, borderRadius: "0 12px 12px 0", padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{MESES[i]}</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
                  Resultado: <span style={{ color: d.lucro >= 0 ? "#4ade80" : "#f87171", fontFamily: "monospace", fontWeight: 700 }}>
                    {d.lucro >= 0 ? "+" : "−"}{formatBRL(Math.abs(d.lucro))}
                  </span>
                </div>
                {d.darf > 0 && (
                  <div style={{ fontSize: 12, color: vencida ? "#f87171" : dias <= 7 ? "#fbbf24" : "#64748b", marginTop: 3 }}>
                    {vencida ? `⚠️ Vencida há ${Math.abs(dias)} dias` : `Vence em ${dias} dias`}
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                {d.darf > 0
                  ? <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 18, color: "#fbbf24" }}>{formatBRL(d.darf)}</div>
                  : <div style={{ color: "#22c55e", fontWeight: 700, fontSize: 14 }}>✓ Isento</div>}
              </div>
            </div>
          );
        })}

        {Array.from({ length: 12 }, (_, i) => calcDARF(operacoes, i, anoAtual).lucro).every(l => l === 0) && (
          <div style={{ textAlign: "center", padding: 40, color: "#334155" }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🧾</div>
            <div style={{ fontSize: 14, color: "#475569" }}>Nenhuma operação ainda neste ano.</div>
          </div>
        )}

        <div style={{ background: "#0f1a2e", border: "1px solid #1e3a5f", borderRadius: 14, padding: "18px", marginTop: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#60a5fa", marginBottom: 12 }}>📋 Imposto de Renda anual</div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.9 }}>
            Declare em <strong style={{ color: "#f1f5f9" }}>março/abril de {anoAtual + 1}</strong> na aba<br />
            <strong style={{ color: "#f1f5f9" }}>Renda Variável → Day Trade</strong><br /><br />
            Resultado {anoAtual}: <span style={{ fontFamily: "monospace", fontWeight: 700, color: saldo >= 0 ? "#4ade80" : "#f87171" }}>{saldo >= 0 ? "+" : "−"}{formatBRL(Math.abs(saldo))}</span><br />
            Pago em DARF: <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#fbbf24" }}>{formatBRL(totalDarfAno)}</span>
          </div>
        </div>
      </div>
      <NavBar tela={tela} setTela={setTela} />
    </div>
  );
}
