import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Menu,
  X,
  User,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../Context/AuthContext";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    ["Home", "/#home"],
    ["Features", "/#features"],
    ["About", "/#about"],
    ["How It Works", "/#How-work"],
  ];

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
        <a
          href="/"
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

          {user ? (
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {/* User Name Badge */}
              <div
                className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5"
                title={user.email || user.name}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white uppercase shadow-xs">
                  {user.name ? (
                    user.name.trim().charAt(0).toUpperCase()
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="max-w-[140px] truncate text-sm font-bold text-slate-800">
                    {user.name || "Student"}
                  </span>
                  {user.email && (
                    <span className="max-w-[140px] truncate text-[11px] text-slate-500">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Generator Link */}
              <Link
                to="/work"
                onClick={closeMenu}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-xs"
              >
                
                <span>Start Learning</span>
              </Link>

              {/* Logout Option */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700 cursor-pointer"
                title="Logout"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link
                to="/login"
                onClick={closeMenu}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-600 hover:text-blue-600 transition"
              >
                Login
              </Link>
              <Link
                to="/work"
                onClick={closeMenu}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 shadow-xs"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
