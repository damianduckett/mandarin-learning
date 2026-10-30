"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { phrases } from "../phrases";
import { intervalLabel, type MemoryCard } from "@/lib/spaced-repetition";
import "./piles.css";
type Progress={cards:Record<number,MemoryCard>};
const piles=["1 day","3 days","7 days","14 days","30 days","90 days","180 days","365 days"];
export default function PilesPage(){const [progress,setProgress]=useState<Progress>({cards:{}});useEffect(()=>{fetch("/api/progress",{credentials:"include"}).then(r=>r.json()).then(data=>{if(data.progress)setProgress(data.progress)}).catch(()=>{});},[]);const groups=useMemo(()=>piles.map(label=>({label,items:phrases.filter(phrase=>intervalLabel(progress.cards[phrase.id]?.stage||0)===label)})),[progress]);return <main className="piles-page"><header><div><span className="eyebrow">PHRASE LIBRARY · MEMORY PILES</span><h1>See your phrases move forward.</h1><p>Each correct recall moves a phrase into a longer interval. A miss brings it back to a nearer pile.</p></div><Link href="/">← Back to learning</Link></header><div className="pile-grid">{groups.map(group=><section className="pile" key={group.label}><div className="pile-head"><div><span className="pile-dot"/><h2>{group.label}</h2></div><strong>{group.items.length}</strong></div>{group.items.length?group.items.map(phrase=><article key={phrase.id}><strong lang="zh-CN">{phrase.hanzi}</strong><span>{phrase.pinyin}</span><small>{phrase.english}</small></article>):<p className="empty-pile">No phrases here yet.</p>}</section>)}</div></main>}
