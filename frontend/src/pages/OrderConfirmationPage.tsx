import "../styles/Dashboard.css";
import "../styles/Cart.css";

/* ──────────────────────────────────────────────────────────────
   Order Confirmation page

   Shown after a successful "Place order" action. Displays the
   order id, total, and restaurant — and gives the user a way
   back to the restaurant list to start a new order.
   ────────────────────────────────────────────────────────────── */

type OrderConfirmationPageProps = {
  orderId: number;
  total: number;
  restaurantName: string;
  onBackHome: () => void;
};

export default function OrderConfirmationPage({
  orderId,
  total,
  restaurantName,
  onBackHome,
}: OrderConfirmationPageProps) {
  return (
    <div className="dashboard-page">
      <div className="bg-blob bg-blob--teal" />
      <div className="bg-blob bg-blob--amber" />

      {/* ── Sidebar (same shell) ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          Eat<span>out!</span>
        </div>
        <nav className="sidebar-nav">
          <a className="nav-item">New order</a>
          <a className="nav-item nav-item--active">Check status</a>
          <a className="nav-item">Order history</a>
        </nav>
        <div className="sidebar-footer">
          <a className="footer-link">Contact us</a>
          <a className="footer-link">Privacy Policy</a>
          <button className="logout-btn">Log Out</button>
        </div>
      </aside>

      <div className="dashboard-main">
        <div className="confirmation-card">
          <div className="confirmation-checkmark" aria-hidden>
            ✓
          </div>
          <h1 className="confirmation-title">Order placed!</h1>
          <p className="confirmation-sub">
            Thanks — your order from <em>{restaurantName}</em> is on its way.
          </p>

          <div className="confirmation-details">
            <div className="detail-row">
              <span>Order number</span>
              <strong>#{orderId}</strong>
            </div>
            <div className="detail-row">
              <span>Total paid</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
            <div className="detail-row">
              <span>Status</span>
              <span className="status-badge">Pending</span>
            </div>
          </div>

          <button className="cart-cta cart-cta--full" onClick={onBackHome}>
            Back to restaurants
          </button>
        </div>
      </div>
    </div>
  );
}
