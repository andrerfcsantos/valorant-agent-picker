/**
 * Shared, word for word, between the Overwatch Hero Picker and the Valorant
 * Agent Picker. Per-site facts come from src/lib/legal/site.ts; edit both
 * copies together and bump LAST_UPDATED in types.ts.
 */
import { legalSite as site } from "@/lib/legal/site";
import { A, Email, H2, LegalPage, P, UL } from "./LegalPage";
import { OPERATOR } from "./types";

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service">
      <P>
        These terms apply to your use of the {site.name} (
        <A href={site.url}>{site.domain}</A>), part of{" "}
        <A href="https://heropickers.com">Hero Pickers</A>. The sites are run by{" "}
        {OPERATOR.name}, an individual based in {OPERATOR.country} (“we”, “us”).
        By using the site, you agree to these terms. If you don’t agree, please
        don’t use it.
      </P>

      <H2>The service</H2>
      <P>
        The {site.name} is a free, fan-made tool that picks a random{" "}
        {site.game === "Valorant" ? "agent" : "hero"} for you from the ones you
        select. Picks are random and just for fun; we don’t promise any
        particular result, and the game data on the site may sometimes be out of
        date with the latest {site.game} patch.
      </P>

      <H2>Not affiliated with {site.publisher}</H2>
      <P>
        This is an unofficial fan site. {site.game} and all related names,
        images and other assets belong to {site.publisher}, and are used here
        for fan purposes only. {site.publisherNotice}
      </P>

      <H2>Acceptable use</H2>
      <P>You agree not to:</P>
      <UL>
        <li>use the site for anything illegal;</li>
        <li>
          attack, overload or disrupt the site or its servers, for example with
          automated traffic, or try to get around its rate limits or security;
        </li>
        <li>try to access other people’s accounts or data;</li>
        <li>
          use preset names or share links to spread offensive, hateful or
          illegal content;
        </li>
        <li>
          present the site, or a copy of it, as your own or as an official{" "}
          {site.publisher} product.
        </li>
      </UL>
      {site.hasStreamOverlay && (
        <P>
          You are welcome to show the site and the stream overlay in your
          streams and videos, including monetised ones.
        </P>
      )}

      <H2>Accounts</H2>
      <P>
        Accounts are optional; everything except premium features works without
        one. You sign in with your Google account, and you are responsible for
        keeping that account secure. To create an account, you must be at least
        13 years old, or have permission from a parent or guardian. You can
        delete your account at any time. We may suspend or close an account that
        breaks these terms; if we do, we will tell you why, unless the law
        prevents us.
      </P>

      <H2>Premium features and payments</H2>
      <P>
        We plan to offer optional paid premium features. When they are
        available:
      </P>
      <UL>
        <li>
          Prices, including any VAT, and what each plan includes will be shown
          before you pay. Payments are processed by a third-party payment
          provider.
        </li>
        <li>
          Purchases must be made by an adult, or with the permission of a parent
          or guardian.
        </li>
        <li>
          Subscriptions renew automatically at the end of each billing period
          until you cancel. You can cancel at any time, and you keep access
          until the end of the period you have paid for.
        </li>
        <li>
          If we change the price of a subscription, we will tell you in advance,
          and the new price only applies from your next billing period after the
          notice. You can cancel before then.
        </li>
        <li>
          <strong>Right of withdrawal</strong>: if you are a consumer in the EU,
          you can withdraw from a purchase within 14 days, without giving a
          reason, by emailing <Email />. Because you ask for premium features to
          start straight away, if you withdraw within those 14 days we refund
          what you paid minus the share for the time you already had access.
        </li>
        <li>
          If we stop offering a premium feature you have paid for, we will
          refund the unused part of your payment.
        </li>
      </UL>
      <P>
        These terms do not affect your rights as a consumer under the law,
        including your rights if a paid feature is faulty or not as described.
      </P>

      <H2>Donations</H2>
      <P>
        Donations through{" "}
        <A href="https://www.buymeacoffee.com/heropickers">Buy Me a Coffee</A>{" "}
        are voluntary gifts that help keep the sites running free and without
        ads. They are processed under Buy Me a Coffee’s own terms and do not
        give access to premium features unless we clearly say otherwise.
      </P>

      <H2>Your content</H2>
      <P>
        You keep any rights you have in content you create on the site, such as
        preset names. You allow us to store and display it so we can provide the
        service to you, for example to save presets to your account or show them
        to people you send a share link to. Anyone with a share link can see
        what it contains.
      </P>

      <H2>Our content</H2>
      <P>
        The site’s design, code and original content belong to us, except for
        game assets, which belong to {site.publisher}, and third-party material,
        which belongs to its owners. Please don’t copy or republish the site, or
        substantial parts of it, without permission.
      </P>

      <H2>Availability and changes</H2>
      <P>
        We work to keep the site running, but it is provided as a free hobby
        project, and we can’t guarantee it will always be available or free of
        errors. We may change, add or remove features, or stop running the site.
        If a change significantly affects premium features you have paid for, we
        will tell you in advance, and you can cancel and get a refund for the
        unused part.
      </P>

      <H2>Disclaimer</H2>
      <P>
        Apart from the commitments in these terms and the rights you have by
        law, the site is provided “as is”, without any other promises or
        warranties.
      </P>

      <H2>Liability</H2>
      <P>
        To the extent the law allows, we are not liable for indirect or
        unforeseeable losses, or for losses caused by events outside our
        reasonable control. Our total liability to you is limited to the amount
        you paid us in the 12 months before the claim. Nothing in these terms
        limits liability for intentional misconduct or gross negligence, for
        death or personal injury, or in any other case where the law does not
        allow it to be limited.
      </P>

      <H2>Ending your use</H2>
      <P>
        You can stop using the site and delete your account at any time. We may
        suspend or end your access if you seriously or repeatedly break these
        terms. The sections on content, liability and governing law continue to
        apply after that.
      </P>

      <H2>Governing law and disputes</H2>
      <P>
        These terms are governed by Portuguese law. If you are a consumer, you
        also keep the protection of the mandatory laws of the country where you
        live, and you can bring a claim in the courts there. If you have a
        problem, please contact us first and we will try to resolve it. If you
        are a consumer and we can’t resolve it together, you can also use an
        alternative dispute resolution entity; the Portuguese ones are listed on{" "}
        <A href="https://www.consumidor.gov.pt">consumidor.gov.pt</A>.
      </P>

      <H2>Changes to these terms</H2>
      <P>
        We may update these terms as the site changes, for example when accounts
        or premium features launch. The date at the top shows when they were
        last changed. If you have an account and the change is significant, we
        will tell you in advance by email or on the site. If you keep using the
        site after the change takes effect, the new terms apply.
      </P>

      <H2>Privacy</H2>
      <P>
        How we handle personal data is explained in our{" "}
        <A href="/privacy">Privacy Policy</A>.
      </P>

      <H2>Contact</H2>
      <P>
        For questions about these terms, email <Email />.
      </P>
    </LegalPage>
  );
}
