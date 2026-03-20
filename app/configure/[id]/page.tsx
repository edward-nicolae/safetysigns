import { notFound } from "next/navigation";
import signs from "@/data/signs.json";
import { SignConfigurator } from "@/components/configure/sign-configurator";
import type { SignProduct } from "@/types/sign";

type PageProps = {
  params: {
    id: string;
  };
};

const catalogSigns = signs as SignProduct[];

export default function ConfigureSignPage({ params }: PageProps) {
  const sign = catalogSigns.find((item) => item.id === params.id);

  if (!sign) {
    notFound();
  }

  return <SignConfigurator sign={sign} />;
}
