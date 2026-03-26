import { notFound } from "next/navigation";
import { SignConfigurator } from "@/components/configure/sign-configurator";
import { getAllSigns } from "@/lib/sign-catalog";
import { getConfiguratorSettings } from "@/lib/configurator-config";
import type { SignProduct } from "@/types/sign";

type PageProps = {
  params: {
    id: string;
  };
  searchParams: {
    lineId?: string;
  };
};

export default function ConfigureSignPage({ params, searchParams }: PageProps) {
  const sign = (getAllSigns() as SignProduct[]).find((item) => item.id === params.id);

  if (!sign) {
    notFound();
  }

  const settings = getConfiguratorSettings();
  return <SignConfigurator sign={sign} lineId={searchParams.lineId} settings={settings} />;
}
