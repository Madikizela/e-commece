import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.jsx"),
  route("login", "routes/login.jsx"),
  route("register", "routes/register.jsx"),
  route("forgot-password", "routes/forgot-password.jsx"),
  route("dashboard", "routes/dashboard.jsx"),
  route("profile", "routes/profile.jsx"),
  route("product/:id", "routes/product.$id.jsx"),
  route("wishlist", "routes/wishlist.jsx"),
  route("cart", "routes/cart.jsx"),
  route("checkout", "routes/checkout.jsx"),
  route("admin/login", "routes/admin.login.jsx"),
  route("admin/dashboard", "routes/admin.dashboard.jsx"),
  route("admin/products", "routes/admin.products.jsx"),
  route("admin/orders", "routes/admin.orders.jsx"),
  route("admin/inventory", "routes/admin.inventory.jsx"),
  route("admin/customers", "routes/admin.customers.jsx"),
  route("admin/reports", "routes/admin.reports.jsx"),
  route("admin/coupons", "routes/admin.coupons.jsx"),
] satisfies RouteConfig;
