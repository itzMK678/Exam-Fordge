
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Menu,
  X,
} from "lucide-react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    ["Home", "#home"],
    ["Features", "#features"],
    ["About", "#about"],
    ["How It Works", "#how-it-works"],
  ];

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <a
          href="#home"
          onClick={closeMenu}
          className="flex items-center gap-2 text-2xl font-extrabold text-slate-900"
        >
          <span className="rounded-xl bg-blue-600 p-2 text-white">
            <GraduationCap size={26} />
          </span>
          Exam<span className="text-blue-600">Forge</span>
        </a>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div
          className={`${
            menuOpen ? "flex" : "hidden"
          } absolute left-0 top-full w-full flex-col gap-5 border-b border-slate-200 bg-white p-6 shadow-lg md:static md:flex md:w-auto md:flex-row md:items-center md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          {links.map(([label, href]) => (
            <a
              key={label}
              href={href}
              onClick={closeMenu}
              className="text-sm font-medium text-slate-600 transition hover:text-blue-600"
            >
              {label}
            </a>
          ))}

          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              onClick={closeMenu}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-600"
            >
              Login
            </Link>

            <a
              href="#get-started"
              onClick={closeMenu}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;