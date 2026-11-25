"use client";

import React, { useEffect, useState } from "react";
import {
  BookmarkPlus,
  BookMarked,
  Box,
  ExternalLink,
  Flame,
  FolderKanban,
  GitBranch,
  GraduationCap,
  Heart,
  Loader2,
  MessageCircle,
  RefreshCw,
  Repeat2,
  Send,
  Sparkles,
} from "lucide-react";
import { apiFetch, PaperItem, UserBundle } from "@/lib/api";
import BriefingsAndProjectsTab from "./BriefingsAndProjectsTab";

interface Props {
  user: UserBundle | null;
  onRequireAuth: () => void;
  onSaveZotero: (p: PaperItem) => void;
  onPinNotebook?: (p: PaperItem) => void;
  onOpenInspector: (p: PaperItem, tab: "overview" | "graph" | "structure") => void;
}

interface FeedComment {
  id: number;
  author_name: string;
  body: string;
  created_at: string;
}

interface FeedPost extends PaperItem {
  feed_id: string;
  post_key: string;
  post_type: "for_you" | "repost" | "zotero";
  reposted_by?: string;
  caption?: string;
  created_at?: string;
  added_by?: string;
  zotero_library_name?: string;
  matched_interests?: string[];
  pdb_id?: string;
  thumb_url?: string;
  likes_count?: number;
  liked_by_me?: boolean;
  comments?: FeedComment[];
  citation_count?: number;
}

export default function FeedTab({
  user,
  onRequireAuth,
  onSaveZotero,
  onPinNotebook,
  onOpenInspector,
}: Props) {
  const [subTab, setSubTab] = useState<"for_you" | "reposts" | "zotero" | "briefings">("for_you");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [interestTokens, setInterestTokens] = useState<string[]>([]);

  // Comment & Repost inline state
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [repostingPost, setRepostingPost] = useState<FeedPost | null>(null);
  const [repostCaption, setRepostCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadFeed = async (tab = subTab, refresh = false) => {
    setLoading(true);
    setNotice("");
    try {
      const res = await apiFetch(`/api/feed?tab=${tab}&refresh=${refresh ? "true" : "false"}`);
      setPosts(res.posts || []);
      setNotice(res.zotero_notice || "");
      setInterestTokens(res.interest_tokens || []);
    } catch (err: any) {
      setNotice(err.message || "Could not load BenchFeed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subTab !== "briefings") {
      loadFeed(subTab, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setRepostingPost(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleToggleLike = async (post: FeedPost) => {
    if (!user) return onRequireAuth();
    try {
      const res = await apiFetch("/api/feed/like", {
        method: "POST",
        body: JSON.stringify({ post_key: post.post_key, tags: post.tags || [] }),
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.post_key === post.post_key
            ? { ...p, liked_by_me: res.liked, likes_count: res.likes_count }
            : p
        )
      );
    } catch {
      // ignore
    }
  };

  const handleAddComment = async (post: FeedPost) => {
    if (!user) return onRequireAuth();
    const body = (commentDrafts[post.post_key] || "").trim();
    if (!body) return;
    try {
      const res = await apiFetch("/api/feed/comment", {
        method: "POST",
        body: JSON.stringify({ post_key: post.post_key, body }),
      });
      setCommentDrafts((d) => ({ ...d, [post.post_key]: "" }));
      if (res.comment) {
        setPosts((prev) =>
          prev.map((p) =>
            p.post_key === post.post_key
              ? { ...p, comments: [...(p.comments || []), res.comment] }
              : p
          )
        );
      }
    } catch {
      // ignore
    }
  };

  const handleRepostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return onRequireAuth();
    if (!repostingPost) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/feed/repost", {
        method: "POST",
        body: JSON.stringify({
          paper: repostingPost,
          caption: repostCaption,
        }),
      });
      setRepostingPost(null);
      setRepostCaption("");
      if (subTab === "reposts") {
        loadFeed("reposts", false);
      }
    } catch (err: any) {
      setNotice(err.message || "Could not repost to Lab Feed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header & Feed Stream Switcher */}
      <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#EA4335]" />
              BenchFeed · Lab Discovery Stream
            </h2>
            <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6]">
              Visual discovery feed tailored to your interests, lab reposts, and recently added Lab Zotero papers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadFeed(subTab, true)}
            disabled={loading}
            className="px-4 py-1.5 rounded-full text-xs font-medium bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E8F0FE] text-[#1967D2] inline-flex items-center gap-1.5 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["for_you", "For You", Sparkles],
              ["reposts", "Lab Reposts & Notes", Repeat2],
              ["zotero", "Recently in Lab Zotero", BookMarked],
              ["briefings", "Briefings & Dossiers", FolderKanban],
            ] as const
          ).map(([key, label, Icon]) => {
            const active = subTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSubTab(key)}
                className={`px-4 py-2 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition ${
                  active
                    ? "bg-[#1A73E8] text-white shadow-xs"
                    : "bg-[#F0F4F9] dark:bg-[#282A2C] text-[#444746] dark:text-[#C4C7C5] hover:bg-[#E3E8EF]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {interestTokens.length > 0 && subTab === "for_you" && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#5F6368]">
            <span>Tuned to:</span>
            {interestTokens.map((tok) => (
              <span
                key={tok}
                className="px-2 py-0.5 rounded-full bg-[#E8F0FE] text-[#1967D2] font-medium"
              >
                #{tok}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Repost Composer Modal (centered viewport overlay) */}
      {repostingPost && (
        <div
          onClick={() => setRepostingPost(null)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleRepostSubmit}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-2xl p-6 space-y-4"
          >
            <div className="space-y-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#1A73E8]">
                Repost to Lab Feed
              </div>
              <div className="font-display font-semibold text-sm text-[#1F1F1F] dark:text-[#E3E3E3] line-clamp-2">
                {repostingPost.title}
              </div>
            </div>
            <textarea
              rows={3}
              autoFocus
              value={repostCaption}
              onChange={(e) => setRepostCaption(e.target.value)}
              placeholder="Add an optional note for teammates (e.g. 'Check Fig 3 SPR curve for L-PGDS M94W')..."
              className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#DADCE0] dark:border-[#444746] focus:outline-none focus:border-[#1A73E8]"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRepostingPost(null)}
                className="px-4 py-2 rounded-full text-xs text-[#5F6368] hover:bg-[#F0F4F9] dark:hover:bg-[#282A2C]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-full text-xs font-medium bg-[#1A73E8] hover:bg-[#1557B0] text-white inline-flex items-center gap-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Share to Lab Feed
              </button>
            </div>
          </form>
        </div>
      )}

      {subTab === "briefings" ? (
        <BriefingsAndProjectsTab
          isAuthenticated={Boolean(user)}
          onRequireAuth={onRequireAuth}
          onSaveZotero={onSaveZotero}
        />
      ) : (
        <>
          {notice && (
            <div className="p-4 rounded-2xl bg-[#FEF7E0] dark:bg-[#3B3014] text-[#B06000] dark:text-[#FDD663] text-xs">
              {notice}
            </div>
          )}

          {loading ? (
        <div className="py-12 flex items-center justify-center gap-2 text-xs text-[#5F6368]">
          <Loader2 className="w-4 h-4 animate-spin text-[#1A73E8]" />
          Curating your visual science feed...
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] p-8 text-center text-xs text-[#5F6368]">
          {subTab === "reposts"
            ? "No lab reposts yet! Click 'Repost' on any search result or For You card to share it with your teammates."
            : "No items found for this feed view yet. Try clicking Refresh!"}
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const comments = post.comments || [];
            const isCommentsOpen = Boolean(openComments[post.post_key]);
            return (
              <article
                key={post.feed_id}
                className="rounded-3xl bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] shadow-card overflow-hidden"
              >
                {/* Post Header (Instagram-style context bar) */}
                <div className="px-5 py-3.5 flex items-center justify-between gap-2 border-b border-[#F0F4F9] dark:border-[#2C2E30]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1A73E8] to-[#34A853] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                      {post.post_type === "repost"
                        ? (post.reposted_by || "L")[0].toUpperCase()
                        : post.post_type === "zotero"
                        ? "Z"
                        : "✦"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate">
                        {post.post_type === "repost"
                          ? `${post.reposted_by} reposted`
                          : post.post_type === "zotero"
                          ? `Added to ${post.zotero_library_name || "Lab Zotero"}${
                              post.added_by ? ` · by ${post.added_by}` : ""
                            }`
                          : post.matched_interests && post.matched_interests.length > 0
                          ? `For You · matches #${post.matched_interests.join(" #")}`
                          : "BenchQuest Discovery"}
                      </div>
                      <div className="text-[11px] text-[#5F6368] truncate">
                        {post.source} {post.date ? `· ${post.date}` : ""}
                      </div>
                    </div>
                  </div>
                  {post.score3 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F0FE] text-[#1967D2] shrink-0">
                      ★ {post.score3}/3
                    </span>
                  ) : null}
                </div>

                {/* Repost Caption */}
                {post.caption && (
                  <div className="px-5 pt-3 text-xs font-medium text-[#1F1F1F] dark:text-[#E3E3E3]">
                    “{post.caption}”
                  </div>
                )}

                {/* 0-Token Visual Media Block (RCSB 3D Render OR Clean Scientific Cover Card) */}
                <div className="px-5 py-4 space-y-3">
                  {post.thumb_url && post.pdb_id ? (
                    <div className="rounded-2xl bg-[#F8FAFD] dark:bg-[#242628] border border-[#E3E8EF] dark:border-[#333537] overflow-hidden flex flex-col sm:flex-row items-center gap-4 p-3">
                      <img
                        src={post.thumb_url}
                        alt={`PDB ${post.pdb_id}`}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                        className="w-36 h-36 object-contain rounded-xl bg-white p-1 border border-[#E3E8EF]"
                      />
                      <div className="space-y-1.5 flex-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E6F4EA] text-[#137333]">
                          3D Structure · PDB {post.pdb_id}
                        </span>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block font-display font-semibold text-sm hover:text-[#1A73E8]"
                        >
                          {post.title}
                        </a>
                        <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] line-clamp-3">
                          {post.summary || post.abstract}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-gradient-to-br from-[#F8FAFD] to-[#E8F0FE]/50 dark:from-[#242628] dark:to-[#1967D2]/10 border border-[#E3E8EF] dark:border-[#333537] p-4 space-y-2">
                      <a
                        href={post.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-display font-semibold text-base leading-snug hover:text-[#1A73E8] inline-flex items-start gap-1.5"
                      >
                        <span>{post.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-1 opacity-60" />
                      </a>
                      {post.authors && (
                        <div className="text-xs text-[#5F6368] dark:text-[#9AA0A6] truncate">
                          {post.authors}
                        </div>
                      )}
                      {(post.summary || post.abstract) && (
                        <p className="text-xs text-[#444746] dark:text-[#C4C7C5] leading-relaxed line-clamp-3">
                          {post.summary || post.abstract}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {typeof post.citation_count === "number" && post.citation_count > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] bg-white dark:bg-[#1E1F20] border border-[#E3E8EF] dark:border-[#333537] font-medium">
                            Cited by {post.citation_count}
                          </span>
                        )}
                        {(post.tags || []).slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-full text-[11px] bg-white/80 dark:bg-[#1E1F20] text-[#5F6368]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="px-5 py-3 border-t border-[#F0F4F9] dark:border-[#2C2E30] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(post)}
                      className={`inline-flex items-center gap-1 font-medium transition ${
                        post.liked_by_me ? "text-[#D93025]" : "text-[#5F6368] hover:text-[#D93025]"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.liked_by_me ? "fill-[#D93025]" : ""}`} />
                      {post.likes_count || 0}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenComments((o) => ({ ...o, [post.post_key]: !o[post.post_key] }))
                      }
                      className="inline-flex items-center gap-1 text-[#5F6368] hover:text-[#1A73E8] font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {comments.length}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (!user) return onRequireAuth();
                        setRepostingPost(post);
                        setRepostCaption("");
                      }}
                      className="inline-flex items-center gap-1 text-[#5F6368] hover:text-[#188038] font-medium"
                    >
                      <Repeat2 className="w-4 h-4" />
                      Repost
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {(post.ntu_openathens_url || post.doi || post.url) && (
                      <a
                        href={
                          post.ntu_openathens_url ||
                          `${user?.preferences?.openathens_proxy || "https://go.openathens.net/redirector/ntu.edu.sg?url="}${encodeURIComponent(
                            post.doi ? `https://doi.org/${post.doi}` : post.url
                          )}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-full bg-[#F8FAFD] dark:bg-[#282A2C] border border-[#E3E8EF] dark:border-[#333537] hover:bg-[#E8F0FE] text-[11px] font-medium inline-flex items-center gap-1"
                        title="Open via NTU OpenAthens Library Proxy"
                      >
                        <GraduationCap className="w-3 h-3 text-[#1A73E8]" /> NTU
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenInspector(post, "graph")}
                      className="px-2.5 py-1 rounded-full bg-[#F0F4F9] dark:bg-[#282A2C] hover:bg-[#E8F0FE] text-[11px] font-medium inline-flex items-center gap-1"
                    >
                      <GitBranch className="w-3 h-3" /> Graph
                    </button>
                    {post.pdb_id && (
                      <button
                        type="button"
                        onClick={() => onOpenInspector(post, "structure")}
                        className="px-2.5 py-1 rounded-full bg-[#E6F4EA] text-[#137333] text-[11px] font-medium inline-flex items-center gap-1"
                      >
                        <Box className="w-3 h-3" /> 3D
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onSaveZotero(post)}
                      className="px-3 py-1 rounded-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-[11px] font-medium inline-flex items-center gap-1"
                    >
                      <BookmarkPlus className="w-3 h-3" /> Save
                    </button>
                    {onPinNotebook && (
                      <button
                        type="button"
                        onClick={() => onPinNotebook(post)}
                        className="px-2.5 py-1 rounded-full bg-[#E8F0FE] dark:bg-[#0842A0]/50 text-[#1967D2] dark:text-[#A8C7FA] text-[11px] font-medium inline-flex items-center gap-1"
                        title="Pin/Unpin in Persistent Notebook"
                      >
                        + Notebook
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Comments Thread */}
                {isCommentsOpen && (
                  <div className="px-5 py-3 bg-[#F8FAFD] dark:bg-[#242628] border-t border-[#E3E8EF] dark:border-[#333537] space-y-2.5">
                    {comments.map((c) => (
                      <div key={c.id} className="text-xs">
                        <span className="font-semibold text-[#1F1F1F] dark:text-[#E3E3E3]">
                          {c.author_name}:{" "}
                        </span>
                        <span className="text-[#444746] dark:text-[#C4C7C5]">{c.body}</span>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <input
                        value={commentDrafts[post.post_key] || ""}
                        onChange={(e) =>
                          setCommentDrafts((d) => ({ ...d, [post.post_key]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddComment(post);
                          }
                        }}
                        placeholder="Add a lab note or comment..."
                        className="flex-1 px-3 py-1.5 text-xs rounded-full bg-white dark:bg-[#1E1F20] border border-[#DADCE0] dark:border-[#444746]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddComment(post)}
                        className="px-3 py-1.5 rounded-full bg-[#1A73E8] text-white text-xs inline-flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
        </>
      )}
    </div>
  );
}
