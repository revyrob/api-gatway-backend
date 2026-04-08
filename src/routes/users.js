import { createProxyMiddleware } from "http-proxy-middleware";
import { USER_SERVICE_URL } from "../config/services.js";

// Protected — authenticate middleware runs before this in index.js.
// Forwards verified user identity to the downstream service via headers.
export const usersProxy = createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader("X-User-Id",    req.user.id);
        proxyReq.setHeader("X-User-Email", req.user.email);
        proxyReq.setHeader("X-User-Role",  req.user.role ?? "user");
      }
    },
    proxyRes: (proxyRes, req) => {
      console.log(`[proxy:users] ${req.method} ${req.path} → ${proxyRes.statusCode}`);
    },
    error: (_err, _req, res) => {
      res.status(502).json({ error: "User service unavailable" });
    },
  },
});
