"use client";

import { useEffect, useState } from "react";
import { phrases, topics, type Phrase } from "./phrases";
import { authClient } from "@/lib/auth-client";
import { FULLY_LEARNED_STAGE, intervalLabel, reviewCard, type MemoryCard } from "@/lib/spaced-repetition";

type Progress = { xp: number; known: number[]; missed: number[]; dates: string[]; sessions: number; cards: Record<number, MemoryCard> };
const empty: Progress = { xp: 0, known: [], missed: [], dates: [], sessions: 0, cards: {} };
const today = () => new Date().toLocaleDateString("en-CA");
function Icon({ name, size = 22 }: { name: string; size?: number }) {
 const paths: Record<string, React.ReactNode> = {
 headphones: <><path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="12" width="4" height="8" rx="2"/><rect x="17" y="12" width="4" height="8" rx="2"/></>,
 grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
 book: <><path d="M12 5v16M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Z"/></>,
 repeat: <><path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3"/></>,
 chart: <><path d="M4 20V10m8 10V4m8 16v-7"/></>,
 bolt: <path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>,
 arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
 sound: <><path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
 check: <path d="m5 12 4 4L19 6"/>,
 fire: <path d="M12 2c2 6 7 7 7 13a7 7 0 0 1-14 0c0-3 2-6 4-8 0 4 2 4 2 4s3-3 1-9Z"/>,
 clock: <><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
 };
 return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.bolt}</svg>;
}
function Mascot() { return <div className="mascot-scene" aria-hidden="true"><span className="spark s1">✦</span><span className="spark s2">✧</span><span className="speech">你好!</span><div className="orbit"/><div className="mascot"><div className="headband"/><div className="ear left"/><div className="ear right"/><div className="eyes"><i/><i/></div><div className="cheek c1"/><div className="cheek c2"/><div className="smile"/></div><span className="music">♫</span><div className="shadow"/></div>; }

function AuthModal({ onClose }: { onClose: () => void }) {
 const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [message, setMessage] = useState("");
 const [busy, setBusy] = useState(false);
 async function submit(event: React.FormEvent) {
  event.preventDefault(); setBusy(true); setMessage("");
  const result = mode === "sign-up"
   ? await authClient.signUp.email({ name, email, password })
   : await authClient.signIn.email({ email, password });
  setBusy(false);
  if(result.error) setMessage(result.error.message || "We couldn't sign you in. Please try again.");
  else { onClose(); window.location.reload(); }
 }
 return <div className="modal-backdrop"><section className="auth-modal" role="dialog" aria-modal="true" aria-label={mode === "sign-in" ? "Sign in" : "Create account"}><button className="close" aria-label="Close" onClick={onClose}>×</button><span className="eyebrow">SAVE YOUR MOMENTUM</span><h2>{mode === "sign-in" ? "Welcome back." : "Make your progress yours."}</h2><p>Sync your memory schedule across devices with a free account.</p><form onSubmit={submit}>{mode === "sign-up" && <label>Name<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name"/></label>}<label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label><label>Password<input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === "sign-in" ? "current-password" : "new-password"}/></label>{message && <p className="auth-error" role="alert">{message}</p>}<button className="primary" disabled={busy}>{busy ? "One moment…" : mode === "sign-in" ? "Sign in" : "Create account"}<Icon name="arrow" size={17}/></button></form><button className="text-button auth-switch" onClick={()=>{setMode(mode === "sign-in" ? "sign-up" : "sign-in");setMessage("")}}>{mode === "sign-in" ? "New here? Create an account" : "Already have an account? Sign in"}</button></section></div>;
}

export default function Home() {
 const { data: authSession } = authClient.useSession();
 const [tab, setTab] = useState("Learn");
 const [progress, setProgress] = useState<Progress>(empty);
 const [ready, setReady] = useState(false);
 const [currentDay, setCurrentDay] = useState("");
 const [course, setCourse] = useState(10);
 const [query, setQuery] = useState("");
 const [session, setSession] = useState<Phrase[]>([]);
 const [index, setIndex] = useState(0);
 const [selected, setSelected] = useState<number | null>(null);
 const [revealed, setRevealed] = useState(false);
 const [score, setScore] = useState(0);
 const [finished, setFinished] = useState(false);
 const [audioMessage, setAudioMessage] = useState("");
 const [storageMessage, setStorageMessage] = useState("");
 const [playing, setPlaying] = useState(false);
 const [showAuth, setShowAuth] = useState(false);
 const [syncedUser, setSyncedUser] = useState("");
 const [nowMs, setNowMs] = useState(0);
 useEffect(() => { setCurrentDay(today()); setNowMs(Date.now()); const timer = window.setInterval(()=>setNowMs(Date.now()), 60_000); try { const raw = localStorage.getItem("lingo-progress-v2") || localStorage.getItem("lingo-progress-v1"); if(raw) { const p = JSON.parse(raw); if (typeof p.xp === "number" && Array.isArray(p.known) && Array.isArray(p.missed) && Array.isArray(p.dates) && typeof p.sessions === "number") { const migratedCards = p.cards && typeof p.cards === "object" ? p.cards : Object.fromEntries([...new Set([...p.known, ...p.missed])].map((id:number)=>[id, reviewCard(undefined,id,false)])); setProgress({...p,cards:migratedCards}); } } } catch { setStorageMessage("Progress storage is unavailable. You can still practice this session."); } setReady(true); return ()=>window.clearInterval(timer); }, []);
 useEffect(() => { if(ready) try { localStorage.setItem("lingo-progress-v2", JSON.stringify(progress)); } catch { /* Session still works when storage is blocked. */ } }, [progress, ready]);
 useEffect(() => { const userId = authSession?.user.id; if(!ready || !userId || syncedUser === userId) return; let cancelled = false; fetch("/api/progress").then(async response => { if(!response.ok) throw new Error(); return response.json(); }).then(async data => { if(cancelled) return; if(data.progress) setProgress(data.progress); else await fetch("/api/progress", {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({progress})}); setSyncedUser(userId); setStorageMessage("Progress synced to your account."); }).catch(()=>setStorageMessage("Signed in, but cloud sync is waiting for the Neon database connection.")); return ()=>{cancelled=true}; }, [authSession?.user.id, ready, syncedUser]);
 useEffect(() => { if(!syncedUser) return; const timer = window.setTimeout(()=>fetch("/api/progress",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({progress})}).catch(()=>{}),700); return ()=>window.clearTimeout(timer); }, [progress, syncedUser]);
 useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);
 function speak(phrase: Phrase, slow = false) {
  if (!("speechSynthesis" in window)) { setAudioMessage("Speech playback isn't supported in this browser. Try Chrome or Edge with a Mandarin voice installed."); return; }
  window.speechSynthesis.cancel();
  const voices = window.speechSynthesis.getVoices();
  const voice = voices.find(v => /zh[-_]CN/i.test(v.lang)) || voices.find(v => /^zh/i.test(v.lang));
  if(!voice) { setAudioMessage("No Mandarin voice found. Enable a Chinese (Mandarin) speech voice in your device settings, then reload. You can reveal the phrase to practice reading."); setPlaying(false); return; }
  setAudioMessage("");
  const utterance = new SpeechSynthesisUtterance(phrase.hanzi); utterance.lang = "zh-CN"; utterance.voice = voice; utterance.rate = slow ? 0.65 : 0.9;
  utterance.onstart = () => setPlaying(true); utterance.onend = () => setPlaying(false); utterance.onerror = () => { setPlaying(false); setAudioMessage("Audio couldn't play. Try the listen button again."); }; window.speechSynthesis.speak(utterance);
 }
 useEffect(() => { if("speechSynthesis" in window) window.speechSynthesis.getVoices(); }, []);
 function start(list: Phrase[]) { if(!list.length) return; setSession(list); setIndex(0); setSelected(null); setRevealed(false); setScore(0); setFinished(false); setAudioMessage(""); }
 function answer(id: number) {
  if(selected !== null) return;
  setSelected(id); const p = session[index]; const correct = id === p.id;
  if(correct) setScore(s => s + 1);
  const recalled = correct && !revealed;
  setProgress(old => ({ ...old, xp: old.xp + (recalled ? 10 : 2), known: [...new Set([...old.known, p.id])], missed: recalled ? old.missed.filter(x => x !== p.id) : [...new Set([...old.missed, p.id])], dates: [...new Set([...old.dates, today()])], cards: {...old.cards,[p.id]:reviewCard(old.cards[p.id],p.id,recalled)} }));
 }
 function next() { window.speechSynthesis?.cancel(); setPlaying(false); if(index + 1 === session.length) { setFinished(true); setProgress(p => ({...p, sessions: p.sessions + 1})); } else { setIndex(i => i + 1); setSelected(null); setRevealed(false); } }
 const active = session[index];
 const options = active ? [active, ...phrases.filter(p => p.id !== active.id).sort((a,b) => ((a.id * 37 + active.id * 13) % 101) - ((b.id * 37 + active.id * 13) % 101)).slice(0,3)].sort((a,b) => ((a.id * 17 + index * 7) % 103) - ((b.id * 17 + index * 7) % 103)) : [];
 const cards = Object.values(progress.cards);
 const learningIds = cards.filter(card=>card.stage > 0).map(card=>card.phraseId);
 const fullyLearnedIds = cards.filter(card=>card.stage >= FULLY_LEARNED_STAGE).map(card=>card.phraseId);
 const dueCards = cards.filter(card=>new Date(card.dueAt).getTime() <= nowMs).sort((a,b)=>new Date(a.dueAt).getTime()-new Date(b.dueAt).getTime());
 const dueIds = dueCards.map(card=>card.phraseId);
 const mastered = fullyLearnedIds.filter(id => id < course).length;
 const nextTopic = Math.max(0, topics.slice(0, course / 10).findIndex((_, i) => phrases.slice(i * 10, i * 10 + 10).some(p => !progress.known.includes(p.id))));
 let streak = 0; const day = new Date(currentDay + "T12:00:00"); if(!progress.dates.includes(currentDay)) day.setDate(day.getDate()-1); while(progress.dates.includes(day.toLocaleDateString("en-CA"))) { streak++; day.setDate(day.getDate()-1); }
 const close = () => { setSession([]); setFinished(false); window.speechSynthesis?.cancel(); setPlaying(false); };
 return <div className="app-shell">
  <aside className="sidebar" inert={session.length > 0}><a className="brand" href="/">lingo<span>✳</span></a><div className="workspace-label">YOUR DAILY DOSE OF FLUENCY</div><nav>{[["Learn","grid"],["Phrase library","book"],["Review","repeat"],["Your progress","chart"]].map(([label, icon]) => <button key={label} className={tab === label ? "nav-item active" : "nav-item"} onClick={() => setTab(label)}><Icon name={icon}/>{label}{label === "Review" && dueCards.length > 0 && <span className="count">{dueCards.length}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="little-note"><span>✦</span><strong>Small steps.<br/>Big conversations.</strong><p>A few minutes today.<br/>A little more world tomorrow.</p></div><button className="profile" onClick={()=>authSession ? authClient.signOut() : setShowAuth(true)}><div className="avatar">{authSession?.user.name?.[0]?.toUpperCase() || "Y"}</div><div><strong>{authSession?.user.name || "Save your progress"}</strong><small>{authSession ? "Synced · Sign out" : "Create your learning account"}</small></div></button></div></aside>
  <div className="main-shell" inert={session.length > 0}><header><div className="breadcrumb">Your learning space <span>/</span> <strong>{tab}</strong></div><div className="header-right"><span className="language"><span className="flag">🇨🇳</span> Mandarin <span className="language-code">中文</span></span><span className="streak"><Icon name="fire" size={18}/>{streak} <span>day streak</span></span><button className="avatar small account-button" aria-label={authSession ? "Sign out" : "Sign in"} onClick={()=>authSession ? authClient.signOut() : setShowAuth(true)}>{authSession?.user.name?.[0]?.toUpperCase() || "Y"}</button></div></header>
  <main><div className="page-heading"><div><div className="eyebrow">LESS SCROLLING. MORE SPEAKING.</div><h1>{tab === "Learn" ? "Your next conversation starts here." : tab === "Phrase library" ? "Little phrases. Endless possibilities." : tab === "Review" ? "Make it second nature." : "Look how far you’ve come."}</h1><p>{tab === "Learn" ? "Train your ears. Find your words. A little Mandarin, every day." : tab === "Phrase library" ? "100 useful phrases, ready whenever you are." : tab === "Review" ? "Another listen today. A little easier tomorrow." : "Every listen is a step toward understanding."}</p></div><span className="date-pill"><span className="green-dot"/> YOUR JOURNEY, YOUR PACE</span></div>
  {storageMessage && <p role="status" className="notice">{storageMessage}</p>}
  {tab === "Learn" && <>
   <section className="hero"><div className="hero-copy"><span className="pill"> <Icon name="headphones" size={14}/> SPACED TO STICK.</span><h2>A new language.<br/>One <em>aha!</em> at a time.</h2><p>{dueCards.length ? `${dueCards.length} memories are ready for a quick refresh.` : "Your next review will arrive exactly when your memory needs it."}<br className="desktop-br"/> Each win earns a longer interval.</p><button className="primary" onClick={() => start(dueCards.length ? phrases.filter(p=>dueIds.includes(p.id)).slice(0,10) : phrases.slice(nextTopic * 10, nextTopic * 10 + 10))}>{dueCards.length ? `Review ${Math.min(10,dueCards.length)} due now` : "Learn new phrases"} <Icon name="arrow" size={19}/></button><span className="hero-caption"><Icon name="clock" size={14}/> 3-minute sprint <span>•</span> Reviews grow from 10 min to 180 days</span></div><Mascot/></section>
   <div className="stats-row"><div><span className="stat-icon peach"><Icon name="bolt"/></span><span><strong>{progress.xp.toLocaleString()} <small>XP</small></strong><p>Total good energy</p></span></div><div><span className="stat-icon mint"><Icon name="headphones"/></span><span><strong>{fullyLearnedIds.length} <small>/ 100</small></strong><p>Fully learned</p></span></div><div><span className="stat-icon lavender"><Icon name="repeat"/></span><span><strong>{dueCards.length} <small>due</small></strong><p>Ready to review now</p></span></div><div className="daily"><span className="daily-ring" style={{background: `conic-gradient(#718657 ${Math.min(100, progress.dates.includes(currentDay) ? 100 : 0)}%, #eeeae1 0)`}}><Icon name="check" size={18}/></span><span><strong>{progress.dates.includes(currentDay) ? "You showed up!" : "A little win awaits"}</strong><p>{progress.dates.includes(currentDay) ? "Daily listening goal complete" : "Listen to one phrase today"}</p></span></div></div>
   <div className="section-title"><div><h2>Choose your next milestone</h2><p>Start small. Build momentum. Surprise yourself.</p></div><span className="handwritten">You’ve got this ↴</span></div>
   <div className="course-grid"><button className={`course-card starter ${course === 10 ? "chosen" : ""}`} onClick={() => setCourse(10)}><div className="course-top"><span className="course-symbol">芽</span><span className="course-badge">THE PERFECT START</span></div><h3>Your first <span>10</span> phrases</h3><p>Little words that open big doors.<br/>Hello, thank you, and your first real connections.</p><div className="course-meta"><span><Icon name="repeat" size={15}/> 8 memory stages</span><span>10 min → 180 days</span></div><div className="course-bottom"><span>{fullyLearnedIds.filter(id => id < 10).length}/10 fully learned</span><span className="round-arrow"><Icon name={course === 10 ? "check" : "arrow"} size={17}/></span></div></button><button className={`course-card explorer ${course === 100 ? "chosen" : ""}`} onClick={() => setCourse(100)}><div className="course-top"><span className="course-symbol">山</span><span className="course-badge">A LITTLE MORE ADVENTURE</span></div><h3>Your first <span>100</span> phrases</h3><p>From your first coffee to finding your way.<br/>Everyday Mandarin for the world out there.</p><div className="course-meta"><span><Icon name="repeat" size={15}/> Adaptive review queue</span><span>Your pace</span></div><div className="course-bottom"><span>{fullyLearnedIds.length}/100 fully learned</span><span className="round-arrow"><Icon name={course === 100 ? "check" : "arrow"} size={17}/></span></div></button></div>
   <div className="lower-grid"><section className="path-section"><div className="section-title compact"><h2>Your listening path</h2><span>{mastered} / {course} fully learned</span></div>{topics.slice(0,course / 10).map((topic,i) => { const topicCards=cards.filter(card=>Math.floor(card.phraseId/10)===i); const topicMastered=topicCards.filter(card=>card.stage>=FULLY_LEARNED_STAGE).length; return <button className="lesson-row" key={topic} onClick={() => start(phrases.slice(i*10,i*10+10))}><span className="lesson-number">{topicMastered === 10 ? "✓" : String(i+1).padStart(2,"0")}</span><span><strong>{topic}</strong><small>{topicCards.length}/10 in memory <span>•</span> {topicMastered}/10 mastered</small></span><span className="lesson-action">{topicCards.length ? "Practice" : "Start sprint"}<Icon name="arrow" size={17}/></span></button>})}</section><aside className="tip-card"><span className="tip-label">✧ HOW MEMORY GROWS</span><h3>Right phrase.<br/>Right moment.</h3><p>Each successful recall doubles down on the memory: 10 minutes, 1 day, 3 days, then gradually out to 180 days. A miss shortens the gap so it can become strong again.</p><div className="sound-bars">{[12,23,34,19,42,29,17,34,23,12].map((h,i)=><i key={i} style={{height:h}}/>)}</div></aside></div>
  </>}
  {tab === "Phrase library" && <><div className="library-toolbar"><label className="search">⌕ <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a phrase in English, pinyin, or Chinese…" aria-label="Search phrases"/></label><span>{phrases.filter(p=>`${p.english} ${p.hanzi} ${p.pinyin}`.toLowerCase().includes(query.toLowerCase())).length} phrases</span></div><div className="phrase-grid">{phrases.filter(p=>`${p.english} ${p.hanzi} ${p.pinyin}`.toLowerCase().includes(query.toLowerCase())).map(p=>{const card=progress.cards[p.id];return <article className="phrase-card" key={p.id}><div><span className="eyebrow">{topics[p.topic]}</span>{card && <span className="known">{card.stage>=FULLY_LEARNED_STAGE ? "✦ Fully learned" : `Stage ${card.stage} · ${intervalLabel(card.stage)}`}</span>}</div><h3 lang="zh-CN">{p.hanzi}</h3><p className="pinyin">{p.pinyin}</p><p>{p.english}</p><button className="listen-link" onClick={()=>speak(p)}><Icon name="sound" size={17}/> Listen</button></article>})}</div>{audioMessage && <p role="status" className="notice">{audioMessage}</p>}</>}
  {tab === "Review" && <><section className="review-hero"><span className="big-icon"><Icon name="repeat" size={38}/></span><div><span className="eyebrow">YOUR MEMORY QUEUE</span><h2>{dueCards.length ? `${dueCards.length} ${dueCards.length === 1 ? "phrase is" : "phrases are"} ready now` : "You’re all caught up."}</h2><p>{dueCards.length ? "These phrases are due because enough time has passed to make the recall useful." : "Your reviews will return automatically as their intervals mature. You can still practice early if you feel curious."}</p></div><button className="primary" onClick={()=>start(dueCards.length ? phrases.filter(p=>dueIds.includes(p.id)).slice(0,10) : phrases.filter(p=>learningIds.includes(p.id)).slice(0,10).length ? phrases.filter(p=>learningIds.includes(p.id)).slice(0,10) : phrases.slice(0,10))}>{dueCards.length ? "Review due phrases" : learningIds.length ? "Practice early" : "Learn first phrases"}<Icon name="arrow" size={18}/></button></section><div className="schedule-strip">{["10 min","1 day","3 days","7 days","14 days","30 days","90 days","180 days"].map((label,i)=><div key={label} className={cards.some(c=>c.stage>i) ? "reached" : ""}><span>{i+1}</span><strong>{label}</strong><small>{cards.filter(c=>c.stage===i+1).length} phrases</small></div>)}</div></>}
  {tab === "Your progress" && <><div className="progress-grid">{[[progress.xp,"Total XP"],[fullyLearnedIds.length,"Fully learned"],[learningIds.length,"In memory"],[streak,"Day streak"]].map(([value,label])=><div className="metric" key={label}><Icon name="bolt"/><strong>{value}</strong><span>{label}</span></div>)}</div><section className="milestones"><h2>Your mastery milestones</h2>{[1,10,50,100].map(n=><div className="milestone" key={n}><span className={fullyLearnedIds.length >= n ? "unlocked" : ""}>{fullyLearnedIds.length >= n ? "✦" : "☆"}</span><div><strong>{n === 1 ? "A memory that lasts" : `${n} phrases, truly learned`}</strong><p>{Math.min(n,fullyLearnedIds.length)} / {n} phrases at the 180-day stage</p><progress value={fullyLearnedIds.length} max={n}/></div></div>)}</section><p className="local-note">{authSession ? `Synced as ${authSession.user.email}` : "Saved in this browser. Sign in to sync across devices."}</p></>}
  <footer><span className="footer-brand">lingo✳</span> A little listening. A lot of possibility.<span>Made for your next “I understood that.”</span></footer>
  </main></div>
  {showAuth && <AuthModal onClose={()=>setShowAuth(false)}/>} 
  {session.length > 0 && <div className="modal-backdrop"><section className="sprint-modal" role="dialog" aria-modal="true" aria-label="Listening sprint" onKeyDown={e => { if(e.key === "Escape") close(); if(e.key === "Tab") { const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")); const first = buttons[0]; const last = buttons[buttons.length - 1]; if(e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if(!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } } }}><button autoFocus className="close" aria-label="Close sprint" onClick={close}>×</button>{finished ? <div className="completion"><div className="celebration">✦</div><span className="eyebrow">ONE SPRINT. ONE STEP FORWARD.</span><h2>Look at you, listening!</h2><p>You recognized {score} of {session.length} phrases.</p><div className="reward">+{score*10+(session.length-score)*2} XP <Icon name="bolt"/></div><p>{score === session.length ? "That’s a little more Mandarin in your world." : "Your tricky phrases are saved in Review for another go."}</p><button className="primary" onClick={close}>Keep the momentum <Icon name="arrow" size={18}/></button><button className="text-button" onClick={()=>start(session)}>Practice this sprint again</button></div> : <><span className="eyebrow">LISTENING SPRINT · {index+1} OF {session.length}</span><progress className="sprint-progress" value={index} max={session.length}/><h2>What did you hear?</h2><p className="sprint-subtitle">Listen closely. Trust your ears.</p><button className={`audio-orb ${playing ? "playing" : ""}`} onClick={()=>speak(active)} aria-label="Play Mandarin phrase"><Icon name="sound" size={38}/></button><div className="audio-actions"><button onClick={()=>speak(active,true)}>Listen slowly</button><span>·</span><button onClick={()=>setRevealed(true)}>Reveal phrase</button></div>{audioMessage && <p className="notice" role="status">{audioMessage}</p>}{(revealed || selected !== null) && <div className="reveal"><strong lang="zh-CN">{active.hanzi}</strong><span>{active.pinyin}</span>{revealed && selected === null && <small>Try again without a hint in Review.</small>}</div>}<div className="answer-options">{options.map((p,i)=><button key={p.id} disabled={selected!==null} className={selected !== null ? p.id===active.id ? "correct" : p.id===selected ? "incorrect" : "" : ""} onClick={()=>answer(p.id)}><span>{i+1}</span>{p.english}{selected!==null && p.id===active.id && <Icon name="check" size={19}/>}</button>)}</div>{selected!==null && <div className={`feedback ${selected===active.id ? "good" : ""}`} role="status"><strong>{selected===active.id ? "Yes! Your ears got it. +10 XP" : `You’re learning! It means “${active.english}”. +2 XP`}</strong><button className="primary" onClick={next}>{index+1===session.length ? "Finish sprint" : "Next phrase"}<Icon name="arrow" size={18}/></button></div>}<p className="sprint-footnote">Listen as often as you like. There’s no timer here.</p></>}</section></div>}
 </div>;
}


