import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const isProd = process.env.NODE_ENV === "production";
const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s || s.startsWith("replace-with")) {
    if (isProd) throw new Error("Set a strong JWT_SECRET in production.");
    return "dev-only-secret";
  }
  return s;
};

const sha = (v) => crypto.createHash("sha256").update(String(v)).digest();
export const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

export function checkCredentials(email, password) {
  const e = process.env.ADMIN_EMAIL || "admin@example.com";
  const p = process.env.ADMIN_PASSWORD || "Admin@123";
  // evaluate both so timing doesn't reveal which one was wrong
  const okEmail = safeEqual(String(email || "").toLowerCase(), e.toLowerCase());
  const okPass = safeEqual(password || "", p);
  return okEmail && okPass;
}

export const signAdmin = (email) => jwt.sign({ role: "admin", email }, secret(), { expiresIn: "8h" });

export function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    req.admin = jwt.verify(token, secret());
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}
