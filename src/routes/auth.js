import { createProxyMiddleware } from "http-proxy-middleware";
import { AUTH_SERVICE_URL } from "../config/services.js";

// Public — no JWT required. The auth service owns signup/login/oauth flows.
export const authProxy = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  on: {
    proxyRes: (proxyRes, req) => {
      console.log(`[proxy:auth] ${req.method} ${req.path} → ${proxyRes.statusCode}`);
    },
    error: (_err, _req, res) => {
      res.status(502).json({ error: "Auth service unavailable" });
    },
  },
});
