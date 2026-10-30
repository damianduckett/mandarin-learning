import { createEmptyCard, fsrs, Rating, type Card, type Grade } from "ts-fsrs";

/** Deterministically rebuilds a card from its immutable review history. */
export function reconstructCard(events:Array<{reviewedAt:string;rating:number}>, now=new Date()):Card {
  const scheduler=fsrs({request_retention:0.9});
  let card=createEmptyCard(events.length ? new Date(events[0].reviewedAt) : now);
  for(const event of [...events].sort((a,b)=>new Date(a.reviewedAt).getTime()-new Date(b.reviewedAt).getTime())) {
    if (!Number.isInteger(event.rating) || event.rating < Rating.Again || event.rating > Rating.Easy) {
      throw new Error("Review history contains an invalid rating");
    }
    card=scheduler.next(card,new Date(event.reviewedAt),event.rating as Grade).card as Card;
    if(new Date(card.due).getTime()<new Date(event.reviewedAt).getTime()+86400000) card.due=new Date(new Date(event.reviewedAt).getTime()+86400000);
  }
  return card;
}
