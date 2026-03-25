import { notFound } from "next/navigation";
import { SignConfigurator } from "@/components/configure/sign-configurator";
import { getAllSigns } from "@/lib/sign-catalog";
import type { SignProduct } from "@/types/sign";

export const revalidate = 0;

type PageProps = {
  params: {
    id: string;
  };
  searchParams: {
    lineId?: string;
  };
};

export default function ConfiguratorSignPage({ params, searchParams }: PageProps) {
  const allSigns = getAllSigns() as SignProduct[];
  const sign = allSigns.find((item) => item.id === params.id);

  if (!sign) {
    notFound();
  }

  return <SignConfigurator sign={sign} lineId={searchParams.lineId} />;
}
