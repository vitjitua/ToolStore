"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export default function LoginPage() {
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!emailAddress.trim() || !password) {
      setError("Please enter your email address and password.");
      return;
    }

    try {
      setLoggingIn(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          emailAddress: emailAddress.trim(),
          password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setError("Invalid email address or password.");
        } else {
          setError("Unable to sign in. Please try again.");
        }

        return;
      }

      const user = await response.json();

      if (user.role === "Storeman") {
        router.replace("/tool-transactions");
      } else {
        router.replace("/");
      }

      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Unable to connect to the Tool Store system.");
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb] px-4">
      <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-[#dfe5ee] bg-white shadow-xl">
        <div className="flex flex-col items-center bg-[#08285a] px-8 pb-8 pt-7">
          <img
            src="/namdock-logo.png"
            alt="NAMDOCK"
            className="h-auto w-[165px] object-contain"
          />

          <h1 className="mt-5 text-center text-[21px] font-bold text-white">
            Tool Store Management System
          </h1>

          <p className="mt-2 text-center text-[12px] text-white/70">
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8">
          <div>
            <label
              htmlFor="emailAddress"
              className="mb-2 block text-[12px] font-semibold text-[#17213c]"
            >
              Email Address
            </label>

            <input
              id="emailAddress"
              type="email"
              autoComplete="email"
              value={emailAddress}
              onChange={(event) => setEmailAddress(event.target.value)}
              placeholder="name@namdock.com"
              disabled={loggingIn}
              className="h-11 w-full rounded-lg border border-[#cfd7e3] bg-white px-3 text-[13px] text-[#17213c] outline-none transition focus:border-[#213767] focus:ring-2 focus:ring-[#213767]/10 disabled:bg-[#f4f6f8]"
            />
          </div>

          <div className="mt-5">
            <label
              htmlFor="password"
              className="mb-2 block text-[12px] font-semibold text-[#17213c]"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                disabled={loggingIn}
                className="h-11 w-full rounded-lg border border-[#cfd7e3] bg-white px-3 pr-16 text-[13px] text-[#17213c] outline-none transition focus:border-[#213767] focus:ring-2 focus:ring-[#213767]/10 disabled:bg-[#f4f6f8]"
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-[#52627c] hover:text-[#213767]"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-[#f0c7c7] bg-[#fff5f5] px-3 py-2.5">
              <p className="text-[11px] font-medium text-[#a12626]">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="mt-6 flex h-11 w-full items-center justify-center rounded-lg bg-[#213767] text-[13px] font-bold text-white transition hover:bg-[#182b54] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingIn ? "Signing in..." : "Sign In"}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 border-t border-[#e5eaf0] pt-5">
            <span className="h-2 w-2 rounded-full bg-[#F5C932]" />
            <p className="text-[10px] font-medium text-[#6a7890]">
              NAMDOCK Internal System
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

