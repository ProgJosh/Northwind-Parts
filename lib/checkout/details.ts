import type { CartBuyerIdentity, MailingAddress } from "@/lib/commerce/types";

/** The demo store delivers inside the Swiss postcode area only. */
export const SHIPPING_COUNTRIES = [
  { code: "CH", name: "Switzerland" },
  { code: "LI", name: "Liechtenstein" },
] as const;

export interface DetailsForm {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  zip: string;
  city: string;
  countryCode: string;
  phone: string;
}

export type DetailsErrors = Partial<Record<keyof DetailsForm, string>>;

export const EMPTY_DETAILS: DetailsForm = {
  email: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  zip: "",
  city: "",
  countryCode: "CH",
  phone: "",
};

export function detailsFromIdentity(identity: CartBuyerIdentity | null): DetailsForm {
  const address = identity?.deliveryAddress;
  return {
    ...EMPTY_DETAILS,
    ...address,
    email: identity?.email ?? "",
    countryCode: address?.countryCode || identity?.countryCode || EMPTY_DETAILS.countryCode,
  };
}

export function validateDetails(form: DetailsForm): DetailsErrors {
  const errors: DetailsErrors = {};
  const email = form.email.trim();
  if (!email) errors.email = "Enter your email address.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter an email address like name@example.com.";

  if (!form.firstName.trim()) errors.firstName = "Enter your first name.";
  if (!form.lastName.trim()) errors.lastName = "Enter your last name.";
  if (!form.address1.trim()) errors.address1 = "Enter your street and house number.";

  const zip = form.zip.trim();
  if (!zip) errors.zip = "Enter your postcode.";
  else if (!/^\d{4}$/.test(zip)) errors.zip = "Swiss and Liechtenstein postcodes have 4 digits.";

  if (!form.city.trim()) errors.city = "Enter your town or city.";

  if (!SHIPPING_COUNTRIES.some((country) => country.code === form.countryCode)) {
    errors.countryCode = "This demo store delivers to Switzerland and Liechtenstein only.";
  }

  const phone = form.phone.trim();
  if (phone && !/^\+?[\d\s()-]{7,20}$/.test(phone)) {
    errors.phone = "Enter a phone number using digits, for example +41 79 123 45 67.";
  }
  return errors;
}

export function toBuyerIdentity(form: DetailsForm): CartBuyerIdentity {
  const address: MailingAddress = {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    address1: form.address1.trim(),
    address2: form.address2.trim(),
    zip: form.zip.trim(),
    city: form.city.trim(),
    countryCode: form.countryCode,
    phone: form.phone.trim(),
  };
  return { email: form.email.trim(), countryCode: form.countryCode, deliveryAddress: address };
}

/** True when the cart holds complete, valid contact and delivery details. */
export function hasCompleteDetails(identity: CartBuyerIdentity | null): boolean {
  return Boolean(identity?.deliveryAddress) && Object.keys(validateDetails(detailsFromIdentity(identity))).length === 0;
}
