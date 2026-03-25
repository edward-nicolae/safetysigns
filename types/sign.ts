export type SignCategory =
  | "Mandatory"
  | "Warning"
  | "Prohibition"
  | "Fire Safety"
  | "Information";

export interface SignProduct {
  id: string;
  title: string;
  category: SignCategory;
  price: number;
  image: string;
  description?: string;
  /** Any extra fields added via the admin UI */
  [key: string]: unknown;
}
