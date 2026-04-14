import { createProxyMiddleware } from "http-proxy-middleware";
import { VIDEO_SERVICE_URL } from "../config/services.js";

export const festivalsProxy = createProxyMiddleware({
  target: VIDEO_SERVICE_URL,
  changeOrigin: true,
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
    error: (_err, _req, res) => {
      res.status(502).json({ error: "Video service unavailable" });
    },
  },
});
