# Northwind Parts (demo store)

> **DEMO STORE – no real orders or payments.** Northwind Parts is a fictional bike-parts shop built to
> demonstrate an e-commerce prototype. Nothing is sold, charged, or shipped.

A Next.js storefront with a Shopify-shaped data layer, live stock, a persistent cart, a checkout that
validates every step, and a clearly labelled fake payment gateway. The brand, design, and copy are original.
Product photos are openly licensed stock images from Wikimedia Commons (see [Credits](#credits)).

## Quick start

Requirements: Node.js 22.12 or newer (tested with Node 24) and npm.

```bash
npm install
npm run dev   # http://localhost:3000
```

No environment variables are needed: the mock store is the default.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build`, then `npm start` | Production build and server |
| `npm run lint` | ESLint, zero warnings allowed |
| `npm run typecheck` | Generates route types, then runs `tsc --noEmit` |
| `npm test` | Vitest unit and component tests |
| `npm run test:e2e` | Playwright purchase flow at desktop and 360 px phone width (builds and serves the app on port 3100) |
| `npm run check` | Lint, typecheck, and unit tests |

Before the first Playwright run, install its browser: `npx playwright install chromium`.

## Test cards

The fake gateway accepts only these numbers. Use any future expiry date (MM/YY) and any 3-digit
security code. The payment page lists the same cards, each with a **Use** button that fills the form.

| Card number | Result |
| --- | --- |
| `4242 4242 4242 4242` | Approved: the order is placed |
| `4000 0000 0000 0002` | Declined |
| `4000 0000 0000 9995` | Declined: insufficient funds |
| `4000 0000 0000 0119` | Gateway error: nothing is charged |

Any other number is refused with a clear message before anything happens.

## What is real and what is fake

| Real, working code | Fake or simulated |
| --- | --- |
| Catalog with collections, variants, SKUs, prices, and images | The brand, products, prices, and stock levels (all invented) |
| Product images, with credits on each product page | The photos show similar parts by other makers, not the listed items |
| Live stock per variant: low-stock and sold-out states, a per-order limit, stock taken off when an order is placed | The warehouse: stock lives in your browser, not on a server |
| Persistent cart, quantity changes, totals with shipping and included VAT | Shipping rates and the free-shipping threshold |
| Checkout steps with validation, order confirmation, demo admin | Payment: `lib/fake-gateway.ts` only pretends to authorise test cards |
| Shopify Storefront API adapter (off by default) | Orders: no shop receives them, no email is sent, nothing ships |

**Privacy.** In mock mode nothing leaves the browser. Card fields are only compared with the test-card
list: they are never stored, logged, or sent, and browser and password-manager autofill is turned off on
them. Contact and address details are saved in the browser's localStorage with the demo cart and order;
the **Reset demo data** button in the demo admin deletes them.

## How it works

### One adapter for all store logic

- `lib/commerce/types.ts` holds Shopify-shaped types: `Product`, `ProductVariant`, `Collection`, `Cart`,
  `CartLine`, `Order`. Money is stored in integer minor units (`{ amountMinor: 4990, currencyCode: "CHF" }`),
  the one deliberate difference from Shopify's decimal strings.
- `lib/commerce/adapter.ts` defines `StoreAdapter`: `getProducts`, `getProduct`, `getCollections`,
  `getCollection`, `createCart`, `getCart`, `addToCart`, `updateCartLine`, `removeCartLine`,
  `updateBuyerIdentity`, `selectDeliveryOption`, `createOrder`, `getOrder`, `getOrders`.
- `lib/commerce/mock/` is the `MockStoreAdapter`. It is seeded from `data/catalog.json` and keeps carts,
  orders, and stock in localStorage (in memory on the server and in tests).
- `lib/commerce/shopify/` is the `ShopifyStoreAdapter` for the Storefront API.
- `lib/commerce/create-store.ts` picks the adapter from environment variables.

Components reach the adapter through React context (`useStore`, `useCart`, `useStoreQuery`) and never
import a specific backend.

### Rendering

Pages are prerendered with Next.js 16 (Cache Components). Product and category routes are generated
from the catalog at build time, so unknown handles return a real 404 and tabs get product titles.
Everything that changes (stock, cart, and orders) loads in the browser through the adapter, so every
visitor gets a private sandbox store: buying the last tyre sells it out only for you.

### Stock rules (`lib/commerce/stock.ts`)

- "Low stock" at 5 units or fewer; "Sold out" at 0. Sold-out options stay visible but can't be bought.
- At most 10 of one variant per order, and never more than is in stock.
- Checked when adding to the cart, when changing a quantity, and again when the order is created,
  because another tab may have bought the stock in the meantime.

### Pricing (mock store only, `lib/commerce/mock/pricing.ts`)

- Prices are in CHF and include Swiss VAT (8.1 %); totals show the VAT included.
- Standard post CHF 7.90, free from CHF 120.00; express courier CHF 14.90.
- Delivery to Switzerland and Liechtenstein (4-digit postcodes).

## Swapping in a real Shopify store

Test this only against a Shopify **development store**, and never commit tokens.

1. In the development store, set up a headless storefront (for example with the Headless sales channel)
   and create a **public** Storefront API access token. Allow it to read products, product tags, and
   product inventory (`unauthenticated_read_product_inventory`, needed for live stock), and to read and
   write carts.
2. Copy `.env.example` to `.env.local` (git-ignored) and set:

   ```bash
   NEXT_PUBLIC_STORE_BACKEND=shopify
   NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=your-dev-store.myshopify.com
   NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=your-public-token
   ```

3. Restart `npm run dev`. For production, rebuild: `NEXT_PUBLIC_*` values are baked in at build time.
4. Shop as usual. On the payment step, **Continue to secure checkout** sends the shopper to the cart's
   `checkoutUrl`, because Shopify hosts real checkout and payment.

What changes in Shopify mode:

- Collections, products, variants, and stock come from your store, and the riding-style filter uses your
  product tags. Images load from `cdn.shopify.com`, which `next.config.ts` already allows.
- Only the email and country are passed on; the shopper confirms the address in Shopify's checkout.
- Shopify creates the orders, so `createOrder`, `getOrder`, and `getOrders` throw an `UNSUPPORTED` store
  error and the demo admin shows a notice to use the Shopify admin instead.
- The public token is visible in the browser, which is how Shopify's public tokens are meant to be used.
  Never put a private (server) token in a `NEXT_PUBLIC_` variable.

## Project structure

```text
app/                 routes: home, products, collections, cart, checkout, orders, admin
components/          UI by area: layout, product, listing, cart, checkout, order, admin, ui
data/catalog.json    seed catalog: 14 products, 6 collections, starting stock
lib/commerce/        types, StoreAdapter, mock and Shopify adapters, stock, money, and search helpers
lib/checkout/        checkout form validation
lib/fake-gateway.ts  the fake payment gateway
public/products/     product photos (Wikimedia Commons, credits in data/photo-credits.json)
e2e/                 Playwright purchase flow
test/                shared test fixtures
```

## Shortcuts and limits

- Mock data is per browser. Clearing site data, or **Reset demo data**, restores the seeded store.
  Where localStorage is blocked (some private modes), the store resets on every reload.
- Product data loads in the browser, so pages show skeletons for a moment and product HTML isn't
  server-rendered. That's fine for this `noindex` demo, but a production store would render the catalog
  on the server.
- The Shopify adapter is covered by unit tests against recorded response shapes, not a live store. Try it
  with your development store before relying on it.
- The Shopify adapter loads up to 100 products and filters them in the app; a large catalog should
  filter in the GraphQL query instead.
- An unknown product or category URL shows the not-found page, marked `noindex`. The very first request
  for each unknown URL still returns HTTP 200, because Next.js starts streaming the page before the check
  runs; later requests return 404. A proxy check would fix this if exact status codes matter.
- No customer accounts, discount codes, or multiple currencies. The demo admin has no login.

## Credits

Product photos come from Wikimedia Commons under CC0, public domain, CC BY 3.0, and CC BY-SA 3.0/4.0
licences. Each photo was cropped or placed on a square background, and two makers' logos were blurred.
Authors, licences, and changes are listed in `data/photo-credits.json`, on each product page, and at
`/credits`. Fonts: Archivo and IBM Plex Mono (SIL Open Font License), loaded with `next/font`.
