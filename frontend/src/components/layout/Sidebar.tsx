import { NavLink, useNavigate } from "react-router-dom";
import { ChevronDown, Clock3, Send } from "lucide-react";
import type { AuthUser } from "../../api/auth";
interface SidebarProps {
  user: AuthUser;
  onLogout: () => void;
  scheduledCount: number;
}

function Sidebar({
  user,
  onLogout,
  scheduledCount,
}: SidebarProps) {
  const navigate = useNavigate();

  const initials = user.name
    .split(" ")
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="flex h-screen w-[285px] shrink-0 flex-col border-r border-gray-100 bg-white px-5 py-6">
      {/* Logo */}
      <div className="mb-7 px-3">
        <span className="text-4xl font-black tracking-[-0.08em] text-black">
          ONB
        </span>
      </div>

      {/* User */}
      <button
        onClick={onLogout}
        title="Click to logout"
        className="mb-3 flex w-full items-center justify-between rounded-2xl bg-[#f3f5f4] px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-sm font-medium">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-800">
              {user.name}
            </p>

            <p className="truncate text-xs text-gray-400">
              {user.email}
            </p>
          </div>
        </div>

        <ChevronDown
          size={18}
          className="shrink-0 text-gray-400"
        />
      </button>

      {/* Compose */}
      <button
        className="mb-8 h-11 w-full rounded-full border border-[#08ad49] font-medium text-[#08ad49] transition hover:bg-[#e9f8ef]"
        onClick={() => navigate("/compose")}
      >
        Compose
      </button>

      {/* Navigation */}
      <div>
        <p className="mb-3 px-4 text-xs font-medium uppercase tracking-wide text-gray-400">
          Core
        </p>

        <nav className="space-y-1">
          <NavLink
            to="/scheduled"
            className={({ isActive }) =>
              `flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
                isActive
                  ? "bg-[#e2f6eb] font-semibold text-gray-800"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Clock3 size={19} />
              Scheduled
            </span>

            <span className="text-xs text-gray-400">
              {scheduledCount}
            </span>
          </NavLink>

          <NavLink
            to="/sent"
            className={({ isActive }) =>
              `flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
                isActive
                  ? "bg-[#e2f6eb] font-semibold text-gray-800"
                  : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Send size={19} />
              Sent
            </span>

            <span className="text-xs text-gray-400" />
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
export default Sidebar;