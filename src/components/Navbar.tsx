"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="flex flex-wrap items-center justify-between bg-[#343a40] px-4 py-2 min-h-[5vh]">
      <button
        className="lg:hidden text-white text-2xl border border-gray-500 rounded px-2 py-1"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>

      <div
        className={`${isOpen ? "flex" : "hidden"} lg:flex flex-col lg:flex-row w-full lg:w-auto items-center lg:justify-between flex-1`}
      >
        <Link href="/" className="flex items-end no-underline text-white">
          <img
            className="h-[2em] pr-2"
            src="/imgs/navbar/v-logo-red.png"
            alt="Valorant logo"
          />
          <span
            className="text-2xl no-underline"
            style={{ fontFamily: "Valorant-Regular, Arial, Helvetica, sans-serif" }}
          >
            Valorant Agent Picker
          </span>
        </Link>

        <div className="flex flex-col lg:flex-row items-center gap-2 lg:gap-4 mt-2 lg:mt-0">
          <Link
            href="/about"
            className="text-white no-underline hover:text-gray-300"
          >
            About
          </Link>
          <a
            href="https://github.com/andrerfcsantos/valorant-agent-picker"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white no-underline hover:text-gray-300"
          >
            Github
          </a>
          <a
            href="https://discord.gg/2yb3ZPzjve"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="h-[2em]"
              src="/imgs/discord.png"
              alt="Discord"
            />
          </a>
          <a
            href="https://www.buymeacoffee.com/heropickers"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              className="h-[2em]"
              src="/imgs/navbar/bmc.svg"
              alt="Buy Me A Coffee"
            />
          </a>
        </div>
      </div>
    </nav>
  );
}
