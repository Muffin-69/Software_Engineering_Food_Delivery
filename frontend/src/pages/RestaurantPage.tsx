import { useMemo, useState } from "react";
import "../styles/Dashboard.css";
import "../styles/Restaurant.css";
import { findRestaurantById } from "../data/restaurants";

/* ──────────────────────────────────────────────────────────────
   Restaurant menu page

   Shows a single restaurant's hero (name, description, rating)
   and its dish list. Lets the user add dishes to the cart and
   either continue shopping or jump to the cart/checkout screen
   via the floating bar at the bottom.

   The cart can be either:
     • controlled by the parent (cart + setCart props provided)
     • or self-contained (no props provided — useful for
       previewing this page on its own).
   ────────────────────────────────────────────────────────────── */

type RestaurantPageProps = {
  restaurantId?: number;
  cart?: Record<number, number>;
  setCart?: (next: Record<number, number>) => void;
  onBack?: () => void;
  onCheckout?: () => void; // called when the floating bar's button is clicked
};

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="card-stars">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`star${i < rating ? " star--filled" : ""}`}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function RestaurantPage({
  restaurantId = 1,
  cart: cartProp,
  setCart: setCartProp,
  onBack,
  onCheckout,
}: RestaurantPageProps) {
  const restaurant = findRestaurantById(restaurantId);

  // Fall back to local state if the parent doesn't manage the cart.
  const [internalCart, setInternalCart] = useState<Record<number, number>>({});
  const cart = cartProp ?? internalCart;
  const setCart = setCartProp ?? setInternalCart;

  const setQty = (dishId: number, qty: number) => {
    const next = { ...cart };
    if (qty <= 0) delete next[dishId];
    else next[dishId] = qty;
    setCart(next);
  };

  const inc = (dishId: number) => setQty(dishId, (cart[dishId] ?? 0) + 1);
  const dec = (dishId: number) => setQty(dishId, (cart[dishId] ?? 0) - 1);

  const { itemCount, total } = useMemo(() => {
    if (!restaurant) return { itemCount: 0, total: 0 };
    let count = 0;
    let total = 0;
    for (const dish of restaurant.dishes) {
      const qty = cart[dish.id] ?? 0;
      count += qty;
      total += qty * dish.price;
    }
    return { itemCount: count, total };
  }, [cart, restaurant]);

  if (!restaurant) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-main" style={{ padding: 28 }}>
          <p>Restaurant not found.</p>
          {onBack && (
            <button className="upgrade-btn" onClick={onBack}>
              ← Back
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleCartBarClick = () => {
    if (onCheckout) {
      onCheckout();
    } else {
      // Standalone preview fallback
      alert(
        `Order ready!\n${itemCount} item(s) • $${total.toFixed(
          2
        )}\n(Demo only — wire onCheckout for full flow.)`
      );
    }
  };

  return (
    <div className="dashboard-page">
      <div className="bg-blob bg-blob--teal" />
      <div className="bg-blob bg-blob--amber" />

      {/* ── Sidebar (same as Dashboard) ── */}
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
            ← Back to restaurants
          </button>
          <p className="topbar-greeting">
            Hi there, <span>*customer_user_name*</span>
          </p>
        </div>

        <div className="restaurant-hero">
          <div className="hero-picture">Picture</div>
          <div className="hero-body">
            <h1 className="hero-title">{restaurant.name}</h1>
            <p className="hero-desc">{restaurant.description}</p>
            <Stars rating={restaurant.rating} />
          </div>
        </div>

        <div className="menu-section">
          <h2 className="menu-heading">Menu</h2>
          <div className="dish-list">
            {restaurant.dishes.map((dish) => {
              const qty = cart[dish.id] ?? 0;
              return (
                <div className="dish-row" key={dish.id}>
                  <div className="dish-info">
                    <div className="dish-name">{dish.name}</div>
                    <div className="dish-price">${dish.price.toFixed(2)}</div>
                  </div>

                  {qty === 0 ? (
                    <button className="add-btn" onClick={() => inc(dish.id)}>
                      + Add
                    </button>
                  ) : (
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => dec(dish.id)}
                        aria-label="Decrease"
                      >
                        −
                      </button>
                      <span className="qty-value">{qty}</span>
                      <button
                        className="qty-btn"
                        onClick={() => inc(dish.id)}
                        aria-label="Increase"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {itemCount > 0 && (
          <div className="cart-bar">
            <div className="cart-summary">
              <strong>{itemCount}</strong>{" "}
              {itemCount === 1 ? "item" : "items"}
              <span className="cart-dot">•</span>${total.toFixed(2)}
            </div>
            <button className="cart-cta" onClick={handleCartBarClick}>
              View cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
