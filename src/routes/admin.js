import { Router } from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { z } from "zod";
import { checkCredentials, signAdmin, requireAdmin } from "../auth.js";
import { Setting, Service, Testimonial, Faq, Message } from "../models.js";
import { defaultSettings, getSettings } from "../seed.js";
import { mountCrud, wrap, parseBody } from "./crud.js";

const router = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false });
router.post("/login", loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (checkCredentials(email, password)) return res.json({ token: signAdmin(email), admin: { email } });
  res.status(401).json({ message: "Invalid email or password." });
});

router.use(requireAdmin);

/* ---------- Dashboard ---------- */
router.get("/dashboard", wrap(async (_req, res) => {
  const [services, testimonials, faqs, messages, newMessages, recent] = await Promise.all([
    Service.countDocuments(), Testimonial.countDocuments(), Faq.countDocuments(),
    Message.countDocuments(), Message.countDocuments({ status: "new" }),
    Message.find().sort({ createdAt: -1 }).limit(5)
  ]);
  res.json({
    stats: { services, testimonials, faqs, messages, newMessages },
    recent,
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
}));

/* ---------- Site settings (content + appearance) ---------- */
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour like #0b3558");
const settingsSchema = z.object({
  values: z.record(z.string().max(5000))
});

router.get("/settings", wrap(async (_req, res) => res.json(await getSettings())));

router.put("/settings", wrap(async (req, res) => {
  const data = parseBody(settingsSchema, req.body, res); if (!data) return;
  const entries = Object.entries(data.values).filter(([k]) => k in defaultSettings);
  for (const [k, v] of entries) {
    if (k === "theme_primary" || k === "theme_accent") {
      if (!hex.safeParse(v).success) return res.status(400).json({ message: `${k}: must be a 6-digit hex colour.` });
    }
    if (k === "theme_mode" && !["light", "dark", "system"].includes(v))
      return res.status(400).json({ message: "theme_mode must be light, dark or system." });
  }
  if (entries.length) {
    await Setting.bulkWrite(entries.map(([key, value]) => ({
      updateOne: { filter: { key }, update: { $set: { value } }, upsert: true }
    })));
  }
  res.json(await getSettings());
}));

/* ---------- Collections: full CRUD ---------- */
const flags = { published: z.boolean().default(true), sort_order: z.coerce.number().int().min(0).max(999).default(99) };

mountCrud(router, "services", Service, z.object({
  title: z.string().trim().min(2).max(100),
  short_description: z.string().trim().min(5).max(300),
  icon: z.string().trim().min(2).max(40).default("Briefcase"),
  featured: z.boolean().default(false),
  ...flags
}), "Service");

mountCrud(router, "testimonials", Testimonial, z.object({
  name: z.string().trim().min(2).max(80),
  role: z.string().trim().max(120).default(""),
  quote: z.string().trim().min(10).max(600),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  ...flags
}), "Testimonial");

mountCrud(router, "faqs", Faq, z.object({
  question: z.string().trim().min(5).max(200),
  answer: z.string().trim().min(5).max(1500),
  ...flags
}), "FAQ");

/* ---------- Messages ---------- */
router.get("/messages", wrap(async (_req, res) => res.json(await Message.find().sort({ createdAt: -1 }))));

router.patch("/messages/:id", wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid id." });
  const data = parseBody(z.object({ status: z.enum(["new", "read", "archived"]) }), req.body, res); if (!data) return;
  const item = await Message.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!item) return res.status(404).json({ message: "Message not found." });
  res.json(item);
}));

router.delete("/messages/:id", wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid id." });
  const item = await Message.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Message not found." });
  res.status(204).end();
}));

export default router;
