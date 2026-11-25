"use client";

import React, { useEffect, useState } from "react";
import {
  BookMarked,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Tags,
} from "lucide-react";
import { apiFetch, UserBundle } from "@/lib/api";
import PersonalPreferencesPanel from "./PersonalPreferencesPanel";

interface Props {
  user: UserBundle | null;
  onRequireAuth: () => void;
  onUserUpdated: (user: UserBundle) => void;
}

export default function ZoteroAndSyncTab({
  user,
  onRequireAuth,
  onUserUpdated,
}: Props) {
  const [zotStatus, setZotStatus] = useState<any | null>(null);
  const [libType, setLibType] = useState<"user" | "group">("user");
  const [libId, setLibId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [zotMsg, setZotMsg] = useState("");

  const [tgCode, setTgCode] = useState("");
  const [linkingTg, setLinkingTg] = useState(false);
  const [tgMsg, setTgMsg] = useState("");

  const [deliveryTime, setDeliveryTime] = useState(user?.delivery_time || "08:30");

  // Tag Harmonizer Live Playground
  const [rawTagsInput, setRawTagsInput] = useState(
    "cryoem, lpgds, alpha-synuclein, amyloid fibrils, tht, ai_score:3"
  );
  const [harmonizedPreview, setHarmonizedPreview] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      setDeliveryTime(user.delivery_time || "08:30");
      apiFetch("/api/zotero/status")
        .then((res) => {
          setZotStatus(res);
          if (res.personal?.library_id) setLibId(res.personal.library_id);
          if (res.personal?.library_type) setLibType(res.personal.library_type);
          if (res.personal?.collection_id) setCollectionId(res.personal.collection_id);
        })
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    const list = rawTagsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    apiFetch("/api/zotero/harmonize-preview", {
      method: "POST",
      body: JSON.stringify({ tags: list }),
    })
      .then((res) => setHarmonizedPreview(res.harmonized || []))
      .catch(() => {});
  }, [rawTagsInput]);

  const handleConnectZotero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return onRequireAuth();
    setConnecting(true);
    setZotMsg("");
    try {
      const res = await apiFetch("/api/zotero/connect", {
        method: "POST",
        body: JSON.stringify({
          api_key: apiKey,
          library_id: libId,
          library_type: libType,
          collection_id: collectionId,
        }),
      });
      setZotMsg(`✅ ${res.message} (${res.synced_tags_count} tags synced)`);
      const me = await apiFetch("/api/auth/me");
      onUserUpdated(me.user);
      const st = await apiFetch("/api/zotero/status");
      setZotStatus(st);
    } catch (err: any) {
      setZotMsg(`❌ ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleLinkTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return onRequireAuth();
    setLinkingTg(true);
    setTgMsg("");
    try {
      const res = await apiFetch("/api/auth/link-telegram", {
        method: "POST",
        body: JSON.stringify({ code: tgCode }),
      });
      setTgMsg(`✅ ${res.message}`);
      onUserUpdated(res.user);
      setTgCode("");
    } catch (err: any) {
      setTgMsg(`❌ ${err.message}`);
    } finally {
      setLinkingTg(false);
    }
  };

  const handleSaveTime = async (t: string) => {
    if (!user) return onRequireAuth();
    setDeliveryTime(t);
    const res = await apiFetch("/api/settings/profile", {
      method: "POST",
      body: JSON.stringify({ delivery_time: t }),
    });
    onUserUpdated(res.user);
  };

  return (
    <div className="space-y-6">
      {user && (
        <PersonalPreferencesPanel user={user} onUserUpdated={onUserUpdated} />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Telegram Bot Sync & Schedule */}
      <div className="lg:col-span-5 space-y-6">
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base">
                Telegram Bot 2-Way Sync
              </h3>
              <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                Share projects, Zotero settings, seen papers & podcasts with @{user?.bot_username || "BenchQuestScoutBot"}
              </p>
            </div>
          </div>

          {user?.linked_telegram_id ? (
            <div className="p-4 rounded-2xl bg-[#E6F4EA] dark:bg-[#0D5226]/35 text-[#137333] dark:text-[#81C995] text-xs space-y-1">
              <div className="font-semibold inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Synced with Telegram ID #{user.linked_telegram_id}
              </div>
              <p>
                Your web dashboard and Telegram bot share the exact same projects, Zotero library, and briefing history.
              </p>
            </div>
          ) : (
            <form onSubmit={handleLinkTelegram} className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-[#F0F4F9] dark:bg-[#282A2C] text-xs text-[#444746] dark:text-[#C4C7C5] space-y-1">
                <div>
                  1. Open{" "}
                  <a
                    href={`https://t.me/${user?.bot_username || "BenchQuestScoutBot"}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#1A73E8] font-medium underline"
                  >
                    @{user?.bot_username || "BenchQuestScoutBot"}
                  </a>{" "}
                  in Telegram and send <code className="font-mono bg-white dark:bg-[#1E1F20] px-1.5 py-0.5 rounded">/link</code>
                </div>
                <div>2. Paste your 6-character pairing code below:</div>
              </div>
              <div className="flex gap-2">
                <input
                  value={tgCode}
                  onChange={(e) => setTgCode(e.target.value.toUpperCase())}
                  placeholder="6-CHAR CODE"
                  maxLength={8}
                  className="flex-1 px-4 py-2 rounded-full text-sm font-mono tracking-widest uppercase bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                />
                <button
                  type="submit"
                  disabled={linkingTg || !tgCode.trim()}
                  className="px-5 py-2 rounded-full text-xs font-medium bg-[#1A73E8] text-white hover:bg-[#1557B0] disabled:opacity-50"
                >
                  {linkingTg ? "Pairing..." : "Pair Account"}
                </button>
              </div>
              {tgMsg && <p className="text-xs font-medium">{tgMsg}</p>}
            </form>
          )}

          {/* Morning Delivery Slot */}
          <div className="pt-3 border-t border-[#E3E8EF] dark:border-[#333537] space-y-2">
            <div className="text-xs font-semibold text-[#444746] dark:text-[#C4C7C5]">
              Morning Briefing Delivery Time ({user?.timezone || "Asia/Singapore"})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["07:30", "08:00", "08:30", "09:00", "09:30", "10:00"].map((t) => (
                <button
                  key={t}
                  onClick={() => handleSaveTime(t)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition ${
                    deliveryTime === t
                      ? "bg-[#D3E3FD] text-[#041E49] dark:bg-[#0842A0] dark:text-[#D3E3FD]"
                      : "bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live 3-Layer Tag Harmonizer Playground */}
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Tags className="w-4 h-4 text-[#7C3AED]" />
            <h3 className="font-display font-semibold text-sm">
              3-Layer Smart Tag Harmonizer
            </h3>
          </div>
          <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
            Unifies web & bot tags to canonical hyphenated lab format (eliminating space/underscore duplicates in Zotero):
          </p>
          <input
            value={rawTagsInput}
            onChange={(e) => setRawTagsInput(e.target.value)}
            className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {harmonizedPreview.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#E8F0FE] text-[#1967D2] dark:bg-[#0842A0]/45 dark:text-[#A8C7FA]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Zotero Personal & Shared Lab Libraries */}
      <div className="lg:col-span-7 space-y-6">
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-6 space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E6F4EA] text-[#137333] flex items-center justify-center">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg">
                  Zotero Cloud Integration
                </h2>
                <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
                  2-stage DOI + Title deduplication · Direct OA PDF attachment · NTU OpenAthens child link
                </p>
              </div>
            </div>
            <a
              href="https://www.zotero.org/settings/keys/new"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#1A73E8] hover:underline inline-flex items-center gap-1"
            >
              Get Zotero Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={handleConnectZotero} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mb-1">
                Library Type
              </label>
              <select
                value={libType}
                onChange={(e) => setLibType(e.target.value as "user" | "group")}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
              >
                <option value="user">Personal Library (User ID)</option>
                <option value="group">Shared Lab Group Library (Group ID)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mb-1">
                Numeric User ID / Group ID
              </label>
              <input
                value={libId}
                onChange={(e) => setLibId(e.target.value)}
                placeholder="e.g. 6072114 or 12345678"
                className="w-full px-3.5 py-2 text-sm font-mono rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mb-1">
                Zotero Private API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste Zotero write-enabled key"
                className="w-full px-3.5 py-2 text-sm font-mono rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#444746] dark:text-[#C4C7C5] mb-1">
                Collection Key (Optional)
              </label>
              <input
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                placeholder="Leave blank for Root Library"
                className="w-full px-3.5 py-2 text-sm font-mono rounded-xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746]"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-between gap-3 pt-1">
              <span className="text-xs font-medium">{zotMsg}</span>
              <button
                type="submit"
                disabled={connecting}
                className="px-5 py-2 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1.5"
              >
                {connecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Verify & Connect Zotero
              </button>
            </div>
          </form>

          {/* Pre-configured NTU Lab Group Libraries Reference */}
          <div className="pt-4 border-t border-[#E3E8EF] dark:border-[#333537] space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
              Shared Lab Group Libraries
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(zotStatus?.group_libraries || [
                { name: "Recently added (Lab)", library_id: "6072114", description: "Default lab reading" },
                { name: "Evolution (6064631)", library_id: "6064631", description: "Evolutionary biology" },
                { name: "Chemistry (6059722)", library_id: "6059722", description: "Physical chemistry" },
              ]).map((g: any) => (
                <button
                  key={g.library_id}
                  type="button"
                  onClick={() => {
                    setLibType("group");
                    setLibId(g.library_id);
                  }}
                  className="p-3 rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] text-left hover:border-[#1A73E8] transition"
                >
                  <div className="text-xs font-semibold">{g.name}</div>
                  <div className="text-[11px] font-mono text-[#1A73E8] mt-0.5">
                    Group ID: {g.library_id}
                  </div>
                  <div className="text-[11px] text-[#5F6368] mt-0.5">{g.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
