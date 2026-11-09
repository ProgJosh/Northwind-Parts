/**
 * A random id such as `cart_3f9c1a…`. Uses `crypto.getRandomValues`, which
 * (unlike `crypto.randomUUID`) also works on plain-HTTP LAN addresses.
 */
export function randomId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `${prefix}_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
