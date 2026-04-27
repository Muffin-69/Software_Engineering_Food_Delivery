import { useState } from "react";
import "../styles/Dashboard.css";

const RESTAURANTS = [
  {
    id: 1,
    name: "Bella Italia",
    desc: "Authentic Italian pasta, pizza & risotto tailored to your taste",
    rating: 4,
  },
  {
    id: 2,
    name: "Sakura Garden",
    desc: "Japanese sushi & ramen dishes recommended just for you",
    rating: 3,
  },
  {
    id: 3,
    name: "Burger District",
    desc: "Gourmet burgers and sides based on your order history",
    rating: 5,
  },
  {
    id: 4,
    name: "Green Bowl",
    desc: "Healthy salads and grain bowls matched to your preferences",
    rating: 4,
  },
];

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

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [cartCount] = useState(0);

  const filtered = RESTAURANTS.filter(
    (r) =>
      search.trim() === "" ||
      r.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <button className="logout-btn">Log Out</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="dashboard-main">
        {/* Top bar */}
        <div className="topbar">
          <p className="topbar-greeting">
            Hi there, <span>*customer_user_name*</span>
          </p>
          <button className="upgrade-btn">Upgrade to Gold</button>
        </div>

        {/* Search row */}
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
              placeholder="Type restaurant's name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter icon */}
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

          {/* Cart icon */}
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
            {cartCount > 0 && <span>{cartCount}</span>}
          </button>
        </div>

        {/* Cards */}
        <div className="cards-list">
          {filtered.length === 0 ? (
            <p style={{ color: "rgba(1,22,39,0.35)", fontSize: 13, padding: "8px 0" }}>
              No restaurants found.
            </p>
          ) : (
            filtered.map((r) => (
              <div className="restaurant-card" key={r.id}>
                <div className="card-picture">Picture</div>
                <div className="card-body">
                  <div className="card-title">{r.name}</div>
                  <div className="card-desc">{r.desc}</div>
                  <Stars rating={r.rating} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}