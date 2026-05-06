import { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import "../styles/Restaurant.css";
import "../styles/Owner.css";
import {
  listRestaurants,
  updateRestaurantInfo,
  addDish,
  updateDish,
  deleteDish,
} from "../data/restaurantApi";
import { type Restaurant } from "../data/restaurants";
import OwnerOrdersTab from "./OwnerOrdersTab";

/* ──────────────────────────────────────────────────────────────
   Owner / Restaurant menu editor

   Lets a "restaurant" role user pick a restaurant and:
     • edit its name, description, and tags
     • add new dishes
     • edit existing dish names + prices
     • remove dishes

   Important — this component does not import RESTAURANTS or any
   storage helper. Every read/write goes through restaurantApi.ts,
   so when you swap the data layer for Supabase / FastAPI, this
   file stays exactly as it is.
   ────────────────────────────────────────────────────────────── */

type OwnerMenuEditPageProps = {
  /** Callback for the exit / logout button. */
  onExit: () => void;
  /** Label for the exit button. Defaults to "Customer view". */
  exitLabel?: string;
  /** When provided, the page is locked to this restaurant only —
      the picker dropdown is hidden, the danger "reset all" section
      is hidden, and the user can only edit their own restaurant. */
  fixedRestaurantId?: number;
};

type DishDraft = { name: string; price: string };

export default function OwnerMenuEditPage({
  onExit,
  exitLabel = "Customer view",
  fixedRestaurantId,
}: OwnerMenuEditPageProps) {
  // ── data
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(
    fixedRestaurantId ?? null
  );
  const [loading, setLoading] = useState(true);

  // ── tab switcher (sidebar nav)
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");

  // ── editable info form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // ── per-dish edit drafts (keyed by dishId)
  const [dishDrafts, setDishDrafts] = useState<Record<number, DishDraft>>({});
  const [busyDishId, setBusyDishId] = useState<number | null>(null);

  // ── new dish form
  const [newDishName, setNewDishName] = useState("");
  const [newDishPrice, setNewDishPrice] = useState("");
  const [addingDish, setAddingDish] = useState(false);

  // ── error banner
  const [error, setError] = useState<string | null>(null);

  /* Load all restaurants on mount */
  const reloadAll = async () => {
    setLoading(true);
    try {
      const list = await listRestaurants();
      setRestaurants(list);
      // If we were given a fixed restaurant, force-select it.
      if (fixedRestaurantId !== undefined) {
        setSelectedId(fixedRestaurantId);
      } else if (list.length > 0 && selectedId === null) {
        setSelectedId(list[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* When the selected restaurant changes, prefill the edit form
     with that restaurant's data and reset all in-progress drafts. */
  const selected =
    selectedId !== null ? restaurants.find((r) => r.id === selectedId) : null;

  useEffect(() => {
    if (!selected) {
      setName("");
      setDescription("");
      setAddress("");
      setTagsText("");
      setDishDrafts({});
      return;
    }
    setName(selected.name);
    setDescription(selected.description);
    setAddress(selected.address ?? "");
    setTagsText(selected.tags.join(", "));
    const drafts: Record<number, DishDraft> = {};
    for (const d of selected.dishes) {
      drafts[d.id] = { name: d.name, price: d.price.toFixed(2) };
    }
    setDishDrafts(drafts);
    setNewDishName("");
    setNewDishPrice("");
    setInfoMessage(null);
    setError(null);
  }, [selectedId, selected?.dishes.length]);
  // selected?.dishes.length so adding/removing dishes refreshes drafts

  /* ── handlers ─────────────────────────────────────────────── */

  const handleSaveInfo = async () => {
    if (selectedId === null) return;
    setError(null);
    setInfoMessage(null);
    setSavingInfo(true);
    try {
      const tags = tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await updateRestaurantInfo(selectedId, {
        name,
        description,
        address,
        tags,
      });
      await reloadAll();
      setInfoMessage("Saved.");
      // Auto-clear the inline confirmation after a moment
      setTimeout(() => setInfoMessage(null), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveDish = async (dishId: number) => {
    if (selectedId === null) return;
    const draft = dishDrafts[dishId];
    if (!draft) return;
    const priceNum = parseFloat(draft.price);
    setError(null);
    setBusyDishId(dishId);
    try {
      await updateDish(selectedId, dishId, {
        name: draft.name,
        price: priceNum,
      });
      await reloadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save dish.");
    } finally {
      setBusyDishId(null);
    }
  };

  const handleDeleteDish = async (dishId: number, dishName: string) => {
    if (selectedId === null) return;
    const ok = window.confirm(`Remove "${dishName}" from the menu?`);
    if (!ok) return;
    setError(null);
    setBusyDishId(dishId);
    try {
      await deleteDish(selectedId, dishId);
      await reloadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete dish.");
    } finally {
      setBusyDishId(null);
    }
  };

  const handleAddDish = async () => {
    if (selectedId === null) return;
    const priceNum = parseFloat(newDishPrice);
    setError(null);
    setAddingDish(true);
    try {
      await addDish(selectedId, { name: newDishName, price: priceNum });
      await reloadAll();
      setNewDishName("");
      setNewDishPrice("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add dish.");
    } finally {
      setAddingDish(false);
    }
  };

  const setDraftField = (
    dishId: number,
    field: keyof DishDraft,
    value: string
  ) => {
    setDishDrafts((prev) => ({
      ...prev,
      [dishId]: { ...prev[dishId], [field]: value },
    }));
  };

  /* ── small helpers for input validity ─────────────────────── */
  const newDishValid =
    newDishName.trim().length > 0 &&
    Number.isFinite(parseFloat(newDishPrice)) &&
    parseFloat(newDishPrice) >= 0;

  /* ── render ───────────────────────────────────────────────── */

  return (
    <div className="dashboard-page">
      <div className="bg-blob bg-blob--teal" />
      <div className="bg-blob bg-blob--amber" />

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          Eat<span>out!</span>
        </div>
        <nav className="sidebar-nav">
          <a
            className={`nav-item${
              activeTab === "menu" ? " nav-item--active" : ""
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("menu")}
          >
            Manage menu
          </a>
          <a
            className={`nav-item${
              activeTab === "orders" ? " nav-item--active" : ""
            }`}
            style={{ cursor: "pointer" }}
            onClick={() => setActiveTab("orders")}
          >
            Incoming orders
          </a>
        </nav>
        <div className="sidebar-footer">
          <a className="footer-link">Contact us</a>
          <a className="footer-link">Privacy Policy</a>
          <button className="logout-btn" onClick={onExit}>
            {exitLabel}
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        {/* Top bar */}
        <div className="topbar">
          <button className="upgrade-btn" onClick={onExit}>
            {fixedRestaurantId !== undefined
              ? `← Log out`
              : "← Back to customer view"}
          </button>
          <span className="owner-badge">Restaurant owner mode</span>
        </div>

        {/* Restaurant picker — hidden when locked to one restaurant */}
        {fixedRestaurantId === undefined ? (
          <div className="owner-picker-row">
            <label className="owner-label" htmlFor="restaurant-picker">
              Managing
            </label>
            <select
              id="restaurant-picker"
              className="owner-select"
              value={selectedId ?? ""}
              onChange={(e) => setSelectedId(Number(e.target.value))}
              disabled={loading}
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="owner-picker-row">
            <label className="owner-label">Managing</label>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "var(--color-ink)",
              }}
            >
              {selected?.name ?? "…"}
            </span>
          </div>
        )}

        {error && (
          <div className="owner-banner owner-banner--error">{error}</div>
        )}

        {selected && activeTab === "orders" && (
          <OwnerOrdersTab restaurantId={selected.id} restaurant={selected} />
        )}

        {selected && activeTab === "menu" && (
          <>
            {/* ── Restaurant info section ── */}
            <section className="owner-section">
              <h2 className="owner-section-title">Restaurant info</h2>

              <div className="owner-field">
                <label className="owner-label" htmlFor="r-name">
                  Name
                </label>
                <input
                  id="r-name"
                  className="owner-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="owner-field">
                <label className="owner-label" htmlFor="r-desc">
                  Description
                </label>
                <textarea
                  id="r-desc"
                  className="owner-input owner-textarea"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="owner-field">
                <label className="owner-label" htmlFor="r-addr">
                  Address
                </label>
                <input
                  id="r-addr"
                  className="owner-input"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="12 Brivibas iela, Riga"
                />
              </div>

              <div className="owner-field">
                <label className="owner-label" htmlFor="r-tags">
                  Tags <span className="owner-hint">(comma-separated)</span>
                </label>
                <input
                  id="r-tags"
                  className="owner-input"
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  placeholder="italian, pizza, pasta"
                />
              </div>

              <div className="owner-actions-row">
                <button
                  className="cart-cta"
                  onClick={handleSaveInfo}
                  disabled={savingInfo || !name.trim()}
                >
                  {savingInfo ? "Saving…" : "Save changes"}
                </button>
                {infoMessage && (
                  <span className="owner-saved">{infoMessage}</span>
                )}
              </div>
            </section>

            {/* ── Menu section ── */}
            <section className="owner-section">
              <h2 className="owner-section-title">
                Menu{" "}
                <span className="owner-hint">
                  ({selected.dishes.length}{" "}
                  {selected.dishes.length === 1 ? "item" : "items"})
                </span>
              </h2>

              {selected.dishes.length === 0 && (
                <p className="owner-hint" style={{ paddingBottom: 12 }}>
                  No dishes yet — add the first one below.
                </p>
              )}

              <div className="dish-edit-list">
                {selected.dishes.map((dish) => {
                  const draft = dishDrafts[dish.id] ?? {
                    name: dish.name,
                    price: dish.price.toFixed(2),
                  };
                  const priceNum = parseFloat(draft.price);
                  const valid =
                    draft.name.trim().length > 0 &&
                    Number.isFinite(priceNum) &&
                    priceNum >= 0;
                  const dirty =
                    draft.name !== dish.name ||
                    parseFloat(draft.price) !== dish.price;
                  return (
                    <div className="dish-edit-row" key={dish.id}>
                      <input
                        className="owner-input dish-edit-name"
                        type="text"
                        value={draft.name}
                        onChange={(e) =>
                          setDraftField(dish.id, "name", e.target.value)
                        }
                      />
                      <div className="dish-edit-price-wrap">
                        <span className="owner-currency">$</span>
                        <input
                          className="owner-input dish-edit-price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={draft.price}
                          onChange={(e) =>
                            setDraftField(dish.id, "price", e.target.value)
                          }
                        />
                      </div>
                      <button
                        className="cart-cta dish-edit-save"
                        disabled={!valid || !dirty || busyDishId === dish.id}
                        onClick={() => handleSaveDish(dish.id)}
                      >
                        {busyDishId === dish.id ? "…" : "Save"}
                      </button>
                      <button
                        className="dish-delete-btn"
                        title="Remove dish"
                        disabled={busyDishId === dish.id}
                        onClick={() => handleDeleteDish(dish.id, dish.name)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add-new-dish row */}
              <div className="dish-add-row">
                <input
                  className="owner-input dish-edit-name"
                  type="text"
                  placeholder="New dish name"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                />
                <div className="dish-edit-price-wrap">
                  <span className="owner-currency">$</span>
                  <input
                    className="owner-input dish-edit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(e.target.value)}
                  />
                </div>
                <button
                  className="add-btn dish-add-btn"
                  disabled={!newDishValid || addingDish}
                  onClick={handleAddDish}
                >
                  {addingDish ? "Adding…" : "+ Add dish"}
                </button>
              </div>
            </section>

            {/* The "reset to seed" button used to live here, but
                now that data lives in Supabase the equivalent is
                running `npm run seed` from the supabase/ folder. */}
          </>
        )}
      </div>
    </div>
  );
}
