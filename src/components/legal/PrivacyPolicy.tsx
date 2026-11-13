/**
 * Shared, word for word, between the Overwatch Hero Picker and the Valorant
 * Agent Picker. Per-site facts come from src/lib/legal/site.ts; edit both
 * copies together and bump LAST_UPDATED in types.ts.
 */
import { legalSite as site } from "@/lib/legal/site";
import { A, Email, H2, H3, LegalPage, P, UL } from "./LegalPage";
import { OPERATOR } from "./types";

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy">
      <P>
        This policy explains what personal data the {site.name} (
        <A href={site.url}>{site.domain}</A>) collects, why, who it is shared
        with, and the rights you have over it. The {site.name} is part of{" "}
        <A href="https://heropickers.com">Hero Pickers</A>, a small group of
        fan-made sites (heropickers.com, owheropicker.com and
        valorantpicker.com) that share this policy.
      </P>

      <H2>The short version</H2>
      <UL>
        <li>
          You can use the site without an account and without telling us who you
          are.
        </li>
        <li>
          Your {site.game === "Valorant" ? "agent" : "hero"} selections, presets
          and settings are saved in your own browser, not on our servers.
        </li>
        <li>
          We use analytics to understand how the site is used and to fix bugs.
        </li>
        <li>
          There are no ads, and we never sell your personal data or use it for
          advertising.
        </li>
        <li>
          If you sign in with Google, we only receive your basic profile (name,
          email address and profile picture), and you can delete your account at
          any time.
        </li>
      </UL>

      <H2>Who is responsible for your data</H2>
      <P>
        The sites are run by {OPERATOR.name}, an individual based in{" "}
        {OPERATOR.country}, who is the data controller under the EU General Data
        Protection Regulation (GDPR). In this policy, “we” and “us” refer to
        them. You can reach us about anything in this policy at <Email />.
      </P>

      <H2>What we collect and why</H2>

      <H3>Settings saved in your browser</H3>
      <P>
        Your selected {site.game === "Valorant" ? "agents" : "heroes"}, saved
        presets, squad setup and display options are stored in your browser’s
        local storage so they are still there the next time you visit. This data
        stays on your device; we don’t receive it. You can remove it at any time
        by clearing your browser’s site data.
      </P>

      <H3>Share links</H3>
      <P>
        When you use a share button, the selection or preset you share
        (including any preset name you typed) is encoded inside the link itself.
        Anyone who has the link can see what it contains, so don’t put personal
        information in preset names you intend to share.
      </P>

      <H3>Analytics</H3>
      <P>
        Google Analytics runs {site.googleAnalyticsNote}. It records the pages
        you visit, how you got to the site, and general information about your
        device and browser (such as browser type, screen size, language and
        approximate location derived from your IP address). We use this only to
        see, in aggregate, how many people use the site and which features are
        popular.
      </P>
      {site.usesPostHog && (
        <P>
          We also use PostHog, a product analytics service, to understand how
          the site’s features are used and to find and fix problems. PostHog
          records the pages you view, the buttons and links you click, the
          features you use (for example, the options in place when you roll a
          hero), technical information about your device and browser, your IP
          address and the approximate location derived from it, and reports of
          errors that occur on the page. On some visits it also makes a session
          recording: a replay of how the page responded to your clicks, scrolls
          and mouse movements, which helps us find confusing or broken parts of
          the site. Recordings mask what you type into text fields. Room keys
          from the stream overlay are removed from analytics data before it is
          sent, and session recording is turned off on the stream overlay pages.
        </P>
      )}

      {site.hasStreamOverlay && (
        <>
          <H3>Stream overlay and companion view</H3>
          <P>
            If you use the companion view of the stream overlay, the overlay
            sends each hero it rolls to our relay server so the companion screen
            can show it. The relay stores only the most recent roll for your
            room, which is identified by a random key in your overlay link. A
            room’s data is deleted automatically after 7 days without activity.
            Your IP address is used briefly to limit how many connections and
            rolls one address can make, to protect the service from abuse; it is
            not stored.
          </P>
        </>
      )}

      <H3>Hosting and security</H3>
      <P>
        The sites are hosted on Cloudflare. Like any web host, Cloudflare
        processes your IP address and the technical details of each request
        (such as the page requested, browser type and time) in order to deliver
        the site, keep it secure and protect it against attacks. We use the logs
        only to operate and debug the site, and they are kept only for a short
        period.
      </P>

      <H3>Accounts (Sign in with Google)</H3>
      <P>
        You will be able to create an account and sign in with your Google
        account. When you do, Google shares the following with us, and nothing
        more:
      </P>
      <UL>
        <li>
          your Google account identifier, which we use to recognise you when you
          sign in;
        </li>
        <li>
          your email address, which we use to contact you about your account,
          purchases and important changes to the service;
        </li>
        <li>
          your name and profile picture, which we use to show you which account
          you are signed in with.
        </li>
      </UL>
      <P>
        We only request Google’s basic sign-in permissions (<em>openid</em>,{" "}
        <em>email</em> and <em>profile</em>). We have no access to your Gmail,
        contacts, files, calendar or any other Google data, and we never see
        your Google password. While signed in, we also store the presets and
        settings you choose to save to your account so they are available on all
        your devices, and a session cookie that keeps you signed in.
      </P>

      <H3>Premium features and payments</H3>
      <P>
        We plan to offer optional paid premium features. If you buy them,
        payments are handled by a third-party payment provider, which will be
        named on the checkout page. We never receive or store your full card or
        bank details. We receive and keep a record of your purchase: what you
        bought, the price, the date, your country (needed to apply the correct
        VAT) and the status of any subscription.
      </P>

      <H3>Donations</H3>
      <P>
        Donations are made through{" "}
        <A href="https://www.buymeacoffee.com/heropickers">Buy Me a Coffee</A>,
        which processes your payment and personal data under its own privacy
        policy. Buy Me a Coffee lets us see your name or nickname, any message
        you leave, and the amount you donated, unless you choose to donate
        anonymously.
      </P>

      <H3>When you contact us</H3>
      <P>
        If you email us or message us on Discord, we use your message and
        contact details only to reply to you and help with your request.
      </P>

      <H2>How we use Google user data</H2>
      <P>
        We use the information we receive from Google only to create and operate
        your Hero Pickers account, as described above. We do not use it for
        advertising, we do not sell it, and we do not share it with anyone
        except the service providers we need to run the sites (listed below). We
        do not use it to develop, improve or train generalised artificial
        intelligence or machine learning models. Our use and transfer of
        information received from Google APIs follows the{" "}
        <A href="https://developers.google.com/terms/api-services-user-data-policy">
          Google API Services User Data Policy
        </A>
        , including the Limited Use requirements.
      </P>

      <H2>Legal bases for processing</H2>
      <P>Under the GDPR, we rely on the following legal bases:</P>
      <UL>
        <li>
          <strong>Contract</strong>: to provide your account, the features you
          use and any premium features you buy.
        </li>
        <li>
          <strong>Legitimate interests</strong>: to keep the sites secure,
          prevent abuse, fix bugs and understand how the sites are used so we
          can improve them. You can object to this at any time (see “Your
          rights”).
        </li>
        <li>
          <strong>Legal obligation</strong>: to keep invoices and payment
          records as required by Portuguese tax law.
        </li>
        <li>
          <strong>Consent</strong>: where we ask for it. You can withdraw your
          consent at any time, without affecting anything that happened before.
        </li>
      </UL>

      <H2>Who we share data with</H2>
      <P>
        We share personal data only with service providers that process it on
        our behalf, under contracts that require them to protect it:
      </P>
      <UL>
        <li>
          <strong>Cloudflare, Inc.</strong>: website hosting, security
          {site.hasStreamOverlay && ", the stream overlay relay"} and, once
          accounts launch, account storage.
        </li>
        <li>
          <strong>Google LLC / Google Ireland Ltd.</strong>: Google Analytics
          and Sign in with Google.
        </li>
        {site.usesPostHog && (
          <li>
            <strong>PostHog, Inc.</strong>: product analytics, session
            recordings and error tracking. Data is stored in the United States.
          </li>
        )}
        <li>
          <strong>Our payment provider</strong>: processing payments for premium
          features, once they launch.
        </li>
      </UL>
      <P>
        We may also disclose data if the law requires it, or to protect the
        rights and safety of our users or ourselves. We do not sell personal
        data, and we do not share it with advertisers.
      </P>

      <H2>International transfers</H2>
      <P>
        Some of these providers are based in, or store data in, the United
        States and other countries outside the European Economic Area. When data
        is transferred there, we rely on the EU–US Data Privacy Framework for
        providers certified under it, or on the European Commission’s Standard
        Contractual Clauses.
      </P>

      <H2>How long we keep data</H2>
      <UL>
        <li>Settings saved in your browser: until you clear them.</li>
        <li>
          Analytics data: up to 14 months
          {site.usesPostHog &&
            "; session recordings are kept for a shorter period"}
          .
        </li>
        {site.hasStreamOverlay && (
          <li>Stream overlay rooms: deleted after 7 days without activity.</li>
        )}
        <li>
          Hosting and security logs: a short period, typically a few days.
        </li>
        <li>
          Account data: until you delete your account. We delete it within 30
          days of your request, and any copies in backups expire within a
          further 30 days.
        </li>
        <li>
          Purchase records and invoices: for as long as Portuguese tax law
          requires (currently up to 10 years), even after you delete your
          account.
        </li>
        <li>
          Emails and messages to us: as long as needed to deal with your
          request, and no longer than 2 years after our last exchange.
        </li>
      </UL>

      <H2>Cookies and browser storage</H2>
      <UL>
        <li>
          <strong>Essential</strong>: local storage entries that remember your
          selections, presets and settings; and, once accounts launch, a session
          cookie that keeps you signed in. These are needed for the site to work
          the way you expect.
        </li>
        <li>
          <strong>Analytics</strong>: Google Analytics cookies (named{" "}
          <em>_ga</em> and <em>_ga_*</em>)
          {site.usesPostHog && (
            <>
              {" "}
              and PostHog cookies and local storage entries (named <em>ph_*</em>
              ; on the stream overlay pages, PostHog uses local storage only)
            </>
          )}
          . These hold a random identifier so visits from the same browser can
          be counted together.
        </li>
      </UL>
      <P>
        You can block or delete cookies and site data in your browser settings,
        and you can opt out of Google Analytics with Google’s{" "}
        <A href="https://tools.google.com/dlpage/gaoptout">opt-out add-on</A>.
        Blocking analytics does not affect how the site works.
      </P>

      <H2>Your rights</H2>
      <P>Under the GDPR, you have the right to:</P>
      <UL>
        <li>
          access the personal data we hold about you and get a copy of it;
        </li>
        <li>have inaccurate data corrected;</li>
        <li>have your data deleted;</li>
        <li>
          restrict or object to how we process your data, including analytics;
        </li>
        <li>receive your account data in a portable format;</li>
        <li>withdraw any consent you have given.</li>
      </UL>
      <P>
        To use any of these rights, email <Email />. Once accounts are
        available, you will also be able to delete your account yourself. We
        reply within one month. Because the site does not ask who you are, we
        may be unable to link analytics data to you unless you can give us
        details that identify it.
      </P>
      <P>
        If you think we have handled your data wrongly, please contact us first.
        You also have the right to complain to a data protection authority. In
        Portugal, this is the Comissão Nacional de Proteção de Dados (
        <A href="https://www.cnpd.pt">CNPD</A>), but you can also complain to
        the authority in the country where you live.
      </P>

      <H2>Children</H2>
      <P>
        Anyone can use the site, and no account is needed to use it. To create
        an account, you must be at least 13 years old, or have permission from a
        parent or guardian. Purchases must be made by an adult, or with the
        permission of a parent or guardian. If you are a parent or guardian and
        believe your child has given us personal data without your permission,
        contact us and we will delete it.
      </P>

      <H2>Security</H2>
      <P>
        All connections to the sites are encrypted with HTTPS, and we limit the
        data we collect to what we need. No system is perfectly secure, but if a
        breach affects your personal data, we will notify you and the
        authorities as the law requires.
      </P>

      <H2>Changes to this policy</H2>
      <P>
        We may update this policy as the sites change, for example when accounts
        or premium features launch. The date at the top shows when it was last
        changed. If you have an account and the change is significant, we will
        tell you by email or on the site before it takes effect.
      </P>

      <H2>Contact</H2>
      <P>
        For any question about this policy or your personal data, email{" "}
        <Email />.
      </P>
    </LegalPage>
  );
}
