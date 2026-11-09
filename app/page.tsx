import Image from "next/image";
import Link from "next/link";
import { CollectionTiles, FeaturedProducts } from "@/components/home/home-sections";
import { ButtonLink } from "@/components/ui/button";
import { ChevronRightIcon } from "@/components/ui/icons";

/** Decorative hero art (catalog data is always loaded through the store adapter). */
const HERO_ART = [
  { src: "/products/cassette.webp", figure: "Fig. 01", note: "Drivetrain" },
  { src: "/products/tyre-trail.webp", figure: "Fig. 02", note: "Wheels" },
  { src: "/products/front-light.webp", figure: "Fig. 03", note: "Lights" },
  { src: "/products/multi-tool.webp", figure: "Fig. 04", note: "Workshop" },
];

const HOW_IT_WORKS = [
  {
    title: "Shopify-shaped data",
    body: "Products, variants, carts, and orders follow the Shopify Storefront API. One adapter swaps this mock store for a real Shopify development store.",
  },
  {
    title: "Live stock in your browser",
    body: "Stock, your cart, and your demo orders are kept in this browser only. Buy the last tyre and it sells out, just for you.",
  },
  {
    title: "A fake payment gateway",
    body: "Checkout runs through a simulated gateway that accepts test cards only. Nothing is charged, and card details never leave the page.",
  },
];

function SectionHeading({
  id,
  eyebrow,
  title,
  href,
  linkLabel,
}: {
  id: string;
  eyebrow: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="font-display text-2xl sm:text-3xl">
          {title}
        </h2>
      </div>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold hover:underline">
        {linkLabel}
        <ChevronRightIcon width={16} height={16} />
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="border-b border-line">
        <div className="page-width grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="space-y-6">
            <p className="eyebrow">Bike parts &amp; workshop gear · demo store</p>
            <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
              Parts that keep you riding.
            </h1>
            <p className="max-w-xl text-lg text-ink-soft">
              Tyres, drivetrain, brakes, lights, and tools in a fully working prototype shop. Browse, fill your cart,
              and check out with a test card. Nothing here is real, and nothing is charged.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/products" size="lg">
                Shop all parts
              </ButtonLink>
              <ButtonLink href="#how-it-works" variant="secondary" size="lg">
                How the demo works
              </ButtonLink>
            </div>
          </div>
          <ul role="list" aria-hidden="true" className="grid grid-cols-2 gap-3 sm:gap-4">
            {HERO_ART.map((art, index) => (
              <li
                key={art.src}
                className={`rounded-lg border border-line bg-card p-3 sm:p-4 ${index % 2 === 1 ? "translate-y-6" : ""}`}
              >
                <Image
                  src={art.src}
                  alt=""
                  width={1000}
                  height={1000}
                  preload={index < 2}
                  className="aspect-square h-auto w-full rounded-md object-cover"
                />
                <p className="eyebrow mt-1 truncate">
                  <span className="hidden sm:inline">{art.figure} · </span>
                  {art.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="page-width py-12 sm:py-16" aria-labelledby="categories-heading">
        <SectionHeading
          id="categories-heading"
          eyebrow="Shop by category"
          title="Every part, sorted"
          href="/products"
          linkLabel="All parts"
        />
        <CollectionTiles />
      </section>

      <section className="page-width pb-12 sm:pb-16" aria-labelledby="featured-heading">
        <SectionHeading
          id="featured-heading"
          eyebrow="Workshop picks"
          title="Featured parts"
          href="/products"
          linkLabel="Browse everything"
        />
        <FeaturedProducts />
      </section>

      <section id="how-it-works" className="scroll-mt-6 border-y border-line bg-card" aria-labelledby="how-heading">
        <div className="page-width py-12 sm:py-16">
          <p className="eyebrow">Behind the counter</p>
          <h2 id="how-heading" className="mb-8 mt-1 font-display text-2xl sm:text-3xl">
            How this demo works
          </h2>
          <ol className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((item, index) => (
              <li key={item.title} className="space-y-2">
                <span className="font-mono text-sm font-semibold text-signal">0{index + 1}</span>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="text-ink-soft">{item.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-sm">
            Want to look under the hood? The <Link href="/admin" className="font-semibold underline underline-offset-4">demo admin</Link>{" "}
            lists your demo orders and live stock levels.
          </p>
        </div>
      </section>
    </>
  );
}
