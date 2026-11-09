/**
 * Shopify Storefront API documents. Each document includes only the fragments
 * it uses, because GraphQL rejects documents with unused fragments.
 */

const IMAGE_FIELDS = /* GraphQL */ `
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`;

const VARIANT_FIELDS = /* GraphQL */ `
  fragment VariantFields on ProductVariant {
    id
    title
    sku
    availableForSale
    quantityAvailable
    price { amount currencyCode }
    compareAtPrice { amount currencyCode }
    selectedOptions { name value }
    image { ...ImageFields }
  }
`;

const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    vendor
    productType
    description
    tags
    publishedAt
    availableForSale
    featuredImage { ...ImageFields }
    images(first: 10) { nodes { ...ImageFields } }
    priceRange {
      minVariantPrice { amount currencyCode }
      maxVariantPrice { amount currencyCode }
    }
    collections(first: 20) { nodes { handle } }
    variants(first: 100) { nodes { ...VariantFields } }
  }
`;

const COLLECTION_FIELDS = /* GraphQL */ `
  fragment CollectionFields on Collection {
    id
    handle
    title
    description
    image { ...ImageFields }
  }
`;

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    buyerIdentity { email countryCode }
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount { amount currencyCode }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost {
          amountPerQuantity { amount currencyCode }
          totalAmount { amount currencyCode }
        }
        merchandise {
          ... on ProductVariant {
            ...VariantFields
            product { handle title featuredImage { ...ImageFields } }
          }
        }
      }
    }
  }
`;

const withProduct = (body: string) => body + PRODUCT_FIELDS + VARIANT_FIELDS + IMAGE_FIELDS;
const withCollection = (body: string) => body + COLLECTION_FIELDS + IMAGE_FIELDS;
const withCart = (body: string) => body + CART_FIELDS + VARIANT_FIELDS + IMAGE_FIELDS;

const CART_PAYLOAD = "cart { ...CartFields } userErrors { message }";

export const PRODUCTS_QUERY = withProduct(
  `query Products($first: Int!) { products(first: $first) { nodes { ...ProductFields } } }`,
);

export const PRODUCT_QUERY = withProduct(
  `query Product($handle: String!) { product(handle: $handle) { ...ProductFields } }`,
);

export const COLLECTIONS_QUERY = withCollection(
  `query Collections { collections(first: 50) { nodes { ...CollectionFields } } }`,
);

export const COLLECTION_QUERY = withCollection(
  `query Collection($handle: String!) { collection(handle: $handle) { ...CollectionFields } }`,
);

export const VARIANT_STOCK_QUERY = /* GraphQL */ `
  query VariantStock($id: ID!) {
    node(id: $id) {
      ... on ProductVariant { id title availableForSale quantityAvailable product { title } }
    }
  }
`;

export const CART_QUERY = withCart(`query Cart($cartId: ID!) { cart(id: $cartId) { ...CartFields } }`);

export const CART_CREATE = withCart(`mutation CartCreate { cartCreate(input: {}) { ${CART_PAYLOAD} } }`);

export const CART_LINES_ADD = withCart(
  `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) { ${CART_PAYLOAD} }
  }`,
);

export const CART_LINES_UPDATE = withCart(
  `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { ${CART_PAYLOAD} }
  }`,
);

export const CART_LINES_REMOVE = withCart(
  `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { ${CART_PAYLOAD} }
  }`,
);

export const CART_BUYER_IDENTITY_UPDATE = withCart(
  `mutation CartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) { ${CART_PAYLOAD} }
  }`,
);
