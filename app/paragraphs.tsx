"use client";

import { useState } from "react";

type Line = { hanzi: string; pinyin: string; english: string };
type Passage = { id: string; title: string; level: string; description: string; lines: Line[] };

const passages: Passage[] = [
  { id: "coffee", title: "A coffee, please", level: "Everyday conversation", description: "A tiny café exchange you can use immediately.", lines: [
    { hanzi: "你好，请问你们有什么咖啡？", pinyin: "Nǐ hǎo, qǐngwèn nǐmen yǒu shénme kāfēi?", english: "Hello, what coffee do you have?" },
    { hanzi: "我们有美式咖啡和拿铁。", pinyin: "Wǒmen yǒu Měishì kāfēi hé nátiě.", english: "We have Americano and latte." },
    { hanzi: "我要一杯拿铁，谢谢。", pinyin: "Wǒ yào yì bēi nátiě, xièxie.", english: "I’d like one latte, thank you." },
    { hanzi: "好的，请稍等。", pinyin: "Hǎo de, qǐng shāo děng.", english: "Okay, please wait a moment." },
  ] },
  { id: "meet", title: "Meeting a new friend", level: "First conversations", description: "Names, where you’re from, and a natural follow-up question.", lines: [
    { hanzi: "你好，我叫安娜。你叫什么名字？", pinyin: "Nǐ hǎo, wǒ jiào Ānnà. Nǐ jiào shénme míngzi?", english: "Hi, my name is Anna. What’s your name?" },
    { hanzi: "我叫大卫，很高兴认识你。", pinyin: "Wǒ jiào Dàwèi, hěn gāoxìng rènshi nǐ.", english: "My name is David. Nice to meet you." },
    { hanzi: "你从哪里来？", pinyin: "Nǐ cóng nǎlǐ lái?", english: "Where are you from?" },
    { hanzi: "我从英国来，现在住在北京。", pinyin: "Wǒ cóng Yīngguó lái, xiànzài zhù zài Běijīng.", english: "I’m from the UK, and now I live in Beijing." },
  ] },
];

export function Paragraphs({ speak }: { speak: (text: string, slow?: boolean) => void }) {
  const [passage, setPassage] = useState(passages[0]);
  const [stage, setStage] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEnglish, setShowEnglish] = useState(true);
  const [checked, setChecked] = useState<number[]>([]);
  const hidden = (index: number) => stage >= 3 || (stage >= 2 && index % 2 === 0) || (stage >= 1 && index === passage.lines.length - 1);
  const advance = () => { setChecked([]); setStage(value => Math.min(3, value + 1)); };
  return <>
    <div className="paragraph-picker">{passages.map(item => <button key={item.id} className={item.id === passage.id ? "paragraph-choice active" : "paragraph-choice"} onClick={() => { setPassage(item); setStage(0); setChecked([]); }}><span>{item.level}</span><strong>{item.title}</strong><small>{item.description}</small></button>)}</div>
    <section className="paragraph-panel">
      <div className="paragraph-head"><div><span className="eyebrow">MEMORY READING · {stage}/3 REVEAL STAGES</span><h2>{passage.title}</h2><p>Listen line by line, read aloud, then hide the support until you can say the whole exchange.</p></div><button className="primary" onClick={() => passage.lines.forEach((line, index) => window.setTimeout(() => speak(line.hanzi), index * 1600))}>Play all lines</button></div>
      <div className="paragraph-controls"><label><input type="checkbox" checked={showPinyin} onChange={event => setShowPinyin(event.target.checked)}/> Pinyin</label><label><input type="checkbox" checked={showEnglish} onChange={event => setShowEnglish(event.target.checked)}/> English</label><span>Stage {stage + 1} of 4 · {stage === 3 ? "Full memory" : "Keep going"}</span></div>
      <div className="line-list">{passage.lines.map((line, index) => <article className={checked.includes(index) ? "memory-line recalled" : "memory-line"} key={line.hanzi}><button className="line-play" aria-label={`Play line ${index + 1}`} onClick={() => speak(line.hanzi)}><span>▶</span></button><div className="line-copy"><strong lang="zh-CN" className={hidden(index) && !checked.includes(index) ? "masked" : ""}>{line.hanzi}</strong>{showPinyin && <span className={hidden(index) && !checked.includes(index) ? "masked" : "pinyin"}>{line.pinyin}</span>}{showEnglish && <small className={hidden(index) && !checked.includes(index) ? "masked" : ""}>{line.english}</small>}</div><button className="recall-button" onClick={() => setChecked(items => items.includes(index) ? items.filter(item => item !== index) : [...items, index])}>{checked.includes(index) ? "Got it" : "I remembered"}</button></article>)}</div>
      <div className="paragraph-footer"><p>{checked.length}/{passage.lines.length} lines recalled without looking</p><button className="primary" disabled={checked.length < passage.lines.length} onClick={advance}>{stage === 3 ? "Keep it strong" : "Hide a little more"} <span>→</span></button></div>
    </section>
  </>;
}
