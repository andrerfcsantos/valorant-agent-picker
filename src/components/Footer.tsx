export default function Footer() {
  return (
    <footer className="text-gray-500 text-center mt-4 max-[1220px]:mt-20">
      <p className="text-[1.25em] m-0">
        <small>
          This is a fan-site for Valorant and it is not in any way associated
          with Riot Games
        </small>
      </p>
      <p className="text-[1.1em] m-0">
        <small>
          Part of{" "}
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
    </footer>
  );
}
