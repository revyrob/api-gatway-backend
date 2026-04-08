import { createProxyMiddleware } from "http-proxy-middleware";
import { UPLOAD_SERVICE_URL } from "../config/services.js";

// Protected — authenticate middleware runs before this in index.js.
// Multipart bodies are streamed directly; do not parse them in the gateway.
export const uploadProxy = createProxyMiddleware({
  target: UPLOAD_SERVICE_URL,
  changeOrigin: true,
  selfHandleResponse: false,
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader("X-User-Id",    req.user.id);
        proxyReq.setHeader("X-User-Email", req.user.email);
        proxyReq.setHeader("X-User-Role",  req.user.role ?? "user");
      }
    },
    proxyRes: (proxyRes, req) => {
      console.log(`[proxy:upload] ${req.method} ${req.path} → ${proxyRes.statusCode}`);
    },
    error: (_err, _req, res) => {
      res.status(502).json({ error: "Upload service unavailable" });
    },
  },
});
