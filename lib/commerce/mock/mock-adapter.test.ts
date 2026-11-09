import { describe, expect, it } from "vitest";
import { BUYER, createMockStore, FAKE_AUTHORIZATION, VARIANTS } from "@/test/fixtures";
import { money } from "../money";
import type { MockStoreAdapter } from "./mock-adapter";
import { createMemoryStorage } from "./storage";

const chf = (amountMinor: number) => money(amountMinor, "CHF");

async function variantStock(store: MockStoreAdapter, handle: string, variantId: string) {
  const product = await store.getProduct(handle);
  return product?.variants.find((variant) => variant.id === variantId);
}

async function readyCart(store: MockStoreAdapter, variantId: string, quantity: number) {
  const cart = await store.createCart();
  await store.addToCart(cart.id, variantId, quantity);
  await store.updateBuyerIdentity(cart.id, BUYER);
  return cart.id;
}

describe("MockStoreAdapter stock rules", () => {
  it("blocks adding more than the available stock", async () => {
    const store = createMockStore();
    const { id } = await store.createCart();
    await store.addToCart(id, VARIANTS.ridge29, 3);

    await expect(store.addToCart(id, VARIANTS.ridge29, 2)).rejects.toMatchObject({
      code: "OUT_OF_STOCK",
      message: "Only 4 of Ridge Trail Tyre (29 × 2.4) are available.",
    });
    expect((await store.getCart(id))?.lines[0].quantity).toBe(3);
  });

  it("refuses sold-out variants", async () => {
    const store = createMockStore();
    const { id } = await store.createCart();
    await expect(store.addToCart(id, VARIANTS.pump, 1)).rejects.toMatchObject({ code: "OUT_OF_STOCK" });
  });

  it("caps each line at the per-order limit even when stock is plentiful", async () => {
    const store = createMockStore();
    const { id } = await store.createCart();
    await expect(store.addToCart(id, VARIANTS.tubePresta, 11)).rejects.toMatchObject({
      message: expect.stringContaining("up to 10"),
    });
  });

  it("checks stock when a line quantity changes, and removes a line set to 0", async () => {
    const store = createMockStore();
    const { id } = await store.createCart();
    const cart = await store.addToCart(id, VARIANTS.ridge29, 1);
    const lineId = cart.lines[0].id;

    await expect(store.updateCartLine(id, lineId, 5)).rejects.toMatchObject({ code: "OUT_OF_STOCK" });
    expect((await store.updateCartLine(id, lineId, 4)).lines[0].quantity).toBe(4);
    expect((await store.updateCartLine(id, lineId, 0)).lines).toHaveLength(0);
  });

  it("decrements stock when an order is created, down to sold out", async () => {
    const store = createMockStore();
    const cartId = await readyCart(store, VARIANTS.ridge29, 4);

    const order = await store.createOrder({ cartId, paymentReference: FAKE_AUTHORIZATION });

    expect(order.name).toBe("#DEMO-1001");
    expect(order.financialStatus).toBe("PAID");
    expect(await variantStock(store, "ridge-trail-tyre", VARIANTS.ridge29)).toMatchObject({
      quantityAvailable: 0,
      availableForSale: false,
    });
    expect(await store.getCart(cartId)).toBeNull();
    expect(await store.getOrders()).toEqual([order]);
  });

  it("refuses an order when another tab bought the stock first", async () => {
    const storage = createMemoryStorage();
    const tabA = createMockStore(storage);
    const tabB = createMockStore(storage);
    const cartA = await readyCart(tabA, VARIANTS.ridge29, 3);
    const cartB = await readyCart(tabB, VARIANTS.ridge29, 2);
    await tabB.createOrder({ cartId: cartB, paymentReference: FAKE_AUTHORIZATION });

    await expect(tabA.createOrder({ cartId: cartA, paymentReference: FAKE_AUTHORIZATION })).rejects.toMatchObject({
      code: "OUT_OF_STOCK",
      message: "Only 2 of Ridge Trail Tyre (29 × 2.4) are available.",
    });
    expect((await variantStock(tabA, "ridge-trail-tyre", VARIANTS.ridge29))?.quantityAvailable).toBe(2);
    expect(await tabA.getOrders()).toHaveLength(1);
  });
});

describe("MockStoreAdapter cart", () => {
  it("survives a page refresh because state lives in storage", async () => {
    const storage = createMemoryStorage();
    const { id } = await createMockStore(storage).createCart();
    await createMockStore(storage).addToCart(id, VARIANTS.tubePresta, 2);

    expect((await createMockStore(storage).getCart(id))?.totalQuantity).toBe(2);
  });

  it("merges repeat adds of the same variant into one line", async () => {
    const store = createMockStore();
    const { id } = await store.createCart();
    await store.addToCart(id, VARIANTS.tubePresta, 1);
    const cart = await store.addToCart(id, VARIANTS.tubePresta, 2);
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]).toMatchObject({ quantity: 3, cost: { totalAmount: chf(3_570) } });
  });

  it("totals subtotal, shipping, and included VAT", async () => {
    const store = createMockStore();
    const { id } = await store.createCart();

    let cart = await store.addToCart(id, VARIANTS.gravel40Black, 1);
    expect(cart.cost).toEqual({
      subtotalAmount: chf(5_290),
      shippingAmount: chf(790),
      totalTaxAmount: chf(456),
      totalAmount: chf(6_080),
      taxesIncluded: true,
    });

    cart = await store.addToCart(id, VARIANTS.ridge275, 1);
    cart = await store.addToCart(id, VARIANTS.tubePresta, 1); // subtotal CHF 129.70: free standard post
    expect(cart.cost.shippingAmount).toEqual(chf(0));
    expect(cart.cost.totalAmount).toEqual(chf(12_970));

    cart = await store.selectDeliveryOption(id, "express");
    expect(cart.selectedDeliveryOptionHandle).toBe("express");
    expect(cart.cost.totalAmount).toEqual(chf(14_460));
    expect(cart.cost.totalTaxAmount).toEqual(chf(1_083));
  });
});

describe("MockStoreAdapter orders", () => {
  it("needs checkout details and a fake-gateway authorisation", async () => {
    const store = createMockStore();
    const { id } = await store.createCart();
    await store.addToCart(id, VARIANTS.tubePresta, 1);

    await expect(store.createOrder({ cartId: id, paymentReference: FAKE_AUTHORIZATION })).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
    await store.updateBuyerIdentity(id, BUYER);
    await expect(store.createOrder({ cartId: id, paymentReference: "4242424242424242" })).rejects.toMatchObject({
      message: "The payment was not authorised.",
    });
    expect(await store.getOrders()).toEqual([]);
  });

  it("numbers orders and keeps the newest first", async () => {
    const store = createMockStore();
    const first = await store.createOrder({
      cartId: await readyCart(store, VARIANTS.tubePresta, 1),
      paymentReference: FAKE_AUTHORIZATION,
    });
    const second = await store.createOrder({
      cartId: await readyCart(store, VARIANTS.tubePresta, 1),
      paymentReference: FAKE_AUTHORIZATION,
    });
    expect([first.name, second.name]).toEqual(["#DEMO-1001", "#DEMO-1002"]);
    expect((await store.getOrders()).map((order) => order.name)).toEqual(["#DEMO-1002", "#DEMO-1001"]);
    expect(await store.getOrder(first.id)).toEqual(first);
  });

  it("restores the seeded stock and clears orders on reset", async () => {
    const store = createMockStore();
    await store.createOrder({
      cartId: await readyCart(store, VARIANTS.ridge29, 2),
      paymentReference: FAKE_AUTHORIZATION,
    });
    await store.resetDemoData();

    expect(await store.getOrders()).toEqual([]);
    expect((await variantStock(store, "ridge-trail-tyre", VARIANTS.ridge29))?.quantityAvailable).toBe(4);
  });
});
