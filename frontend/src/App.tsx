import { useCallback, useEffect, useMemo, useState } from "react";
import Dashboard from "./pages/DashboardPage.tsx";
import RestaurantPage from "./pages/RestaurantPage.tsx";
import CartPage from "./pages/CartPage.tsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage.tsx";
import OwnerMenuEditPage from "./pages/OwnerMenuEditPage.tsx";
import WelcomePage from "./pages/WelcomePage.tsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import OrderHistoryPage from "./pages/OrderHistoryPage.tsx";
import CheckStatusPage from "./pages/CheckStatusPage.tsx";
import { findRestaurantById, type Restaurant } from "./data/restaurants";
import { listRestaurants } from "./data/restaurantApi";
import {
  getCurrentUser,
  logout as authLogout,
  type User,
} from "./data/authApi";
import "./App.css";

/* ──────────────────────────────────────────────────────────────
   App / screen switcher

   Data flow:
     • On mount we fetch the full restaurant list from the
       FastAPI backend (which talks to Supabase). That list is
       the source of truth for the customer-facing pages and
       gets re-fetched after the owner page is exited.
     • Auth uses the backend too — login/register hit /login
       and /register. The current user is stashed in localStorage
       so the session survives a refresh.
     • Cart / shopping flow is kept in-memory + localStorage
       for the customer-or-guest experience.

   When the backend is unreachable, we show a small error screen
   with a Retry button — this is the most common dev-time issue
   ("did you start the Python server?").
   ────────────────────────────────────────────────────────────── */

type CustomerView =
  | "dashboard"
  | "restaurant"
  | "cart"
  | "confirmation"
  | "owner"
  | "check-status"
  | "order-history";

type AuthView = "welcome" | "login" | "signup";

type LastOrder = {
  orderId: number;
  total: number;
  restaurantName: string;
};

const STATE_KEY = "eatout_state_v1";

type PersistedState = {
  selectedRestaurantId: number | null;
  cart: Record<number, number>;
};

function loadPersisted(): PersistedState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return { selectedRestaurantId: null, cart: {} };
    const parsed = JSON.parse(raw);
    return {
      selectedRestaurantId:
        typeof parsed.selectedRestaurantId === "number"
          ? parsed.selectedRestaurantId
          : null,
      cart:
        parsed.cart && typeof parsed.cart === "object" ? parsed.cart : {},
    };
  } catch {
    return { selectedRestaurantId: null, cart: {} };
  }
}

/* Tiny full-screen helpers used during initial load / errors. */
function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-porcelain)",
        color: "var(--color-ink)",
        fontFamily: "DM Sans, sans-serif",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 360, textAlign: "center" }}>{children}</div>
    </div>
  );
}

export default function App() {
  /* ── auth state ────────────────────────────────────────────── */
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [hasStarted, setHasStarted] = useState<boolean>(user !== null);
  const [authView, setAuthView] = useState<AuthView>("welcome");

  /* ── data state ────────────────────────────────────────────── */
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  /* ── shopping state ───────────────────────────────────────── */
  const initial = loadPersisted();
  const [view, setView] = useState<CustomerView>("dashboard");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(initial.selectedRestaurantId);
  const [cart, setCart] = useState<Record<number, number>>(initial.cart);
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);

  /* Persist cart + selected restaurant */
  useEffect(() => {
    try {
      const payload: PersistedState = { selectedRestaurantId, cart };
      localStorage.setItem(STATE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [selectedRestaurantId, cart]);

  const reloadRestaurants = useCallback(async () => {
    try {
      setLoadingError(null);
      const list = await listRestaurants();
      setAllRestaurants(list);
    } catch (e) {
      setLoadingError(
        e instanceof Error
          ? e.message
          : "Could not reach the backend at http://localhost:8000."
      );
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    reloadRestaurants();
  }, [reloadRestaurants]);

  const restaurant = useMemo(
    () =>
      selectedRestaurantId != null
        ? findRestaurantById(allRestaurants, selectedRestaurantId)
        : undefined,
    [allRestaurants, selectedRestaurantId]
  );

  const resumeCart = useMemo(() => {
    if (!restaurant) return undefined;
    let itemCount = 0;
    let total = 0;
    for (const dish of restaurant.dishes) {
      const qty = cart[dish.id] ?? 0;
      itemCount += qty;
      total += qty * dish.price;
    }
    if (itemCount === 0) return undefined;
    return {
      restaurantName: restaurant.name,
      itemCount,
      total,
      onResume: () => setView("restaurant"),
    };
  }, [restaurant, cart]);

  /* ── auth actions ──────────────────────────────────────────── */
  const handleAuthSuccess = async (u: User) => {
    setUser(u);
    setHasStarted(true);
    setCart({});
    setSelectedRestaurantId(null);
    setView("dashboard");
    // Restaurant accounts may have just created a new restaurant —
    // refresh so it appears in the list.
    await reloadRestaurants();
  };

  const handleContinueAsGuest = () => {
    setUser(null);
    setHasStarted(true);
    setView("dashboard");
  };

  const handleLogout = async () => {
    await authLogout();
    // Also clear any in-progress shopping state so a fresh
    // browser session doesn't restore a stale cart.
    try {
      localStorage.removeItem("eatout_state_v1");
    } catch {
      /* ignore */
    }
    // Full page reload — most reliable way to reset every piece
    // of in-memory state from any page (the restaurant owner
    // page in particular has been flaky with state-only logout).
    window.location.reload();
  };

  /* ── shopping flow callbacks ──────────────────────────────── */
  const goToRestaurant = (restaurantId: number) => {
    const cartHasItems = Object.values(cart).some((qty) => qty > 0);
    const isDifferent =
      selectedRestaurantId !== null && selectedRestaurantId !== restaurantId;
    if (cartHasItems && isDifferent) {
      const current = findRestaurantById(allRestaurants, selectedRestaurantId!);
      const ok = window.confirm(
        `You still have items from ${
          current?.name ?? "another restaurant"
        }.\n\n` +
          `Switching to a different restaurant will clear that cart. Continue?`
      );
      if (!ok) return;
      setCart({});
    }
    setSelectedRestaurantId(restaurantId);
    setView("restaurant");
  };
  const backToDashboard = () => setView("dashboard");
  const goToCart = () => setView("cart");
  const backToRestaurant = () => setView("restaurant");
  const handlePlaceOrder = (info: LastOrder) => {
    setLastOrder(info);
    setCart({});
    setView("confirmation");
  };
  const handleBackHome = () => {
    setLastOrder(null);
    setSelectedRestaurantId(null);
    setView("dashboard");
  };
  const goToOwnerView = () => setView("owner");
  // After leaving the owner page (guest preview), reload the list
  // so customer pages reflect any edits.
  const backFromOwnerView = async () => {
    await reloadRestaurants();
    setView("dashboard");
  };
  const goToCheckStatus = () => setView("check-status");
  const goToOrderHistory = () => setView("order-history");

  /* ── render ───────────────────────────────────────────────── */

  // Initial blocking load
  if (dataLoading) {
    return (
      <CenteredMessage>
        <p style={{ fontSize: 14, opacity: 0.6 }}>Loading restaurants…</p>
      </CenteredMessage>
    );
  }

  // Backend unreachable
  if (loadingError) {
    return (
      <CenteredMessage>
        <h2 style={{ fontFamily: "Playfair Display, serif", marginBottom: 8 }}>
          Can't reach the server
        </h2>
        <p style={{ fontSize: 13, opacity: 0.6, marginBottom: 16 }}>
          {loadingError}
        </p>
        <p style={{ fontSize: 12, opacity: 0.55, marginBottom: 16 }}>
          Make sure the FastAPI backend is running:
          <br />
          <code>python -m uvicorn app:app --reload --port 8000</code>
        </p>
        <button
          onClick={reloadRestaurants}
          style={{
            background: "var(--color-ink)",
            color: "var(--color-porcelain)",
            border: "none",
            padding: "10px 20px",
            borderRadius: 10,
            cursor: "pointer",
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          Retry
        </button>
      </CenteredMessage>
    );
  }

  // Pre-launch — Welcome / Login / SignUp
  if (!hasStarted) {
    if (authView === "login") {
      return (
        <LoginPage
          onLogin={handleAuthSuccess}
          onGoToSignUp={() => setAuthView("signup")}
          onBack={() => setAuthView("welcome")}
        />
      );
    }
    if (authView === "signup") {
      return (
        <SignUpPage
          onSignUp={handleAuthSuccess}
          onGoToLogin={() => setAuthView("login")}
          onBack={() => setAuthView("welcome")}
        />
      );
    }
    return (
      <WelcomePage
        onLogIn={() => setAuthView("login")}
        onSignUp={() => setAuthView("signup")}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  }

  // Restaurant-role users only see the owner page (locked to their restaurant).
  if (user?.role === "restaurant") {
    if (user.restaurant_id === undefined || user.restaurant_id === null) {
      return (
        <CenteredMessage>
          <p>This restaurant account isn't linked to a restaurant yet.</p>
          <button onClick={handleLogout}>Log out</button>
        </CenteredMessage>
      );
    }
    return (
      <OwnerMenuEditPage
        fixedRestaurantId={user.restaurant_id}
        onExit={handleLogout}
        exitLabel="Log out"
      />
    );
  }

  // Customer / guest flow
  // Use customer_id from the logged-in user, or fall back to demo
  // customer #1 for guests so order placement still works.
  const customerId = user?.id ?? 1;
  const userName = user ? user.email.split("@")[0] : null;

  if (view === "owner") {
    // Guests can preview the multi-restaurant owner UI from the sidebar.
    return (
      <OwnerMenuEditPage onExit={backFromOwnerView} exitLabel="Customer view" />
    );
  }

  if (view === "dashboard") {
    return (
      <Dashboard
        restaurants={allRestaurants}
        onSelectRestaurant={goToRestaurant}
        resumeCart={resumeCart}
        onGoToOwnerView={goToOwnerView}
        onGoToCheckStatus={goToCheckStatus}
        onGoToOrderHistory={goToOrderHistory}
        userName={userName}
        isLoggedIn={user !== null}
        onLogout={handleLogout}
      />
    );
  }

  if (view === "check-status") {
    return (
      <CheckStatusPage
        customerId={customerId}
        restaurants={allRestaurants}
        userName={userName}
        isLoggedIn={user !== null}
        onGoToDashboard={backToDashboard}
        onGoToOrderHistory={goToOrderHistory}
        onLogout={handleLogout}
      />
    );
  }

  if (view === "order-history") {
    return (
      <OrderHistoryPage
        customerId={customerId}
        restaurants={allRestaurants}
        userName={userName}
        isLoggedIn={user !== null}
        onGoToDashboard={backToDashboard}
        onGoToCheckStatus={goToCheckStatus}
        onLogout={handleLogout}
      />
    );
  }

  if (view === "restaurant" && restaurant) {
    return (
      <RestaurantPage
        restaurant={restaurant}
        cart={cart}
        setCart={setCart}
        userName={userName}
        onBack={backToDashboard}
        onCheckout={goToCart}
      />
    );
  }

  if (view === "cart" && restaurant) {
    return (
      <CartPage
        restaurant={restaurant}
        cart={cart}
        setCart={setCart}
        customerId={customerId}
        userName={userName}
        onBack={backToRestaurant}
        onPlaceOrder={handlePlaceOrder}
      />
    );
  }

  if (view === "confirmation" && lastOrder) {
    return (
      <OrderConfirmationPage
        orderId={lastOrder.orderId}
        total={lastOrder.total}
        restaurantName={lastOrder.restaurantName}
        onBackHome={handleBackHome}
      />
    );
  }

  // Safety fallback
  return (
    <Dashboard
      restaurants={allRestaurants}
      onSelectRestaurant={goToRestaurant}
      resumeCart={resumeCart}
      onGoToOwnerView={goToOwnerView}
      onGoToCheckStatus={goToCheckStatus}
      onGoToOrderHistory={goToOrderHistory}
      userName={userName}
      isLoggedIn={user !== null}
      onLogout={handleLogout}
    />
  );
}
