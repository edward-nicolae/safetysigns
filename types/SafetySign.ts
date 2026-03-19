export interface SafetySign {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  code: string;
  description: string;
  standards: string[];
  image: string;
  sizes: {
    size: string;
    materials: {
      material: string;
      priceBreaks: { minQty: number; price: number }[];
    }[];
  }[];
}
