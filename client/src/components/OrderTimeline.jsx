import { formatPeso, formatDate, STATUS_LABELS } from "../utils/format";

const STEPS = [
  { key: "ordered", label: "Ordered" },
  { key: "pending", label: "Pending" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Done" },
];

function statusProgress(status) {
  const map = { pending: 1, preparing: 2, ready: 3, completed: 4 };
  return map[status] ?? 1;
}

export default function OrderTimeline({ order }) {
  const progress = statusProgress(order.status);

  return (
    <div className="order-timeline">
      <div className="order-timeline-header" style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
        <div>
          <h4>
            {order.id} · {order.bouquet}
          </h4>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            {order.pickupLocation} · {formatDate(order.pickupDate)}
          </p>
        </div>
        <span className={`order-status status-${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
      </div>
      <div className="timeline-steps">
        {STEPS.map((step, i) => {
          const done = i <= progress;
          const current = i === progress;
          return (
            <div key={step.key} className={`t-step${done ? " done" : ""}${current ? " current" : ""}`}>
              <div className="t-dot">{done ? (current && order.status !== "completed" ? "⏳" : "✓") : ""}</div>
              <div className="t-label">{step.label}</div>
            </div>
          );
        })}
      </div>
      <div className="order-meta" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.5rem", fontSize: "0.88rem" }}>
        <span>
          <strong>Payment:</strong> {order.paymentMethod}
        </span>
        <span>
          <strong>Qty:</strong> {order.quantity}
        </span>
        <span>
          <strong>Total:</strong> {formatPeso(order.totalPrice)}
        </span>
      </div>
    </div>
  );
}
