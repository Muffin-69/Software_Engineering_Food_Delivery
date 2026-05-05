import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import { createOrder } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function RestaurantPage() {
  const { id } = useParams();
  const [cart, setCart] = useState([]);
  const { user } = useAuth();
  const customerId = user?.id;
  const navigate = useNavigate();
  const location = useLocation();
  const restaurant = location.state?.restaurant;

  if (!restaurant) {
    return <div>No data</div>;
  }

  const addToCart = (dish) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === dish.id);

      if (existing) {
        return prev.map((i) =>
          i.id === dish.id ? { ...i, qty: i.qty + 1 } : i
        );
      }

      return [...prev, { ...dish, qty: 1 }];
    });
  };

  const removeFromCart = (dish) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === dish.id);

      if (!existing) return prev;
      if (existing.qty === 1) {
        return prev.filter((i) => i.id !== dish.id);
      }

      return prev.map((i) => (i.id === dish.id ? { ...i, qty: i.qty - 1 } : i));
    });
  };

  const placeOrder = async () => {
    try {
      const order = {
        restaurant_id: id,
        items: cart.map((i) => ({
          dish_id: i.id,
          quantity: i.qty,
        })),
      };

      await createOrder(customerId, order);

      alert("Order placed!");
      setCart([]);

      navigate("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Failed to place order");
    }
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-main">
        <div className="topbar">
          <div className="topbar-greeting">
            Menu of <span>{restaurant.name}</span>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="view-container">
            <div className="cards-list">
              {restaurant.dishes.map((dish) => (
                <div key={dish.id} className="restaurant-card">
                  <div className="card-body">
                    <div className="card-title">{dish.name}</div>
                    <div className="card-desc">{dish.price} €</div>
                  </div>

                  <button
                    className="icon-btn"
                    onClick={() => removeFromCart(dish)}
                  >
                    -
                  </button>
                  <button className="icon-btn" onClick={() => addToCart(dish)}>
                    +
                  </button>
                </div>
              ))}
            </div>

            <div className="view-container">
              <h3>Your Order</h3>
              {cart.map((item) => (
                <div key={item.id} className="order-item">
                  <span>
                    {item.name} x {item.qty} ={" "}
                    {(item.price * item.qty).toFixed(2)} €
                  </span>
                </div>
              ))}
              {cart.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <h3>Total: {totalPrice.toFixed(2)} €</h3>
                </div>
              )}
              {cart.length > 0 && (
                <button className="upgrade-btn" onClick={placeOrder}>
                  Place Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
