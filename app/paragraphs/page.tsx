"use client";

import { Paragraphs } from "../paragraphs";
import Link from "next/link";
import "./paragraphs.css";

export default function ParagraphsPage() {
  function speak(text: string, slow = false) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = slow ? 0.65 : 0.9;
    window.speechSynthesis.speak(utterance);
  }
  return <main className="standalone-page"><div className="page-heading"><div><div className="eyebrow">LINGO · LISTENING MEMORY</div><h1>Memorise a whole conversation.</h1><p>Listen line by line, then gradually hide the support until you can say it from memory.</p></div><Link className="text-button" href="/">← Back to learning</Link></div><Paragraphs speak={speak}/></main>;
}
