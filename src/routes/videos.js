import { createProxyMiddleware } from "http-proxy-middleware";
import { VIDEO_SERVICE_URL } from "../config/services.js";

// Protected — authenticate middleware runs before this in index.js.
// selfHandleResponse: false lets byte-range / streaming responses pass through untouched.
export const videosProxy = createProxyMiddleware({
  target: VIDEO_SERVICE_URL,
  changeOrigin: true,
  selfHandleResponse: false,
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        const meta = req.user.user_metadata ?? {};
        proxyReq.setHeader("X-User-Id",     req.user.id);
        proxyReq.setHeader("X-User-Email",  req.user.email);
        proxyReq.setHeader("X-User-Role",   meta.role   ?? "viewer");
        proxyReq.setHeader("X-User-Status", meta.status ?? "active");
      }
    },
    proxyRes: (proxyRes, req) => {
      console.log(`[proxy:videos] ${req.method} ${req.path} → ${proxyRes.statusCode}`);
    },
    error: (_err, _req, res) => {
      res.status(502).json({ error: "Video service unavailable" });
    },
  },
});
