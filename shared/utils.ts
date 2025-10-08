export function generateEventId() {
  return crypto.randomUUID(); // modern browsers, very fast
}
