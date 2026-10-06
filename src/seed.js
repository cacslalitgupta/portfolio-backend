import { Setting, Service, Testimonial, Faq } from "./models.js";

export const defaultSettings = {
  firm_name: "Roy & Associates",
  tagline: "Chartered Accountants & Business Advisors",
  hero_title: "Clarity for your numbers. Confidence for your business.",
  hero_text: "End-to-end taxation, GST, accounting, audit and business advisory for founders, professionals and growing enterprises.",
  about_title: "A finance partner, not just a filing desk.",
  about_text: "We combine practical accounting, tax discipline and business insight to help clients make better financial decisions and stay organised throughout the year.",
  phone: "+91 98765 43210",
  whatsapp: "919876543210", // digits only, with country code (no + or spaces)
  email: "hello@royassociates.in",
  address: "Siliguri, West Bengal, India",
  working_hours: "Mon – Sat, 10:00 AM – 7:00 PM",
  experience: "15+",
  clients: "1,200+",
  businesses: "350+",
  response_time: "24 hrs",
  // Appearance (editable from Admin → Appearance)
  theme_primary: "#0b3558",
  theme_accent: "#b18a3b",
  theme_mode: "system" // light | dark | system
};

const services = [
  ["Income Tax & ITR", "Individual and business return preparation, tax planning and compliance.", "Calculator", true],
  ["GST Services", "Registration, returns, reconciliation, notices and ongoing GST support.", "Receipt", true],
  ["Accounting & Bookkeeping", "Monthly bookkeeping, ledgers, MIS reporting and management accounts.", "BookOpen", true],
  ["Audit & Assurance", "Statutory, tax and internal audit support with documentation and review.", "ShieldCheck", true],
  ["TDS & TCS", "Registration, quarterly returns, certificates, reconciliations and notices.", "FileCheck", false],
  ["Company & LLP Compliance", "MCA filings, annual compliance, incorporation and governance support.", "Building2", false],
  ["Business Advisory", "Cash-flow, budgeting, business structuring and finance decision support.", "TrendingUp", false],
  ["Payroll & Compliance", "Payroll accounting, PF, ESI and recurring employer compliance support.", "Users", false]
].map(([title, short_description, icon, featured], i) => ({ title, short_description, icon, featured, sort_order: i + 1 }));

const testimonials = [
  { name: "Ananya Sen", role: "Founder, Bloom Textiles", quote: "Our GST filings used to be a monthly scramble. Now everything is reconciled before the due date and we always know where we stand.", rating: 5, sort_order: 1 },
  { name: "Rakesh Agarwal", role: "Director, Agarwal Traders", quote: "They handled a difficult notice calmly and professionally. Clear advice, no jargon, and always reachable.", rating: 5, sort_order: 2 },
  { name: "Dr. Meera Das", role: "Consultant Physician", quote: "Tax planning finally makes sense to me. I save time every year and the paperwork is fully organised.", rating: 5, sort_order: 3 }
];

const faqs = [
  { question: "Which documents do I need to file my income tax return?", answer: "Typically PAN, Aadhaar, Form 16 or income statements, bank statements, investment proofs and details of other income. We share a checklist tailored to your situation.", sort_order: 1 },
  { question: "How quickly will you respond to an enquiry?", answer: "We aim to respond to every enquiry within one working day, and urgent notices are prioritised.", sort_order: 2 },
  { question: "Do you work with clients outside Siliguri?", answer: "Yes. Most of our work is handled online, so we support clients across India through secure document sharing and video calls.", sort_order: 3 },
  { question: "Can you handle monthly bookkeeping and GST together?", answer: "Absolutely. Combined packages keep your books, GST returns and TDS compliance in one place, with monthly MIS reports.", sort_order: 4 }
];

/** Runs once on a fresh database. Deleting all items later will NOT bring the defaults back. */
export async function seed() {
  const flag = await Setting.findOne({ key: "_seeded" });
  if (flag) return;
  await Setting.bulkWrite(Object.entries(defaultSettings).map(([key, value]) => ({
    updateOne: { filter: { key }, update: { $setOnInsert: { key, value } }, upsert: true }
  })));
  if (!(await Service.countDocuments())) await Service.insertMany(services);
  if (!(await Testimonial.countDocuments())) await Testimonial.insertMany(testimonials);
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
