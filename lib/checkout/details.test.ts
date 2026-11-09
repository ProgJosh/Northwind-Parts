import { describe, expect, it } from "vitest";
import { BUYER } from "@/test/fixtures";
import {
  detailsFromIdentity,
  EMPTY_DETAILS,
  hasCompleteDetails,
  toBuyerIdentity,
  validateDetails,
  type DetailsForm,
} from "./details";

const valid: DetailsForm = detailsFromIdentity(BUYER);

describe("checkout details", () => {
  it("requires contact and address fields", () => {
    expect(Object.keys(validateDetails(EMPTY_DETAILS)).sort()).toEqual(
      ["address1", "city", "email", "firstName", "lastName", "zip"].sort(),
    );
    expect(validateDetails(valid)).toEqual({});
  });

  it("checks the email, postcode, phone, and delivery country", () => {
    expect(
      validateDetails({ ...valid, email: "anna@", zip: "80020", phone: "call me", countryCode: "DE" }),
    ).toEqual({
      email: "Enter an email address like name@example.com.",
      zip: "Swiss and Liechtenstein postcodes have 4 digits.",
      phone: "Enter a phone number using digits, for example +41 79 123 45 67.",
      countryCode: "This demo store delivers to Switzerland and Liechtenstein only.",
    });
  });

  it("trims the form into a Shopify-style buyer identity", () => {
    const identity = toBuyerIdentity({ ...valid, email: "  anna@example.com ", city: " Zürich " });
    expect(identity).toEqual(BUYER);
    expect(hasCompleteDetails(identity)).toBe(true);
    expect(hasCompleteDetails(null)).toBe(false);
    expect(hasCompleteDetails({ ...BUYER, deliveryAddress: null })).toBe(false);
  });
});
