"use client";

import Link from "next/link";
import { useState } from "react";
import { phrases } from "../phrases";
import "./practice.css";

const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export default function TypedPracticePage() {
 const [index, setIndex] = useState(0); const [answer, setAnswer] = useState(""); const [checked, setChecked] = useState<boolean | null>(null); const phrase = phrases[index % 10];
 const submit = () => { const expected = clean(phrase.english); const actual = clean(answer); const overlap = expected.split(" ").filter(word => actual.split(" ").includes(word)).length / Math.max(1, expected.split(" ").length); setChecked(actual === expected || overlap >= .72); };
 const next = () => { setIndex(value => value + 1); setAnswer(""); setChecked(null); };
 return <main className="practice-page"><header><div><span className="eyebrow">LEVEL 2 · ACTIVE RECALL</span><h1>Say what it means.</h1><p>Listen or read the Mandarin, then type the English meaning in your own words.</p></div><Link href="/">← Back to learning</Link></header><section className="practice-card"><span className="practice-count">PHRASE {index % 10 + 1} OF 10</span><h2 lang="zh-CN">{phrase.hanzi}</h2><p className="pinyin">{phrase.pinyin}</p><button className="listen" onClick={() => { const utterance = new SpeechSynthesisUtterance(phrase.hanzi); utterance.lang = "zh-CN"; speechSynthesis.cancel(); speechSynthesis.speak(utterance); }}>▶ Listen</button><label>English meaning<input value={answer} onChange={event => { setAnswer(event.target.value); setChecked(null); }} onKeyDown={event => { if (event.key === "Enter") submit(); }} placeholder="Type your answer…" autoFocus /></label>{checked !== null && <p className={checked ? "feedback good" : "feedback"}>{checked ? "Correct — active recall is stronger than recognition." : `Not quite. The meaning is: “${phrase.english}”`}</p>}<div className="practice-actions">{checked === null ? <button className="primary" onClick={submit}>Check answer</button> : <button className="primary" onClick={next}>Next phrase →</button>}</div></section></main>;
}
