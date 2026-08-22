import { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();

    // Email/password authentication is not required
    // for this assignment.
    console.log("Email login:", { email, password });
  };

  const handleGoogleLogin = () => {
    window.location.href =
      "https://reachinbox-assignment-production-a5db.up.railway.app/auth/google";
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-[530px] rounded-xl border border-gray-200 bg-white px-16 py-14">
        <h1 className="mb-9 text-center text-4xl font-semibold text-[#202124]">
          Login
        </h1>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#e3f6eb] text-lg text-[#202124] transition hover:bg-[#d7f0e2]"
        >
          <span className="font-semibold text-[#4285F4]">
            G
          </span>

          Login with Google
        </button>

        <div className="my-7 flex items-center gap-5">
          <div className="h-px flex-1 bg-gray-200" />

          <span className="whitespace-nowrap text-sm text-gray-400">
            or sign up through email
          </span>

          <div className="h-px flex-1 bg-gray-200" />

        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-3"
        >
          <input
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            className="h-14 w-full rounded-xl bg-[#f5f7f6] px-5 text-base outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-[#08a94f]"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            className="h-14 w-full rounded-xl bg-[#f5f7f6] px-5 text-base outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-[#08a94f]"
          />

          <button
            type="submit"
            className="mt-5 h-14 w-full rounded-xl bg-[#08ad49] text-lg font-medium text-white transition hover:bg-[#079b42]"
          >
            Login
          </button>
        </form>
      </div>
    </main>
  );
}

export default Login;