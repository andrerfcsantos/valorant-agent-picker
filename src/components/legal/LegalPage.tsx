/**
 * Shared, word for word, between the Overwatch Hero Picker and the Valorant
 * Agent Picker. Layout primitives for the legal pages, styled from
 * src/lib/legal/site.ts so the same markup fits both sites.
 */
import type { ReactNode } from "react";
import { legalSite } from "@/lib/legal/site";
import { LAST_UPDATED, OPERATOR } from "./types";

const { styles } = legalSite;

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="text-white flex flex-col max-w-full px-[20%] pt-8 mb-12 max-[1000px]:px-6 text-start">
      <h1 className={`${styles.heading} text-start`}>{title}</h1>
      <p className={`${styles.body} mb-6 text-gray-300`}>
        Last updated: {LAST_UPDATED}
      </p>
      {children}
    </article>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className={`${styles.heading} text-start mt-6 mb-3`}>{children}</h2>
  );
}

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className={`${styles.body} text-start font-bold text-base mt-2 mb-2`}>
      {children}
    </h3>
  );
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className={`${styles.body} mb-4 text-[1.05em] leading-relaxed`}>
      {children}
    </p>
  );
}

export function UL({ children }: { children: ReactNode }) {
  return (
    <ul
      className={`${styles.body} list-disc pl-8 mb-4 text-[1.05em] leading-relaxed space-y-1`}
    >
      {children}
    </ul>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      className={`${styles.link} underline underline-offset-2`}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
    >
      {children}
    </a>
  );
}

export function Email() {
  return <A href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</A>;
}
