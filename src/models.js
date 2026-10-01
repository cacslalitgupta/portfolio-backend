import mongoose from "mongoose";
const { Schema, model } = mongoose;

// Every document is sent to the client with a plain `id` instead of `_id`.
const opts = {
  timestamps: true,
  toJSON: {
    versionKey: false,
    transform: (_doc, ret) => { ret.id = ret._id.toString(); delete ret._id; return ret; }
  }
};

export const Setting = model("Setting", new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, default: "" }
}, opts));

export const Service = model("Service", new Schema({
  title: { type: String, required: true, trim: true },
  short_description: { type: String, required: true, trim: true },
  icon: { type: String, default: "Briefcase" },
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  sort_order: { type: Number, default: 99 }
}, opts));

export const Testimonial = model("Testimonial", new Schema({
  name: { type: String, required: true, trim: true },
  role: { type: String, default: "", trim: true },
  quote: { type: String, required: true, trim: true },
  rating: { type: Number, default: 5, min: 1, max: 5 },
  published: { type: Boolean, default: true },
  sort_order: { type: Number, default: 99 }
}, opts));

export const Faq = model("Faq", new Schema({
  question: { type: String, required: true, trim: true },
  answer: { type: String, required: true, trim: true },
  published: { type: Boolean, default: true },
  sort_order: { type: Number, default: 99 }
}, opts));

export const Message = model("Message", new Schema({
  name: String,
  email: String,
  phone: { type: String, default: "" },
  subject: { type: String, default: "" },
  message: String,
  status: { type: String, enum: ["new", "read", "archived"], default: "new" }
}, opts));