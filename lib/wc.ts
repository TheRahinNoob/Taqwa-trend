export type WCProduct = {
  id: number;
  name: string;
  slug: string;
  price: string;
  images: { src: string; alt?: string }[];
};

export async function getProducts() {
  const res = await fetch("http://localhost:3000/api/products", {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to load products");
  return (await res.json()) as WCProduct[];
}