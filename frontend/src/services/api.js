const BASE_URL = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function registerUser({ email, password, role }) {
  return request("/register", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
}

export async function loginUser({ email, password }) {
  const params = new URLSearchParams({ email, password });
  return request(`/login?${params}`, { method: "POST" });
}

export async function searchRestaurants(query) {
  const params = new URLSearchParams({ query });
  return request(`/restaurants?${params}`);
}

export async function createOrder(customerId, order) {
  const params = new URLSearchParams({ customer_id: customerId });
  return request(`/orders?${params}`, {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function getCustomerOrders(customerId) {
  return request(`/orders/customer/${customerId}`);
}

export async function getRestaurantOrders(restaurantId) {
  return request(`/orders/restaurant/${restaurantId}`);
}

export async function updateOrderStatus(orderId, status) {
  const params = new URLSearchParams({ status });
  return request(`/orders/${orderId}?${params}`, { method: "PATCH" });
}
