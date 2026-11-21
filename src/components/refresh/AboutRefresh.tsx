import FeedbackBanner from "./FeedbackBanner";
import ui from "./ui.module.css";
import styles from "./AboutRefresh.module.css";

const DISCORD_URL = "https://discord.gg/2yb3ZPzjve";
const DONATE_URL = "https://www.buymeacoffee.com/heropickers";

/**
 * The about page in the new design. Unlike the picker it has nothing to keep
 * in reach while it is read, so it is one column read from the top: what the
 * site is, how to reach and support it, and the fine print.
 *
 * `only-refresh` keeps it out of the classic design (see the page).
 */
export default function AboutRefresh() {
  return (
    <main className={`only-refresh ${ui.page} ${styles.app}`}>
      <article className={styles.column}>
        <FeedbackBanner />

        <header className={styles.intro}>
          <h1 className={styles.title}>About this site</h1>
          <p className={styles.subtitle}>
            A fan-made random agent picker for Valorant.
          </p>
        </header>

        <section className={styles.section} aria-labelledby="about-what">
          <h2 id="about-what" className={styles.heading}>
            What is it for?
          </h2>
          <p>
            In Valorant, there are moments when you don&apos;t know which agent
            to lock in, and you wish one could be chosen for you at random. But
            even when you don&apos;t know what you want to play, you often have
            a good idea of what you <em>don&apos;t</em> want to play.
          </p>
          <p>
            This site was built for those moments. It gives you a random agent
            to play, picked only from the agents you selected.
          </p>
          <p>
            Use it to get a new agent to try or improve on, to mix up the agents
            you play in a session, or to hand out agents to your whole squad
            with the squad generator.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="about-contact">
          <h2 id="about-contact" className={styles.heading}>
            Get in touch
          </h2>
          <p>
            Feedback, ideas and bug reports are welcome on Discord, or by email
            at heropickers [at] gmail [dot] com.
          </p>
          <a
            className={`${ui.btn} ${styles.action}`}
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Join the Discord
          </a>
        </section>

        <section className={styles.section} aria-labelledby="about-support">
          <h2 id="about-support" className={styles.heading}>
            Support us
          </h2>
          <p>
            The site is free and has no ads. Donations cover what it costs to
            keep it up, as a one-time gift or a monthly one.
          </p>
          <a
            className={`${ui.btn} ${styles.action}`}
            href={DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Buy me a coffee
          </a>
        </section>

        <section className={styles.section} aria-labelledby="about-others">
          <h2 id="about-others" className={styles.heading}>
            Other pickers
          </h2>
          <p>
            This site is part of{" "}
            <a href="https://heropickers.com" target="_blank" rel="noopener">
              Hero Pickers
            </a>
            , which is also home to the{" "}
            <a
              href="https://www.owheropicker.com"
              target="_blank"
              rel="noopener"
            >
              Overwatch Hero Picker
            </a>
            : the same idea, for Overwatch.
          </p>
        </section>

        <footer className={styles.fine} aria-labelledby="about-disclaimer">
          <h2 id="about-disclaimer" className={styles.fineTitle}>
            Disclaimer
          </h2>
          <p>
            This is a fan site for Valorant and is not affiliated with Riot
            Games. All rights belong to their respective owners. This is the
            relevant copyright notice.
          </p>
          <p>
            Valorant Agent Picker was created under Riot Games&apos; &quot;Legal
            Jibber Jabber&quot; policy using assets owned by Riot Games. Riot
            Games does not endorse or sponsor this project.
          </p>
        </footer>
      </article>
    </main>
  );
}
