"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Navbar.module.css";

const PRIMARY_LINKS = [
  { href: "/", label: "Solo Agent" },
  { href: "/squad", label: "Squad Generator" },
];

const GITHUB_URL = "https://github.com/andrerfcsantos/valorant-agent-picker";
const DISCORD_URL = "https://discord.gg/2yb3ZPzjve";
const COFFEE_URL = "https://www.buymeacoffee.com/heropickers";

const DIN = { fontFamily: "DINNextW1G, Arial, Helvetica, sans-serif" };

/** From this width up the full navbar shows and the menu is gone. */
const DESKTOP_QUERY = "(min-width: 64rem)";

/** Position in the menu, read by the CSS to stagger the rows as it opens. */
function order(index: number): React.CSSProperties {
  return { "--i": index } as React.CSSProperties;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Every link in the menu takes the visitor somewhere, so it closes, as does
  // a click outside it. Focus goes back to the button, since the link it was
  // on is no longer reachable.
  const closeMenu = () => {
    setIsOpen(false);
    toggleRef.current?.focus();
  };

  // Arriving on another page any other way (the browser's Back, say) closes
  // the menu too.
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsOpen(false);
      toggleRef.current?.focus();
    };
    // Tabbing past the last link leaves the menu, so it should not stay open
    // over the page the visitor is now in.
    const onFocusIn = (event: FocusEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    // The menu does not exist at desktop width; without this it would come
    // back, still open, when the window narrows again.
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onDesktopChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    desktop.addEventListener("change", onDesktopChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      desktop.removeEventListener("change", onDesktopChange);
    };
  }, [isOpen]);

  const navLinkClass = (href: string) => {
    const active = pathname === href;
    return `no-underline whitespace-nowrap hover:text-gray-300 ${active ? "text-[#ff4655] border-b-2 border-[#ff4655]" : "text-white"}`;
  };

  return (
    <>
      <div
        className={styles.backdrop}
        data-open={isOpen}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <nav
        ref={navRef}
        // Keys pressed in the open menu must not act on the picker behind it.
        data-shortcuts={isOpen ? "off" : undefined}
        className={`${styles.nav} flex items-center justify-between gap-3 bg-[#111111] px-4 py-2 min-h-[5vh] font-[family-name:DINNextW1G]`}
        aria-label="Main"
      >
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            prefetch={false}
            className="flex min-w-0 items-center sm:items-end no-underline text-white lg:mr-4"
            onClick={() => setIsOpen(false)}
          >
            <Image
              className="h-[2em] w-auto pr-2"
              src="/imgs/logo/ap-logo.webp"
              width={241}
              height={96}
              alt="Agent Picker logo"
            />
            <span
              className="text-[0.95rem] leading-none sm:text-2xl no-underline"
              style={{
                fontFamily: "Valorant-Regular, Arial, Helvetica, sans-serif",
              }}
            >
              {/* Too wide for a phone on one line, so it stacks there. */}
              Valorant <br className="sm:hidden" />
              Agent Picker
            </span>
          </Link>

          {/* The two pickers stay in the bar for as long as they fit; only
              below this width do they move into the menu. */}
          <div className="hidden md:flex items-center gap-4">
            {PRIMARY_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={navLinkClass(href)}
                style={DIN}
                aria-current={pathname === href ? "page" : undefined}
                onClick={() => setIsOpen(false)}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-4">
          <Link
            href="/about"
            prefetch={false}
            className={navLinkClass("/about")}
            style={DIN}
            aria-current={pathname === "/about" ? "page" : undefined}
          >
            About
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white no-underline hover:text-gray-300"
            style={DIN}
          >
            Github
          </a>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
            <Image
              className="h-[2em] w-auto"
              src="/imgs/discord.webp"
              width={512}
              height={512}
              alt="Discord"
            />
          </a>
          <a href={COFFEE_URL} target="_blank" rel="noopener noreferrer">
            <Image
              className="h-[2em] w-auto"
              src="/imgs/navbar/bmc.svg"
              width={32}
              height={32}
              alt="Buy Me A Coffee"
              unoptimized
            />
          </a>
        </div>

        <button
          ref={toggleRef}
          className={styles.toggle}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="site-nav-menu"
        >
          <span className={styles.toggleBars} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <div
          id="site-nav-menu"
          className={styles.panel}
          data-open={isOpen}
          inert={!isOpen}
        >
          <ul className={`${styles.primary} md:hidden`}>
            {PRIMARY_LINKS.map(({ href, label }, index) => (
              <li key={href} style={order(index)}>
                <Link
                  href={href}
                  prefetch={false}
                  className={styles.row}
                  onClick={closeMenu}
                  aria-current={pathname === href ? "page" : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <ul className={styles.tiles}>
            <li style={order(2)}>
              <Link
                href="/about"
                prefetch={false}
                className={styles.tile}
                onClick={closeMenu}
                aria-current={pathname === "/about" ? "page" : undefined}
              >
                About
              </Link>
            </li>
            <li style={order(3)}>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.tile}
                onClick={closeMenu}
              >
                Github
              </a>
            </li>
            <li style={order(4)}>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.tile}
                onClick={closeMenu}
              >
                <Image
                  className="h-[1.5em] w-auto"
                  src="/imgs/discord.webp"
                  width={512}
                  height={512}
                  alt=""
                />
                Discord
              </a>
            </li>
            <li style={order(5)}>
              <a
                href={COFFEE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.tile}
                onClick={closeMenu}
              >
                <Image
                  className="h-[1.5em] w-auto"
                  src="/imgs/navbar/bmc.svg"
                  width={32}
                  height={32}
                  alt="Buy Me A Coffee"
                  unoptimized
                />
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
