import { beforeAll, describe, expect, it } from "vitest";
import { createMockStore } from "@/test/fixtures";
import { applyProductQuery, filterableTags } from "./product-query";
import type { Product } from "./types";

let products: Product[];
const titles = (list: Product[]) => list.map((product) => product.title);

beforeAll(async () => {
  products = await createMockStore().getProducts();
});

describe("product search, filter, and sort", () => {
  it("matches every search word against titles, types, styles, options, and SKUs", () => {
    expect(titles(applyProductQuery(products, { search: "gravel tyre" }))).toEqual(["Allroad Gravel Tyre"]);
    expect(titles(applyProductQuery(products, { search: "schrader" }))).toEqual(["Sealed Inner Tube"]);
    expect(titles(applyProductQuery(products, { search: "nw-ws-multi" }))).toEqual(["16-Function Multi-Tool"]);
    expect(applyProductQuery(products, { search: "unicycle" })).toEqual([]);
  });

  it("filters by collection, riding style, and availability", () => {
    expect(titles(applyProductQuery(products, { collection: "lights" }))).toEqual([
      "Beam Front Light",
      "Glow Rear Light",
    ]);
    expect(applyProductQuery(products, { tag: "mtb" }).every((product) => product.tags.includes("mtb"))).toBe(true);
    expect(titles(applyProductQuery(products, { inStockOnly: true }))).not.toContain("Track Floor Pump");
  });

  it("sorts by price, date, and name", () => {
    expect(applyProductQuery(products, { sort: "price-asc" })[0].title).toBe("Sealed Inner Tube");
    expect(applyProductQuery(products, { sort: "price-desc" })[0].title).toBe("Wide-Range Cassette");
    expect(applyProductQuery(products, { sort: "newest" })[0].title).toBe("Wide-Range Cassette");
    expect(applyProductQuery(products, { sort: "title" })[0].title).toBe("16-Function Multi-Tool");
    expect(titles(applyProductQuery(products, { sort: "featured" }))).toEqual(titles(products));
  });

  it("offers riding styles but hides merchandising tags", () => {
    const tags = filterableTags(products);
    expect(tags).toEqual(expect.arrayContaining(["road", "gravel", "mtb", "city"]));
    expect(tags).not.toContain("featured");
  });
});
