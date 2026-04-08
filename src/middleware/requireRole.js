// Enforce role and approval status on gateway routes.
// Must be used AFTER authenticate, which populates req.user.

export function requireRole(...roles) {
  return (req, res, next) => {
    const meta   = req.user?.user_metadata ?? {};
    const role   = meta.role   || "viewer";
    const status = meta.status || "active";

    if (status === "pending") {
      return res.status(403).json({
        error: "Your account is pending approval. You'll receive an email once it's reviewed.",
      });
    }
    if (status === "rejected") {
      return res.status(403).json({ error: "Your account application was not approved." });
    }
    if (roles.length && !roles.includes(role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}
