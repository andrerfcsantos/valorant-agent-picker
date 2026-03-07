export default function Footer() {
  return (
    <footer className="text-gray-500 text-center mt-4 max-[1220px]:mt-20">
      <p className="text-[1.25em] m-0">
        <a
          href="https://vercel.com/?utm_source=hero-pickers&utm_campaign=oss"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            className="h-[2em] w-auto mx-2 inline"
            src="/imgs/vercel.svg"
            alt="Vercel logo"
          />
        </a>
      </p>
      <p className="text-[1.25em] m-0">
        <small>
          This is a fan-site for Valorant and it is not in any way associated
          with Riot Games
        </small>
      </p>
    </footer>
  );
}
