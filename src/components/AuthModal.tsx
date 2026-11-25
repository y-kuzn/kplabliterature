"use client";

import React, { useState } from "react";
import { KeyRound, Loader2, Sparkles, UserPlus, X } from "lucide-react";
import { apiFetch, setStoredToken, UserBundle } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (user: UserBundle) => void;
}

export default function AuthModal({ open, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<"login" | "register" | "reset">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [labPasscode, setLabPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint =
        mode === "login"
          ? "/api/auth/login"
          : mode === "register"
          ? "/api/auth/register"
          : "/api/auth/reset-password";
      const body =
        mode === "login"
          ? { username, password }
          : mode === "register"
          ? {
              username,
              password,
              display_name: displayName,
              email,
              lab_passcode: labPasscode,
            }
          : {
              username,
              lab_passcode: labPasscode,
              new_password: password,
            };
      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setStoredToken(res.token);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPreview = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/auth/quick-lab-preview", { method: "POST" });
      setStoredToken(res.token);
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || "Could not start preview session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative space-y-5"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close sign in dialog"
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C] text-[#5F6368]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] mb-1">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="font-display font-semibold text-xl">
            {mode === "login" ? "Sign in to BenchQuest Lab" : "Create Lab Researcher Account"}
          </h2>
          <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
            Existing lab accounts (<code className="font-mono">y-kuz</code>,{" "}
            <code className="font-mono">Konstantin</code>, <code className="font-mono">Bhragy</code>,{" "}
            <code className="font-mono">Jing</code>) are migrated & ready!
          </p>
        </div>

        {/* 1-Click Instant Lab Workspace Button */}
        <button
          type="button"
          onClick={handleQuickPreview}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-full text-xs sm:text-sm font-medium bg-[#E8F0FE] hover:bg-[#D3E3FD] text-[#1967D2] dark:bg-[#0842A0]/50 dark:text-[#A8C7FA] flex items-center justify-center gap-2 transition"
        >
          <Sparkles className="w-4 h-4" />
          Instant Lab Researcher Workspace (1-Click)
        </button>

        <div className="flex items-center gap-3 text-[11px] text-[#747775]">
          <div className="h-px bg-[#E3E8EF] dark:bg-[#333537] flex-1" />
          <span>OR LAB CREDENTIALS</span>
          <div className="h-px bg-[#E3E8EF] dark:bg-[#333537] flex-1" />
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-3 p-1 rounded-full bg-[#F0F4F9] dark:bg-[#282A2C] text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`py-1.5 rounded-full transition ${
              mode === "login" ? "bg-white dark:bg-[#1E1F20] shadow-xs" : "text-[#5F6368]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`py-1.5 rounded-full transition ${
              mode === "register" ? "bg-white dark:bg-[#1E1F20] shadow-xs" : "text-[#5F6368]"
            }`}
          >
            Lab Sign Up
          </button>
          <button
            type="button"
            onClick={() => setMode("reset")}
            className={`py-1.5 rounded-full transition ${
              mode === "reset" ? "bg-white dark:bg-[#1E1F20] shadow-xs" : "text-[#5F6368]"
            }`}
          >
            Reset Pass
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username (e.g. y-kuz)"
            className="w-full px-4 py-2.5 text-sm rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] focus:outline-none focus:border-[#1A73E8]"
            required
          />
          {mode === "register" && (
            <>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display Name (e.g. Dr. Yevheniia)"
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Lab Email (optional)"
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
              />
              <input
                value={labPasscode}
                onChange={(e) => setLabPasscode(e.target.value)}
                placeholder="Lab Passcode (ask PI)"
                className="w-full px-4 py-2.5 text-sm rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                required
              />
            </>
          )}
          {mode === "reset" && (
            <input
              value={labPasscode}
              onChange={(e) => setLabPasscode(e.target.value)}
              placeholder="Lab Passcode (ask PI)"
              className="w-full px-4 py-2.5 text-sm rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
              required
            />
          )}
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "reset" ? "New Password (min 4 chars)" : "Password"}
            className="w-full px-4 py-2.5 text-sm rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] focus:outline-none focus:border-[#1A73E8]"
            required
          />

          {error && (
            <div className="p-3 rounded-2xl bg-[#FCE8E6] dark:bg-[#3B1816] text-[#C5221F] dark:text-[#F28B82] text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full text-sm font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white flex items-center justify-center gap-2 transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
