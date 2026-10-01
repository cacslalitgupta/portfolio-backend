import mongoose from "mongoose";

export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function parseBody(schema, body, res) {
  const parsed = schema.safeParse(body);
  if (parsed.success) return parsed.data;
  const i = parsed.error.issues[0];
  res.status(400).json({ message: `${i.path.join(".") || "Input"}: ${i.message}` });
  return null;
}

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ message: "Invalid id." });

/** Mounts full Create / Read / Update / Delete endpoints for a model. */
export function mountCrud(router, path, Model, schema, label) {
  router.get(`/${path}`, wrap(async (_req, res) => {
    res.json(await Model.find().sort({ sort_order: 1, createdAt: 1 }));
  }));

  router.post(`/${path}`, wrap(async (req, res) => {
    const data = parseBody(schema, req.body, res); if (!data) return;
    res.status(201).json(await Model.create(data));
  }));

  router.put(`/${path}/:id`, validId, wrap(async (req, res) => {
    const data = parseBody(schema, req.body, res); if (!data) return;
    const item = await Model.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: `${label} not found.` });
    res.json(item);
  }));

  router.delete(`/${path}/:id`, validId, wrap(async (req, res) => {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: `${label} not found.` });
    res.status(204).end();
  }));
}
