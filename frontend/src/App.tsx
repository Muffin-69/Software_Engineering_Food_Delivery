import { useEffect, useMemo, useState } from "react";
import Dashboard from "./pages/DashboardPage.tsx";
import RestaurantPage from "./pages/RestaurantPage.tsx";
import CartPage from "./pages/CartPage.tsx";
import OrderConfirmationPage from "./pages/OrderConfirmationPage.tsx";
import OwnerMenuEditPage from "./pages/OwnerMenuEditPage.tsx";
import WelcomePage from "./pages/WelcomePage.tsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignUpPage from "./pages/SignUpPage.jsx";
import { findRestaurantById } from "./data/restaurants";
import {
  getCurrentUser,
  logout as authLogout,
  type User,
} from "./data/authApi";
import "./App.css";

/* ──────────────────────────────────────────────────────────────
   App / screen switcher

   Auth flow:
     1. On launch, if there's an existing session in localStorage
        we restore it. Otherwise we show the Welcome screen.
     2. From Welcome the user can: log in, sign up, or continue
        as guest (no account, just browse + place mock orders).
     3. After login or registration:
          • role === "restaurant" → goes straight to the owner
            page, locked to their own restaurant only.
          • role === "customer"   → goes to the customer dashboard
            (same flow guests use).
     4. Logging out wipes the session and takes them back to
        Welcome.

   Shopping state (cart, selected restaurant, last order) is held
   here and survives navigation between dashboard / restaurant /
   cart / confirmation, just like before.
   ────────────────────────────────────────────────────────────── */

type CustomerView =
  | "dashboard"
  | "restaurant"
  | "cart"
  | "confirmation"
  | "owner";

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

export default function App() {
  /* ── auth state ────────────────────────────────────────────── */
  const [user, setUser] = useState<User | null>(getCurrentUser());
  // hasStarted means the user picked one of the three welcome
  // options. If the session is already restored from localStorage
  // we treat them as already started.
  const [hasStarted, setHasStarted] = useState<boolean>(user !== null);
  const [authView, setAuthView] = useState<AuthView>("welcome");

  /* ── shopping state (used for customer/guest flow) ─────────── */
  const initial = loadPersisted();
  const [view, setView] = useState<CustomerView>("dashboard");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(initial.selectedRestaurantId);
  const [cart, setCart] = useState<Record<number, number>>(initial.cart);
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);

  /* Persist shopping state on change */
  useEffect(() => {
    try {
      const payload: PersistedState = { selectedRestaurantId, cart };
      localStorage.setItem(STATE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }, [selectedRestaurantId, cart]);

  const restaurant =
    selectedRestaurantId != null
      ? findRestaurantById(selectedRestaurantId)
      : undefined;

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
  const handleAuthSuccess = (u: User) => {
    setUser(u);
    setHasStarted(true);
    // Clear any in-progress cart from a previous session
    setCart({});
    setSelectedRestaurantId(null);
    setView("dashboard");
  };

  const handleContinueAsGuest = () => {
    setUser(null);
    setHasStarted(true);
    setView("dashboard");
  };

  const handleLogout = async () => {
    await authLogout();
    setUser(null);
    setHasStarted(false);
    setAuthView("welcome");
    setCart({});
    setSelectedRestaurantId(null);
    setLastOrder(null);
    setView("dashboard");
  };

  /* ── customer flow callbacks (unchanged from before) ──────── */
  const goToRestaurant = (restaurantId: number) => {
    const cartHasItems = Object.values(cart).some((qty) => qty > 0);
    const isDifferent =
      selectedRestaurantId !== null && selectedRestaurantId !== restaurantId;
    if (cartHasItems && isDifferent) {
      const current = findRestaurantById(selectedRestaurantId!);
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
  const backFromOwnerView = () => setView("dashboard");

  /* ── render ───────────────────────────────────────────────── */

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

  // Restaurant-role users get the owner page, locked to their restaurant.
  if (user?.role === "restaurant") {
    if (user.restaurantId === undefined) {
      // Shouldn't happen — registration always creates one. Fail safe.
      return (
        <div style={{ padding: 32 }}>
          <p>This restaurant account is not linked to a restaurant.</p>
          <button onClick={handleLogout}>Log out</button>
        </div>
      );
    }
    return (
      <OwnerMenuEditPage
        fixedRestaurantId={user.restaurantId}
        onExit={handleLogout}
        exitLabel="Log out"
      />
    );
  }

  // Customer or guest — normal shopping flow
  const userName = user ? user.email.split("@")[0] : null;

  if (view === "owner") {
    // Guests can preview the owner UI from the dashboard sidebar.
    return (
      <OwnerMenuEditPage
        onExit={backFromOwnerView}
        exitLabel="Customer view"
      />
    );
  }

  if (view === "dashboard") {
    return (
      <Dashboard
        onSelectRestaurant={goToRestaurant}
        resumeCart={resumeCart}
        onGoToOwnerView={goToOwnerView}
        userName={userName}
        isLoggedIn={user !== null}
        onLogout={handleLogout}
      />
    );
  }

  if (view === "restaurant" && restaurant) {
    return (
      <RestaurantPage
        restaurantId={restaurant.id}
        cart={cart}
        setCart={setCart}
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
      onSelectRestaurant={goToRestaurant}
      resumeCart={resumeCart}
      onGoToOwnerView={goToOwnerView}
      userName={userName}
      isLoggedIn={user !== null}
      onLogout={handleLogout}
    />
  );
}
