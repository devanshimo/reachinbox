import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  getCurrentUser,
  logout,
  type AuthUser,
} from "../../api/auth";
import { getEmails } from "../../api/email";

function DashboardLayout() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch((error) => {
        console.error("Authentication error:", error);
        navigate("/login", { replace: true });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  // Scheduled email count
  useEffect(() => {
    getEmails("SCHEDULED")
      .then((emails) => {
        setScheduledCount(emails.length);
      })
      .catch((error) => {
        console.error(
          "Failed to load scheduled email count:",
          error,
        );

        // Do NOT redirect to login if this request fails.
        setScheduledCount(0);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-gray-500">
          Loading...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar
        user={user}
        onLogout={handleLogout}
        scheduledCount={scheduledCount}
      />

      <main className="min-w-0 flex-1">
        <Outlet
          context={{
            user,
          }}
        />
      </main>
    </div>
  );
}

export default DashboardLayout;