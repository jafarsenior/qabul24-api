export function now() {
  return new Date().toISOString();
}

export function today() {
  return now().slice(0, 10);
}
