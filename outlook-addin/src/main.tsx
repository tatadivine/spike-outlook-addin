import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { getGraphAccessToken } from "./auth";
import { getSpikeOSIdentityHeaders } from "./identity";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Inbox,
  Mail,
  RefreshCw,
} from "lucide-react";
import "./styles.css";

declare const Office: any;

type InboxMessage = {
  id: string;
  subject: string;
  sender: string;
  sender_email: string;
  received_at?: string;
  age_hours: number;
  preview: string;
  category: string;
  excluded: boolean;
  exclusion_reason?: string;
  sla_hours: number;
  status: "needs_response" | "overdue" | "excluded" | "completed";
  status_label: string;
  is_read?: boolean;
  web_link?: string;
};

type InboxSummary = {
  mode: "live" | "mock";
  summary: {
    total: number;
    relevant: number;
    needs_response: number;
    overdue: number;
    excluded: number;
  };
  messages: InboxMessage[];
  message?: string;
};

type MessageContext = {
  message_id: string;
  category: string;
  status: string;
  excluded: boolean;
  exclusion_reason?: string;
  priority: string;
  recommended_action: string;
  response_score: number;
  open_commitments: number;
  within_24h_pct: number;
};

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const SPIKEOS_URL = import.meta.env.VITE_SPIKEOS_URL || "http://localhost:3000";

function jsonHeaders() {
  return { "Content-Type": "application/json", ...getSpikeOSIdentityHeaders() };
}

function formatAge(hours: number) {
  if (hours < 1) return "<1h";
  if (hours < 24) return `${Math.round(hours)}h`;
  return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
}

async function loadInbox(): Promise<InboxSummary> {
  const graphToken = await getGraphAccessToken();
  const response = await fetch(`${API}/outlook/inbox-summary`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ graph_access_token: graphToken, top: 25 }),
  });
  if (!response.ok) throw new Error(`SpikeOS API returned ${response.status}`);
  return (await response.json()) as InboxSummary;
}

async function loadMessageContext(message: InboxMessage): Promise<MessageContext | null> {
  try {
    const response = await fetch(`${API}/outlook/message-context`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        message_id: message.id,
        subject: message.subject,
        sender: message.sender_email,
        body_preview: message.preview,
        received_at: message.received_at,
      }),
    });
    if (!response.ok) return null;
    return (await response.json()) as MessageContext;
  } catch {
    return null;
  }
}

async function addCommitment(message: InboxMessage): Promise<boolean> {
  const dueDate = new Date(Date.now() + 2 * 24 * 3600000).toISOString().slice(0, 10);
  try {
    const response = await fetch(`${API}/commitments`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        title: message.subject,
        source: message.sender,
        due_date: dueDate,
        next_action: "Respond and confirm next step with the sender.",
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function App() {
  const [view, setView] = useState<"summary" | "detail">("summary");
  const [selected, setSelected] = useState<InboxMessage | null>(null);
  const [context, setContext] = useState<MessageContext | null>(null);
  const [inbox, setInbox] = useState<InboxSummary | null>(null);
  const [compact, setCompact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [commitmentState, setCommitmentState] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  const load = async () => {
    setRefreshing(true);
    setLoadError("");
    try {
      const data = await loadInbox();
      setInbox(data);
    } catch (err) {
      // Honest failure — never substitute fabricated inbox content when
      // the backend is unreachable.
      setLoadError(
        err instanceof Error
          ? `Could not reach the SpikeOS API (${err.message}). Check that the backend is running and VITE_API_BASE_URL is correct.`
          : "Could not reach the SpikeOS API.",
      );
      setInbox(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (typeof Office === "undefined") {
      setLoadError("Office.js is not running. Open this page from within Outlook.");
      setLoading(false);
      return;
    }

    Office.onReady(async () => {
      await load();
      try {
        Office.context.mailbox.addHandlerAsync(Office.EventType.ItemChanged, () => {
          setView("summary");
          setSelected(null);
          setContext(null);
        });
      } catch {
        // Older Outlook clients may not expose ItemChanged in this context.
      }
    });
  }, []);

  const summary = inbox?.summary;
  const attention = useMemo(
    () => (inbox?.messages || []).filter((m) => m.status !== "excluded").slice(0, 6),
    [inbox],
  );

  const openMessage = async (message: InboxMessage) => {
    setSelected(message);
    setContext(null);
    setCommitmentState("idle");
    setView("detail");
    const ctx = await loadMessageContext(message);
    setContext(ctx);
  };

  const handleAddCommitment = async () => {
    if (!selected) return;
    setCommitmentState("saving");
    const ok = await addCommitment(selected);
    setCommitmentState(ok ? "saved" : "failed");
  };

  return (
    <div className={`panel ${compact ? "compact" : ""}`}>
      <header>
        <div className="brand">
          <div className="bolt">⚡</div>
          <div>
            <strong>SPIKEOS</strong>
            <small>Communication Intelligence</small>
          </div>
        </div>
        <div className="actions">
          <button className="icon-button" title="Refresh inbox" onClick={load}>
            <RefreshCw size={13} className={refreshing ? "spin" : ""} />
          </button>
          <button className="icon-button" title="Collapse" onClick={() => setCompact(!compact)}>
            {compact ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <span className="bell">
            <Bell size={11} /> {summary?.overdue || 0}
          </span>
        </div>
      </header>

      {loadError && <div className="notice error">{loadError}</div>}
      {!loadError && inbox?.mode === "mock" && inbox.message && <div className="notice">{inbox.message}</div>}

      {loading ? (
        <div className="loading">
          <RefreshCw size={16} className="spin" /> Loading your communication summary…
        </div>
      ) : !inbox ? (
        <main>
          <p className="subtext">Nothing to show until the SpikeOS API is reachable.</p>
          <button className="dashboard-button" onClick={load}>
            Try again
          </button>
        </main>
      ) : view === "summary" ? (
        <main>
          <div className="eyebrow">
            <Inbox size={11} /> YOUR COMMUNICATION TODAY
          </div>
          <h1>Inbox Intelligence</h1>
          <p className="subtext">A summary of the messages in your Outlook inbox that may require attention.</p>

          <section className="metric-grid">
            <Metric value={summary?.total ?? 0} label="Inbox" />
            <Metric value={summary?.needs_response ?? 0} label="Need reply" tone="amber" />
            <Metric value={summary?.overdue ?? 0} label="Overdue" tone="red" />
            <Metric value={summary?.excluded ?? 0} label="Excluded" tone="muted" />
          </section>

          {!compact && (
            <>
              <div className="section-heading">
                <span>Attention needed</span>
                <span className="count">{attention.length}</span>
              </div>

              {attention.length === 0 ? (
                <p className="subtext">Nothing needs a reply right now.</p>
              ) : (
                <section className="message-list">
                  {attention.map((message) => (
                    <button className="message-row" key={message.id} onClick={() => openMessage(message)}>
                      <div className="status-dot" data-status={message.status} />
                      <div className="message-copy">
                        <div className="message-top">
                          <strong>{message.sender}</strong>
                          <span>{formatAge(message.age_hours)}</span>
                        </div>
                        <div className="message-subject">{message.subject}</div>
                        <div className="message-preview">{message.preview}</div>
                      </div>
                      <ChevronDown size={13} className="row-arrow" />
                    </button>
                  ))}
                </section>
              )}

              <button
                className="dashboard-button"
                onClick={() => window.open(`${SPIKEOS_URL}/dashboard`, "_blank")}
                style={{ marginTop: 12 }}
              >
                Open full SpikeOS dashboard →
              </button>
            </>
          )}
        </main>
      ) : (
        <main>
          <button className="back-button" onClick={() => setView("summary")}>
            <ArrowLeft size={14} /> Back to inbox summary
          </button>
          {selected && (
            <>
              <div className="eyebrow">
                <Mail size={11} /> MESSAGE INTELLIGENCE
              </div>
              <h1>{selected.subject}</h1>
              <p className="sender">
                {selected.sender} · {selected.sender_email}
              </p>

              {!context ? (
                <div className="loading" style={{ minHeight: 120 }}>
                  <RefreshCw size={14} className="spin" /> Classifying message…
                </div>
              ) : (
                <>
                  <section className={`alert ${context.status}`}>
                    <div className="alert-title">
                      {context.status === "overdue" ? (
                        <>
                          <AlertTriangle size={14} /> RESPONSE OVERDUE
                        </>
                      ) : context.status === "excluded" ? (
                        <>
                          <CheckCircle2 size={14} /> EXCLUDED FROM SCORING
                        </>
                      ) : (
                        <>
                          <Clock3 size={14} /> RESPONSE NEEDED
                        </>
                      )}
                    </div>
                    <div>
                      {context.excluded
                        ? context.exclusion_reason
                        : `${formatAge(selected.age_hours)} open · SLA ${selected.sla_hours}h · ${context.category}`}
                    </div>
                  </section>

                  {!context.excluded && (
                    <div className="lifecycle">
                      <span className="active">RECEIVED</span>
                      <span>ACKNOWLEDGED</span>
                      <span>ANSWERED</span>
                      <span>CLOSED</span>
                    </div>
                  )}

                  <div className="card">
                    <div className="muted">Message preview</div>
                    <p>{selected.preview}</p>
                  </div>

                  {!context.excluded && (
                    <div className="card">
                      <div className="muted">Recommended action</div>
                      <strong>{context.recommended_action}</strong>
                      <button
                        className="primary"
                        onClick={() => selected.web_link && window.open(selected.web_link, "_blank")}
                        disabled={!selected.web_link}
                      >
                        Open message in Outlook
                      </button>
                      <button
                        className="secondary"
                        onClick={handleAddCommitment}
                        disabled={commitmentState === "saving" || commitmentState === "saved"}
                      >
                        {commitmentState === "saved" ? "Commitment added" : "Add commitment"}
                      </button>
                      {commitmentState === "saved" && (
                        <p className="success-text">
                          <CheckCircle2 size={12} /> Logged in SpikeOS — visible on your Commitments page.
                        </p>
                      )}
                      {commitmentState === "failed" && (
                        <p className="notice error" style={{ margin: "8px 0 0" }}>
                          Could not save the commitment. Try again from the full dashboard.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="stats">
                    <div>
                      <b>{context.response_score}</b>
                      <small>Response score</small>
                    </div>
                    <div>
                      <b>{context.open_commitments}</b>
                      <small>Open commitments</small>
                    </div>
                    <div>
                      <b>{context.within_24h_pct}%</b>
                      <small>Within 24h</small>
                    </div>
                  </div>

                  <button className="link" onClick={() => window.open(`${SPIKEOS_URL}/communication`, "_blank")}>
                    View full record in SpikeOS →
                  </button>
                </>
              )}
            </>
          )}
        </main>
      )}

      <footer>AI-assisted findings are informational and require human review before negative performance use.</footer>
    </div>
  );
}

function Metric({ value, label, tone = "" }: { value: number; label: string; tone?: string }) {
  return (
    <div className={`metric ${tone}`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
