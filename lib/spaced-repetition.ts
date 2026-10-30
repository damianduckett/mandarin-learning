import { createEmptyCard, fsrs, Rating, type Card } from "ts-fsrs";
export const MIN_REVIEW_INTERVAL=86400000;
export const FULLY_LEARNED_STAGE=8;
export type MemoryCard={phraseId:number;dueAt:string;lastReviewedAt:string;stability:number;difficulty:number;elapsedDays:number;scheduledDays:number;reps:number;lapses:number;learningSteps:number;state:number;stage:number;fsrs?:Card};
export type ReviewEvent={phraseId:number;clientEventId:string;reviewedAt:string;rating:number;correct:boolean;previousDue:string|null;newDue:string|null};
const scheduler=fsrs({request_retention:0.9});
export function cardFromFsrs(phraseId:number,card:Card):MemoryCard{return{phraseId,dueAt:new Date(card.due).toISOString(),lastReviewedAt:card.last_review?new Date(card.last_review).toISOString():new Date(0).toISOString(),stability:card.stability,difficulty:card.difficulty,elapsedDays:card.elapsed_days,scheduledDays:card.scheduled_days,reps:card.reps,lapses:card.lapses,learningSteps:card.learning_steps,state:card.state,stage:Math.min(FULLY_LEARNED_STAGE,Math.max(0,card.reps)),fsrs:card};}
export function emptyMemoryCard(phraseId:number,now=new Date()){return cardFromFsrs(phraseId,createEmptyCard(now));}
export function reviewCard(previous:MemoryCard|undefined,phraseId:number,correct:boolean,now=new Date()):MemoryCard{const base:Card=previous?.fsrs??(previous?{due:new Date(previous.dueAt),stability:previous.stability,difficulty:previous.difficulty,elapsed_days:previous.elapsedDays,scheduled_days:previous.scheduledDays,reps:previous.reps,lapses:previous.lapses,learning_steps:previous.learningSteps,state:previous.state,last_review:new Date(previous.lastReviewedAt||now)} as Card:createEmptyCard(now));const next=scheduler.next(base,now,correct?Rating.Good:Rating.Again).card as Card;if(new Date(next.due).getTime()<now.getTime()+MIN_REVIEW_INTERVAL)next.due=new Date(now.getTime()+MIN_REVIEW_INTERVAL);return cardFromFsrs(phraseId,next);}
export function isDue(card:MemoryCard,now=new Date()){return new Date(card.dueAt).getTime()<=now.getTime();}
export function retrievability(card:MemoryCard,now=new Date()){if(!card.stability)return 0;const elapsed=Math.max(0,(now.getTime()-new Date(card.lastReviewedAt).getTime())/86400000);return Math.pow(.9,elapsed/card.stability);}
export function intervalLabel(card:MemoryCard|number|undefined){if(typeof card==="number")return card?`${card} stage`:"new";if(!card)return"new";const days=Math.max(1,Math.round(card.scheduledDays));return`${days} day${days===1?"":"s"}`;}
export {Rating};
