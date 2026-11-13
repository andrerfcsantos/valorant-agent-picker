import type { LegalSite } from "@/components/legal/types";

/**
 * The per-site half of the Privacy Policy and Terms of Service. The documents
 * themselves (src/components/legal) are shared word for word with the
 * Overwatch Hero Picker; only this file differs between the two repos.
 */
export const legalSite: LegalSite = {
  name: "Valorant Agent Picker",
  url: "https://www.valorantpicker.com",
  domain: "valorantpicker.com",
  game: "Valorant",
  publisher: "Riot Games, Inc.",
  publisherNotice:
    'Valorant Agent Picker was created under Riot Games\' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.',
  usesPostHog: false,
  googleAnalyticsNote: "on every page",
  hasStreamOverlay: false,
  styles: {
    heading: "text-[rgb(248,158,74)]",
    body: "",
    link: "text-orange-400 visited:text-orange-600 hover:text-orange-600",
  },
};
