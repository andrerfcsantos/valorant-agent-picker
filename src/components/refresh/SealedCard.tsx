import styles from "./SealedCard.module.css";

/**
 * What stands where a sealed agent's picture goes: the same card for every
 * agent, so it gives nothing away. A blurred portrait still gives away the
 * colours and outline, which a player knows on sight. Purely decoration:
 * the text beside it says the roll is hidden.
 */
export default function SealedCard({ className = "" }: { className?: string }) {
  return (
    <div className={`${styles.card} ${className}`} aria-hidden="true">
      <span className={styles.mark}>?</span>
    </div>
  );
}
