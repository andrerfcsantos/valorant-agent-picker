"use client";

import { useEffect } from "react";
import { sendEvent } from "@/lib/analytics";
import styles from "./about.module.css";

export default function AboutContent() {
  useEffect(() => {
    sendEvent("Page", "Visit", "About");
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>About this site</h2>

      <p className={styles.paragraphText}>
        This site allows you to get a random agent to play from a list of agents
        you selected. You can use this to get a new agent to play when you are
        not sure which one to chose, or to get a random new one to try/improve.
      </p>

      <h2 className={styles.title}>Discord</h2>

      <p className={styles.paragraphText}>
        Join the Discord server:{" "}
        <a href="https://discord.gg/2yb3ZPzjve">
          https://discord.gg/2yb3ZPzjve
        </a>
      </p>

      <h2 className={styles.title}>Donate</h2>

      <p className={styles.paragraphText}>
        If you like this project, consider making a donation by clicking on the
        image below (or{" "}
        <a
          href="https://www.buymeacoffee.com/heropickers"
          target="_blank"
          rel="noopener noreferrer"
        >
          here
        </a>
        )! You can choose to make a one-time donation or become a member and
        donate monthly/annually. The money will be used to cover the costs of
        keeping the site up, free for everyone and with no ads.
      </p>

      <a
        className={styles.bmc}
        href="https://www.buymeacoffee.com/heropickers"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          className={styles.bmcLogo}
          src="/imgs/navbar/bmc.svg"
          alt="Buy Me A Coffee"
        />
      </a>

      <h2 className={styles.title}>Contact me</h2>

      <p className={styles.paragraphText}>
        If you have feedback, suggestions, comments about the site or you just
        want to say something to me, reach out at heropickers [at] gmail [dot]
        com. You can also contact me via the{" "}
        <a href="https://discord.gg/2yb3ZPzjve">Discord server</a>.
      </p>

      <h2 className={styles.title}>Disclaimer</h2>

      <p className={styles.paragraphText}>
        This is a fan-site for Valorant and it is not affiliated with Riot
        Games. All rights belong to their respective owners. Below are the
        relevant copyright notice:
      </p>

      <p className={styles.copyrightNotice}>
        Valorant Agent Picker was created under Riot Games&apos; &quot;Legal
        Jibber Jabber&quot; policy using assets owned by Riot Games. Riot Games
        does not endorse or sponsor this project.
      </p>
    </div>
  );
}
