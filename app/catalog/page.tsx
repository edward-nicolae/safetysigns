import signs from "@/data/signs.json";
import { CatalogGrid } from "@/components/catalog/catalog-grid";
import type { SignProduct } from "@/types/sign";

const catalogSigns = signs as SignProduct[];

export default function CatalogPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Catalog</h1>
        <p className="mt-2 text-slate-600">
          Browse mandatory, warning, prohibition, fire safety, and information signs.
        </p>
      </div>

      <CatalogGrid signs={catalogSigns} />
    </section>
  );
}
