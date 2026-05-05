import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { useAuth } from "../context/AuthContext";
import { searchRestaurants, getCustomerOrders } from "../services/api";

function Stars({ rating = 0, max = 5 }) {
  return (
    <div className="card-stars">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={`star ${i < rating ? "star--filled" : ""}`}>
          ★
        </span>
      ))}
    </div>
  );
}

function Spinner() {
  return <div className="spinner" />;
}

function ViewContainer({ children }) {
  return <div className="view-container">{children}</div>;
}

function NewOrderView() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) return;

    setLoading(true);
    setError("");

    try {
      const data = await searchRestaurants(search.trim());
      console.log(data);
      setRestaurants(Array.isArray(data) ? data : []);
      setHasSearched(true);
    } catch (e) {
      setError(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }, [search]);

  return (
    <>
      <div className="search-row">
        <input
          className="search-input"
          value={search}
          placeholder="Search restaurants..."
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />

        <button className="icon-btn" onClick={handleSearch} disabled={loading}>
          {loading ? <Spinner /> : "🔍"}
        </button>
      </div>

      {error && <div className="view-error">{error}</div>}

      <div className="cards-list">
        {!hasSearched && (
          <div className="view-hint">Search to start ordering</div>
        )}

        {hasSearched && restaurants.length === 0 && (
          <div className="view-hint">No restaurants found</div>
        )}

        {restaurants.map((r) => (
          <div
            className="restaurant-card"
            key={r.id}
            onClick={() =>
              navigate(`/restaurants/${r.id}`, {
                state: { restaurant: r },
              })
            }
          >
            <div className="card-picture">🍽️</div>

            <div className="card-body">
              <div className="card-title">{r.name}</div>
              <div className="card-desc">{r.description}</div>
              <Stars rating={Math.round(r.rating || 0)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function OrderHistoryView({ user }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    getCustomerOrders(user.id).then((data) => {
      console.log(data);
      setOrders(Array.isArray(data) ? data : []);
    });
  }, [user]);

  return (
    <div className="cards-list">
      {orders.length === 0 && <div className="view-hint">No orders yet</div>}

      {orders.map((o) => (
        <div className="restaurant-card" key={o.id}>
          <div className="card-body">
            <div
              className="card-header"
              style={{ display: "flex", justifyContent: "space-between" }}
            >
              <div className="card-title">Order #{o.id}</div>
              <div
                className="card-date"
                style={{ fontSize: "0.8rem", color: "#666" }}
              >
                {o.created_at}
              </div>
            </div>

            <div className="card-desc">
              <strong>Status:</strong> {o.status}
            </div>
            <hr />

            <div
              className="card-details"
              style={{ fontSize: "0.9rem", marginTop: "10px" }}
            >
              <div>
                <strong>Restaurant ID:</strong> {o.restaurant_id}
              </div>

              <div className="items-section" style={{ marginTop: "8px" }}>
                <strong>Dishes:</strong>
                {o.items.length > 0 ? (
                  <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                    {o.items.map((item, index) => (
                      <li key={index}>
                        Dish ID: {item.dish_id} —{" "}
                        <span style={{ color: "#666" }}>
                          Quantity: {item.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontStyle: "italic", color: "#999" }}>
                    No items in this order
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("new");

  return (
    <div className="dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-logo">
          Eat<span>out</span>
        </div>

        <button
          className={`nav-item ${active === "new" ? "active" : ""}`}
          onClick={() => setActive("new")}
        >
          New order
        </button>

        <button
          className={`nav-item ${active === "history" ? "active" : ""}`}
          onClick={() => setActive("history")}
        >
          Order history
        </button>

        <button
          className="logout-btn"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Log out
        </button>
      </aside>

      <main className="dashboard-main">
        <div className="topbar">
          <div className="greeting">Hi, welcome to EatOut</div>
        </div>

        <div className="dashboard-content">
          {active === "new" && (
            <ViewContainer>
              <NewOrderView />
            </ViewContainer>
          )}

          {active === "history" && (
            <ViewContainer>
              <OrderHistoryView user={user} />
            </ViewContainer>
          )}
        </div>
      </main>
    </div>
  );
}
