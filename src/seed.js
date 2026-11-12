import { Setting, Service, Faq } from "./models.js";

export const defaultSettings = {
  firm_name: "LG & Associates",
  tagline: "Chartered Accountants",
  hero_title: "Chartered Accountants in Siliguri.",
  hero_text: "Income tax, GST, audit, accounting and business advisory services for individuals, professionals and growing enterprises in Siliguri and across West Bengal.",
  about_title: "A chartered accountancy practice built on clarity and discipline.",
  about_text: "LG & Associates is a chartered accountancy firm led by CA Lalit Gupta, providing income tax, GST, audit and accounting services to clients in Siliguri, Darjeeling, Jalpaiguri and across India. We focus on accurate compliance, clear reporting and practical financial guidance.",
  phone: "+91 98320 93139",
  whatsapp: "919832093139",
  email: "cacslalitgupta@gmail.com",
  address: "Nehru Road, Ward 8, Khalpara, Siliguri, West Bengal 734005",
  working_hours: "Mon – Sat, 10:00 AM – 7:00 PM",
  experience: "",
  clients: "",
  businesses: "",
  response_time: "",
  meta_description: "LG & Associates (CA Lalit Gupta) — chartered accountants in Siliguri offering income tax, GST, audit, accounting and business advisory services.",
  theme_primary: "#0b3558",
  theme_accent: "#b18a3b",
  theme_mode: "system",
};

const services = [ /* … same as before … */ ];
const faqs = [ /* … same as before … */ ];

export async function seed() {
  const flag = await Setting.findOne({ key: "_seeded" });
  if (flag) return;
  await Setting.bulkWrite(Object.entries(defaultSettings).map(([key, value]) => ({
    updateOne: { filter: { key }, update: { $setOnInsert: { key, value } }, upsert: true },
  })));
  if (!(await Service.countDocuments())) await Service.insertMany(services);
  if (!(await Faq.countDocuments())) await Faq.insertMany(faqs);
  await Setting.create({ key: "_seeded", value: "1" });
  console.log("Database seeded with starter content.");
}

export async function getSettings() {
  const rows = await Setting.find({ key: { $in: Object.keys(defaultSettings) } });
  const out = { ...defaultSettings };
  for (const r of rows) out[r.key] = r.value;
  return out;
}