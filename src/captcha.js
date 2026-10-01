import { nanoid } from "nanoid";

const store = new Map();

export function createCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const id = nanoid(10);
  store.set(id, { answer: String(a + b), expires: Date.now() + 5 * 60 * 1000 });
  return { id, question: `${a} + ${b} = ?` };
}

export function verifyCaptcha(id, answer) {
  const item = store.get(id);
  store.delete(id);
  if (!item || Date.now() > item.expires) return false;
  return item.answer === String(answer).trim();
}

setInterval(() => {
  const now = Date.now();
  for (const [id, item] of store) if (item.expires < now) store.delete(id);
}, 60_000).unref();