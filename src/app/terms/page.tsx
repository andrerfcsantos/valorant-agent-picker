import type { Metadata } from "next";
import TermsOfService from "@/components/legal/TermsOfService";

const description =
  "The terms of use for the Valorant Agent Picker, a fan-made random agent picker for Valorant.";

export const metadata: Metadata = {
  title: "Terms of Service",
  description,
  alternates: { canonical: "https://www.valorantpicker.com/terms" },
};

export default function Page() {
  return <TermsOfService />;
}
