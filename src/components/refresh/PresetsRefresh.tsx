"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import FeedbackBanner from "./FeedbackBanner";
import PresetManager, { PresetIntro } from "./PresetManager";
import ui from "./ui.module.css";
import styles from "./PresetsRefresh.module.css";

/**
 * The preset manager as a page, in the new design. The picker opens the same
 * manager in a sheet, so this is where a bookmark or an old link to /presets
 * lands. It keeps the picker's shape: what the page is in the rail, the thing
 * itself beside it.
 */
export default function PresetsRefresh() {
  const router = useRouter();

  return (
    <main className={`${ui.page} ${styles.app}`}>
      <section className={styles.rail} aria-labelledby="presets-heading">
        <h1 id="presets-heading" className={styles.heading}>
          Manage presets
        </h1>
        <PresetIntro className={styles.intro} />
        <Link className={`${ui.btn} ${styles.back}`} href="/" prefetch={false}>
          Back to the picker
        </Link>
      </section>

      <div className={styles.main}>
        <FeedbackBanner />
        <div className={styles.manager}>
          <PresetManager onApplied={() => router.push("/")} />
        </div>
      </div>
    </main>
  );
}
