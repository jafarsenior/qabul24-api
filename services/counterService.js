import { Counter } from '../models/index.js';

export async function nextCounter(name) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { value: 1 } },
    { new: true, upsert: true },
  ).lean();

  return counter.value;
}

export async function nextTicketNumber() {
  const value = await nextCounter('ticket');
  return `TKT-${new Date().getFullYear()}-${String(value).padStart(4, '0')}`;
}
