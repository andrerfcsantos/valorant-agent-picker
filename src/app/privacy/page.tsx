import type { Metadata } from "next";
import PrivacyPolicy from "@/components/legal/PrivacyPolicy";

const description =
  "How the Valorant Agent Picker handles your personal data: analytics, accounts, payments and your rights.";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description,
  alternates: { canonical: "https://www.valorantpicker.com/privacy" },
};

export default function Page() {
  return <PrivacyPolicy />;
}
