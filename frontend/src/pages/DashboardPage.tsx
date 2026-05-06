import { useMemo, useState } from "react";
import "../styles/Dashboard.css";
import "../styles/Restaurant.css"; // for the floating .cart-bar styling
import { RESTAURANTS, getAllTags } from "../data/restaurants";

/* ──────────────────────────────────────────────────────────────
   Dashboard / restaurant list

   Lets the user search by name/tag/dish, filter by a single
   food-type tag, and click a card to open its menu.

   If a cart is already in progress (on a restaurant the user
   left earlier), a small "Continue your order" bar floats at
   the bottom and links straight back to that restaurant.
   ────────────────────────────────────────────────────────────── */

type DashboardPageProps = {
  onSelectRestaurant?: (restaurantId: number) => void;
  /** Pre-computed cart summary so Dashboard doesn't need to
      know about the cart's internal shape. Hidden when undefined. */
  resumeCart?: {
    restaurantName: string;
    itemCount: number;
    total: number;
    onResume: () => void;
  };
  /** Switch to the restaurant-owner editor view (guest-only convenience). */
  onGoToOwnerView?: () => void;
  /** Display name shown in the greeting. Falls back to "guest". */
  userName?: string | null;
  /** Whether a real user is logged in. Controls the bottom-left
      sidebar action — "Log Out" if true, "Sign in" if not. */
  isLoggedIn?: boolean;
  /** Triggered by the bottom-left sidebar button. */
  onLogout?: () => void;
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

export default function Dashboard({
  onSelectRestaurant,
  resumeCart,
  onGoToOwnerView,
  userName,
  isLoggedIn,
  onLogout,
}: DashboardPageProps) {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = useMemo(() => getAllTags(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return RESTAURANTS.filter((r) => {
      // Tag filter (if any) — restaurant must include the active tag
      if (activeTag && !r.tags.includes(activeTag)) return false;

      // Search filter (if any) — match name, tag, or dish name
      if (q === "") return true;
      if (r.name.toLowerCase().includes(q)) return true;
      if (r.tags.some((t) => t.toLowerCase().includes(q))) return true;
      if (r.dishes.some((d) => d.name.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [search, activeTag]);

  const toggleTag = (tag: string) => {
    setActiveTag((cur) => (cur === tag ? null : tag));
  };

  return (
    <div className="dashboard-page">
      <div className="bg-blob bg-blob--teal" />
      <div className="bg-blob bg-blob--amber" />

      {/* ── Sidebar ── */}
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
          {onGoToOwnerView && !isLoggedIn && (
            <a
              className="footer-link"
              style={{ cursor: "pointer" }}
              onClick={onGoToOwnerView}
            >
              Restaurant view
            </a>
          )}
          <button className="logout-btn" onClick={onLogout}>
            {isLoggedIn ? "Log Out" : "Sign in"}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="dashboard-main">
        <div className="topbar">
          <p className="topbar-greeting">
            Hi there, <span>{userName ?? "guest"}</span>
          </p>
          <button className="upgrade-btn">Upgrade to Gold</button>
        </div>

        <div className="search-row">
          <div className="search-wrap">
            <svg
              className="search-icon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="Type a restaurant, tag or dish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button className="icon-btn" title="Filter">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>

          <button className="icon-btn cart-btn" title="Cart">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {resumeCart && resumeCart.itemCount > 0 && (
              <span>{resumeCart.itemCount}</span>
            )}
          </button>
        </div>

        {/* Tag filter chips */}
        <div className="tag-filter-row">
          <button
            className={`tag-chip tag-chip--filter${
              activeTag === null ? " tag-chip--active" : ""
            }`}
            onClick={() => setActiveTag(null)}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`tag-chip tag-chip--filter${
                activeTag === tag ? " tag-chip--active" : ""
              }`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="cards-list">
          {filtered.length === 0 ? (
            <p
              style={{
                color: "rgba(1,22,39,0.35)",
                fontSize: 13,
                padding: "8px 0",
              }}
            >
              No restaurants found.
            </p>
          ) : (
            filtered.map((r) => (
              <div
                className="restaurant-card"
                key={r.id}
                onClick={() => onSelectRestaurant?.(r.id)}
                role={onSelectRestaurant ? "button" : undefined}
                tabIndex={onSelectRestaurant ? 0 : undefined}
              >
                <div className="card-picture">Picture</div>
                <div className="card-body">
                  <div className="card-title">{r.name}</div>
                  <div className="card-desc">{r.description}</div>
                  <div className="card-meta">
                    <Stars rating={r.rating} />
                    <div className="card-tags">
                      {r.tags.map((t) => (
                        <span className="tag-chip tag-chip--card" key={t}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Floating "Continue your order" bar */}
        {resumeCart && resumeCart.itemCount > 0 && (
          <div className="cart-bar">
            <div className="cart-summary">
              Continue order from <strong>{resumeCart.restaurantName}</strong>
              <span className="cart-dot">•</span>
              {resumeCart.itemCount}{" "}
              {resumeCart.itemCount === 1 ? "item" : "items"}
              <span className="cart-dot">•</span>$
              {resumeCart.total.toFixed(2)}
            </div>
            <button className="cart-cta" onClick={resumeCart.onResume}>
              View cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
