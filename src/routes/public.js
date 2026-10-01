import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { Service, Testimonial, Faq, Message } from "../models.js";
import { getSettings } from "../seed.js";
import { createCaptcha, verifyCaptcha } from "../captcha.js";
import { wrap, parseBody } from "./crud.js";

const router = Router();
const order = { sort_order: 1, createdAt: 1 };

router.get("/site", wrap(async (_req, res) => {
  const [settings, services, testimonials, faqs] = await Promise.all([
    getSettings(),
    Service.find({ published: true }).sort(order),
    Testimonial.find({ published: true }).sort(order),
    Faq.find({ published: true }).sort(order)
  ]);
  res.set("Cache-Control", "no-store");
  res.json({ settings, services, testimonials, faqs });
}));

router.get("/captcha", (_req, res) => res.json(createCaptcha()));

const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(3000),
  captchaId: z.string().min(5).max(30),
  captchaAnswer: z.string().min(1).max(10),
  website: z.string().max(0).optional().or(z.literal("")) // honeypot
});

router.post("/contact", contactLimiter, wrap(async (req, res) => {
  const data = parseBody(contactSchema, req.body, res); if (!data) return;
  if (data.website) return res.status(400).json({ message: "Request rejected." });
  if (!verifyCaptcha(data.captchaId, data.captchaAnswer))
    return res.status(400).json({ message: "CAPTCHA is incorrect or expired." });
  const { name, email, phone, subject, message } = data;
  await Message.create({ name, email, phone: phone || "", subject: subject || "", message });
  res.status(201).json({ message: "Thanks. Your message has been received." });
}));

export default router;