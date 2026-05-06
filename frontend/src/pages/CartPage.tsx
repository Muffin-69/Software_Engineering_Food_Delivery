import { useMemo, useState } from "react";
import "../styles/Dashboard.css";
import "../styles/Restaurant.css";
import "../styles/Cart.css";
import type { Restaurant } from "../data/restaurants";
import { placeOrder } from "../data/restaurantApi";

/* ──────────────────────────────────────────────────────────────
   Cart / Checkout page

   Calls the backend's POST /orders endpoint to actually create
   the order in Supabase. The returned order's real id is then
   passed up to the confirmation screen.
   ────────────────────────────────────────────────────────────── */

type CartPageProps = {
  restaurant: Restaurant;
  cart: Record<number, number>;
  setCart: (next: Record<number, number>) => void;
  customerId: number;
  userName?: string | null;
  onBack: () => void;
  onPlaceOrder: (info: {
    orderId: number;
    total: number;
    restaurantName: string;
  }) => void;
};

export default function CartPage({
  restaurant,
  cart,
  setCart,
  customerId,
  userName,
  onBack,
  onPlaceOrder,
}: CartPageProps) {
  const [payment, setPayment] = useState<"cash">("cash");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = useMemo(
    () =>
      restaurant.dishes
        .map((d) => ({ dish: d, qty: cart[d.id] ?? 0 }))
        .filter((l) => l.qty > 0),
    [restaurant, cart]
  );

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.dish.price) * l.qty, 0),
    [lines]
  );
  const deliveryFee = 2.5;
  const total = subtotal + deliveryFee;

  const setQty = (dishId: number, qty: number) => {
    const next = { ...cart };
    if (qty <= 0) delete next[dishId];
    else next[dishId] = qty;
    setCart(next);
  };

  const handlePlaceOrder = async () => {
    if (lines.length === 0 || submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const order = await placeOrder({
        customer_id: customerId,
        restaurant_id: restaurant.id,
        items: lines.map((l) => ({
          dish_id: l.dish.id,
          quantity: l.qty,
        })),
      });
      onPlaceOrder({
        orderId: order.id,
        total,
        restaurantName: restaurant.name,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="bg-blob bg-blob--teal" />
      <div className="bg-blob bg-blob--amber" />

      <aside className="sidebar">
        <div className="sidebar-logo">
          Eat<span>out!</span>
        </div>
        <nav className="sidebar-nav">
          <a className="nav-item nav-item--active">New order</a>
          <a className="nav-item">Check status</a>
          <a className="nav-item">Order history</a>
        </nav>
        <div className="sidebar-footer">
          <a className="footer-link">Contact us</a>
          <a className="footer-link">Privacy Policy</a>
          <button className="logout-btn">Log Out</button>
        </div>
      </aside>

      <div className="dashboard-main">
        <div className="topbar">
          <button className="upgrade-btn" onClick={onBack}>
            ← Back to {restaurant.name}
          </button>
          <p className="topbar-greeting">
            Hi there, <span>{userName ?? "guest"}</span>
          </p>
        </div>

        <div className="cart-header">
          <h1 className="cart-title">Your order</h1>
          <p className="cart-subtitle">From {restaurant.name}</p>
        </div>

        {lines.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <button className="add-btn" onClick={onBack}>
              Browse menu
            </button>
          </div>
        ) : (
          <>
            <div className="cart-lines">
              {lines.map(({ dish, qty }) => (
                <div className="cart-line" key={dish.id}>
                  <div className="cart-line-info">
                    <div className="dish-name">{dish.name}</div>
                    <div className="dish-price">
                      ${Number(dish.price).toFixed(2)} each
                    </div>
                  </div>
                  <div className="qty-control">
                    <button
                      className="qty-btn"
                      onClick={() => setQty(dish.id, qty - 1)}
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="qty-value">{qty}</span>
                    <button
                      className="qty-btn"
                      onClick={() => setQty(dish.id, qty + 1)}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-line-total">
                    ${(Number(dish.price) * qty).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-section">
              <h2 className="section-heading">Payment method</h2>
              <label className="payment-row">
                <input
                  type="radio"
                  name="payment"
                  checked={payment === "cash"}
                  onChange={() => setPayment("cash")}
                />
                <span>Cash on delivery</span>
              </label>
              <label className="payment-row payment-row--disabled">
                <input type="radio" name="payment" disabled />
                <span>Card payment (coming soon)</span>
              </label>
            </div>

            <div className="cart-section">
              <div className="totals-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="totals-row">
                <span>Delivery fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="totals-row totals-row--grand">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {error && (
              <div
                style={{
                  margin: "0 28px 8px",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: 13,
                  background: "rgba(231,29,54,0.1)",
                  color: "var(--color-red, #e71d36)",
                  border: "1px solid rgba(231,29,54,0.3)",
                }}
              >
                {error}
              </div>
            )}

            <div className="cart-submit-row">
              <button
                className="cart-cta cart-cta--full"
                onClick={handlePlaceOrder}
                disabled={submitting}
              >
                {submitting
                  ? "Placing order…"
                  : `Place order • $${total.toFixed(2)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
