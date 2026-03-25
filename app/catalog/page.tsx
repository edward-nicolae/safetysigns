import { CatalogGrid } from "@/components/catalog/catalog-grid";
import { getAllSigns } from "@/lib/sign-catalog";
import type { SignProduct } from "@/types/sign";

// Re-render when revalidatePath('/catalog') is called from the admin API
export const revalidate = 0;

export default function CatalogPage() {
  const catalogSigns = getAllSigns() as SignProduct[];

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
