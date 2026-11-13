import Link from "next/link";

export default function Footer() {
  return (
    // The band is twice the shortcut button's offset plus its height (see
    // .shortcut-hint-container in globals.css), so at the bottom of the page the
    // footer text and the fixed "?" button share a centre line. The side padding
    // keeps the centred text clear of the button.
    <footer className="text-gray-500 text-center mt-4 max-[1220px]:mt-20 min-h-[4.75rem] px-16 flex flex-col justify-center">
      <p className="text-[1.25em] m-0">
        <small>
          This is a fan-site for Valorant and it is not in any way associated
          with Riot Games. Part of{" "}
          <a
            href="https://heropickers.com"
            target="_blank"
            rel="noopener"
            className="text-gray-400 hover:text-gray-300"
          >
            Hero Pickers
          </a>
        </small>
      </p>
      <p className="text-[1.1em] m-0">
        <small>
          <Link href="/privacy" className="text-gray-400 hover:text-gray-300">
            Privacy Policy
          </Link>
          {" · "}
          <Link href="/terms" className="text-gray-400 hover:text-gray-300">
            Terms of Service
          </Link>
        </small>
      </p>
    </footer>
  );
}
