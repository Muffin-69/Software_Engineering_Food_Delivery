import { useEffect, useMemo, useState } from "react";
import {
  getOrdersByRestaurant,
  updateOrderStatus,
  type Order,
} from "../data/restaurantApi";
import type { Restaurant } from "../data/restaurants";

/* ──────────────────────────────────────────────────────────────
   Owner — Incoming orders tab

   Lists every order placed against this restaurant, fetched from
   GET /orders/restaurant/{id}. Active orders (pending /
   preparing / on-the-way) get action buttons to mark them done
   or cancelled. Completed orders (delivered / cancelled) are
   shown read-only and can be hidden via a toggle.
   ────────────────────────────────────────────────────────────── */

const ACTIVE_STATUSES = new Set(["pending", "preparing", "on-the-way"]);

type Props = {
  restaurantId: number;
  restaurant: Restaurant | undefined;
};

function StatusBadge({ status }: { status: string }) {
  return <span className={`order-status order-status--${status}`}>{status}</span>;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function OwnerOrdersTab({ restaurantId, restaurant }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<number | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Map dish_id → dish for fast lookups when rendering line items
  const dishById = useMemo(() => {
    const m = new Map<number, { name: string; price: number }>();
    if (restaurant) for (const d of restaurant.dishes) m.set(d.id, d);
    return m;
  }, [restaurant]);

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await getOrdersByRestaurant(restaurantId);
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
  }, [restaurantId]);

  const updateStatus = async (orderId: number, status: string) => {
    setError(null);
    setBusyOrderId(orderId);
    try {
      await updateOrderStatus(orderId, status);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update order.");
    } finally {
      setBusyOrderId(null);
    }
  };

  const active = orders.filter((o) => ACTIVE_STATUSES.has(o.status));
  const completed = orders.filter((o) => !ACTIVE_STATUSES.has(o.status));

  const renderOrderCard = (order: Order, isActive: boolean) => {
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
              Customer #{order.customer_id} · {formatDate(order.created_at)}
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="order-items">
          {order.order_items.length === 0 ? (
            <div className="order-meta">No items</div>
          ) : (
            order.order_items.map((it) => {
              const dish = dishById.get(it.dish_id);
              const name = dish?.name ?? `Dish #${it.dish_id} (removed)`;
              const lineTotal = Number(it.unit_price) * it.quantity;
              return (
                <div className="order-item-row" key={it.id}>
                  <span>
                    <strong>{it.quantity}×</strong> {name}
                  </span>
                  <span>${lineTotal.toFixed(2)}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="order-total-row">
          <span>Total</span>
          <strong>${total.toFixed(2)}</strong>
        </div>

        {isActive && (
          <div className="order-actions">
            <button
              className="cart-cta order-action-done"
              disabled={busyOrderId === order.id}
              onClick={() => updateStatus(order.id, "delivered")}
            >
              {busyOrderId === order.id ? "…" : "Mark as done"}
            </button>
            <button
              className="owner-danger-btn"
              disabled={busyOrderId === order.id}
              onClick={() => updateStatus(order.id, "cancelled")}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="owner-section">
      <div className="orders-toolbar">
        <h2 className="owner-section-title" style={{ margin: 0 }}>
          Incoming orders
        </h2>
        <div className="orders-toolbar-actions">
          <label className="owner-hint" style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              style={{ marginRight: 6 }}
            />
            Show completed ({completed.length})
          </label>
          <button
            className="upgrade-btn"
            onClick={refresh}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
        </div>
      </div>

      {error && <div className="owner-banner owner-banner--error">{error}</div>}

      {loading && orders.length === 0 ? (
        <p className="owner-hint" style={{ paddingTop: 12 }}>
          Loading orders…
        </p>
      ) : (
        <>
          {/* Active orders */}
          <div className="orders-section-label">
            Active ({active.length})
          </div>
          {active.length === 0 ? (
            <p className="owner-hint" style={{ paddingTop: 4, paddingBottom: 16 }}>
              No active orders right now.
            </p>
          ) : (
            <div className="order-list">
              {active.map((o) => renderOrderCard(o, true))}
            </div>
          )}

          {/* Completed orders (toggle) */}
          {showCompleted && (
            <>
              <div
                className="orders-section-label"
                style={{ marginTop: 24 }}
              >
                Completed ({completed.length})
              </div>
              {completed.length === 0 ? (
                <p className="owner-hint" style={{ paddingTop: 4 }}>
                  Nothing here yet.
                </p>
              ) : (
                <div className="order-list">
                  {completed.map((o) => renderOrderCard(o, false))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
