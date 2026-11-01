"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { type MemoryCard } from "@/lib/spaced-repetition";
import { phrases } from "../phrases";
import "./profile.css";

import { isComplete, type PhraseMastery } from "@/lib/phrase-mastery";

type Progress = { xp: number; known: number[]; missed: number[]; dates: string[]; sessions: number; phraseMastery?: Record<number, PhraseMastery>; cards: Record<number, MemoryCard> };

export default function ProfilePage() {
 const { data: session, isPending } = authClient.useSession();
 const [progress, setProgress] = useState<Progress | null>(null);
 const [message, setMessage] = useState("");
 useEffect(() => { if (!session) return; fetch("/api/progress", { credentials: "include" }).then(r => r.json()).then(data => setProgress(data.progress || { xp: 0, known: [], missed: [], dates: [], sessions: 0, cards: {} })).catch(() => setMessage("We couldn’t load your latest progress yet.")); }, [session]);
 const stats = useMemo(() => { const cards = Object.values(progress?.cards || {}); const learned = Object.values(progress?.phraseMastery || {}).filter(isComplete).length; const due = cards.filter(card => new Date(card.dueAt).getTime() <= Date.now()).length; return { learned, due, inMemory: cards.filter(card => card.stage > 0).length }; }, [progress]);
 async function signOut() { await authClient.signOut(); window.location.assign("/"); }
 if (isPending) return <main className="profile-page"><p className="profile-loading">Loading your profile…</p></main>;
 if (!session) return <main className="profile-page"><Link className="profile-back" href="/">← Back to learning</Link><section className="profile-empty"><span className="profile-mark">✳</span><h1>Your learning profile</h1><p>Sign in to see your streak, memory schedule, and progress across devices.</p><Link className="profile-primary" href="/">Go to sign in</Link></section></main>;
 const dates = progress?.dates || [];
 const streak = dates.length ? 1 : 0;
 const schedule = Object.values(progress?.cards || {}).sort((a,b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()).slice(0, 12);
 return <main className="profile-page"><header className="profile-header"><div><span className="eyebrow">YOUR LINGO PROFILE</span><h1>Keep your momentum visible.</h1><p>Your listening practice, memory schedule, and milestones in one place.</p></div><div className="profile-actions"><Link className="profile-back" href="/">← Learning space</Link><button className="profile-signout" onClick={signOut}>Sign out</button></div></header><section className="profile-card profile-identity"><div className="profile-avatar">{session.user.name?.[0]?.toUpperCase() || "Y"}</div><div><h2>{session.user.name || "Language learner"}</h2><p>{session.user.email}</p><span className="profile-status">● Account synced</span></div></section>{message && <p className="profile-message">{message}</p>}<section className="profile-stats"><div><strong>{progress?.xp || 0}</strong><span>Total XP</span></div><div><strong>{stats.inMemory}</strong><span>In memory</span></div><div><strong>{stats.learned}</strong><span>Completed</span></div><div><strong>{progress?.sessions || 0}</strong><span>Sprints completed</span></div></section><section className="profile-grid"><article className="profile-card"><span className="eyebrow">MEMORY SCHEDULE</span><h2>Small reviews, stronger recall.</h2><p>{stats.due ? `${stats.due} phrase${stats.due === 1 ? " is" : "s are"} ready for review today.` : "You’re all caught up. Your next review will appear when it matters most."}</p><div className="profile-progress"><span style={{width: `${Math.min(100, stats.learned / Math.max(1, phrases.length) * 100)}%`}} /></div><small>{stats.learned} of {phrases.length} phrases completed through typed recall</small></article><article className="profile-card profile-streak"><span className="profile-flame">♨</span><div><span className="eyebrow">CONSISTENCY</span><h2>{streak} day streak</h2><p>{dates.length ? "You’ve shown up for your language this week." : "Complete a listening sprint to start your streak."}</p></div></article></section><section className="profile-card schedule-card"><span className="eyebrow">EVERY MEMORY, VISIBLE</span><h2>What you learned and when</h2><p>Repeat lessons to build recognition, then complete each phrase through typed recall.</p><div className="schedule-list">{schedule.length ? schedule.map(card => { const phrase = phrases.find(item => item.id === card.phraseId); return <div className="schedule-row" key={card.phraseId}><strong lang="zh-CN">{phrase?.hanzi || "Phrase"}</strong><span>{phrase?.english}</span><small>Last correct {new Date(card.lastReviewedAt).toLocaleDateString()} · Next {new Date(card.dueAt).toLocaleDateString()}</small></div>; }) : <p className="schedule-empty">Complete a sprint and your memory history will appear here.</p>}</div></section></main>;
}
