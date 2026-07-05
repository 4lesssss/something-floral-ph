import { formatDate, STATUS_LABELS } from "../utils/format";

export default function OrderMobileCards({ orders, renderStatus }) {
  if (!orders.length) return null;

  return (
    <div className="order-cards-mobile">
      {orders.map((o) => (
        <article key={o.id} className="order-card-mobile" data-status={o.status}>
          <div className="row">
            <strong>{o.id}</strong>
            {renderStatus ? (
              renderStatus(o)
            ) : (
              <span className={`order-status status-${o.status}`}>{STATUS_LABELS[o.status]}</span>
            )}
          </div>
          <div className="row">
            <span>Customer</span>
            <span>{o.fullName}</span>
          </div>
          <div className="row">
            <span>Product</span>
            <span>
              {o.bouquet} × {o.quantity}
            </span>
          </div>
          <div className="row">
            <span>Payment</span>
            <span>{o.paymentMethod}</span>
          </div>
          <div className="row">
            <span>Pickup</span>
            <span>
              {o.pickupLocation} · {formatDate(o.pickupDate)}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}
