import { useEffect, useMemo, useState } from "react";
import "../styles/Dashboard.css";
import "../styles/Owner.css"; // reuses .order-card / .order-status classes
import { getOrdersByCustomer, type Order } from "../data/restaurantApi";
import type { Restaurant } from "../data/restaurants";

/* ──────────────────────────────────────────────────────────────
   Order History — shows every order this customer has ever
   placed, sorted newest first. Read-only. Status badge
   indicates whether the order is still in progress, delivered,
   or cancelled.
   ────────────────────────────────────────────────────────────── */

type Props = {
  customerId: number;
  restaurants: Restaurant[];
  userName?: string | null;
  isLoggedIn?: boolean;
  onGoToDashboard: () => void;
  onGoToCheckStatus: () => void;
  onLogout?: () => void;
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`order-status order-status--${status}`}>{status}</span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function OrderHistoryPage({
  customerId,
  restaurants,
  userName,
  isLoggedIn,
  onGoToDashboard,
  onGoToCheckStatus,
  onLogout,
}: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const restaurantById = useMemo(() => {
    const m = new Map<number, Restaurant>();
    for (const r of restaurants) m.set(r.id, r);
    return m;
  }, [restaurants]);

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await getOrdersByCustomer(customerId);
      setOrders(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  return (
    <div className="dashboard-page">
      <div className="bg-blob bg-blob--teal" />
      <div className="bg-blob bg-blob--amber" />

      <aside className="sidebar">
        <div className="sidebar-logo">
          Eat<span>out!</span>
        </div>
        <nav className="sidebar-nav">
          <a
            className="nav-item"
            style={{ cursor: "pointer" }}
            onClick={onGoToDashboard}
          >
            New order
          </a>
          <a
            className="nav-item"
            style={{ cursor: "pointer" }}
            onClick={onGoToCheckStatus}
          >
            Check status
          </a>
          <a className="nav-item nav-item--active">Order history</a>
        </nav>
        <div className="sidebar-footer">
          <a className="footer-link">Contact us</a>
          <a className="footer-link">Privacy Policy</a>
          <button className="logout-btn" onClick={onLogout}>
            {isLoggedIn ? "Log Out" : "Sign in"}
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <div className="topbar">
          <button className="upgrade-btn" onClick={onGoToDashboard}>
            ← Back to restaurants
          </button>
          <p className="topbar-greeting">
            Hi there, <span>{userName ?? "guest"}</span>
          </p>
        </div>

        <section className="owner-section">
          <div className="orders-toolbar">
            <h2 className="owner-section-title" style={{ margin: 0 }}>
              Order history
            </h2>
            <button
              className="upgrade-btn"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "↻ Refresh"}
            </button>
          </div>

          {error && (
            <div className="owner-banner owner-banner--error">{error}</div>
          )}

          {loading && orders.length === 0 ? (
            <p className="owner-hint" style={{ paddingTop: 12 }}>
              Loading orders…
            </p>
          ) : orders.length === 0 ? (
            <p className="owner-hint" style={{ paddingTop: 12 }}>
              You haven't placed any orders yet.
            </p>
          ) : (
            <div className="order-list">
              {orders.map((order) => {
                const restaurant = restaurantById.get(order.restaurant_id);
                const total = order.order_items.reduce(
                  (sum, it) => sum + Number(it.unit_price) * it.quantity,
                  0
                );
                return (
                  <div className="order-card" key={order.id}>
                    <div className="order-card-head">
                      <div>
                        <div className="order-id">Order #{order.id}</div>
                        <div className="order-meta">
                          {restaurant?.name ?? "Unknown restaurant"} ·{" "}
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="order-items">
                      {order.order_items.map((it) => {
                        const dish = restaurant?.dishes.find(
                          (d) => d.id === it.dish_id
                        );
                        const name =
                          dish?.name ?? `Dish #${it.dish_id} (removed)`;
                        return (
                          <div className="order-item-row" key={it.id}>
                            <span>
                              <strong>{it.quantity}×</strong> {name}
                            </span>
                            <span>
                              $
                              {(Number(it.unit_price) * it.quantity).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="order-total-row">
                      <span>Total</span>
                      <strong>${total.toFixed(2)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
