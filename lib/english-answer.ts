// Conservative matching: preserve word order and negation. Do not award a
// correct answer just because it shares most words with the translation.
export function normalizeEnglish(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[’‘]/g, "'")
    .replace(/\bi'm\b/g, "i am").replace(/\b(you|we|they)'re\b/g, "$1 are")
    .replace(/\b(it|that|there|he|she|what|who)'s\b/g, "$1 is")
    .replace(/\b(i|you|we|they)'ve\b/g, "$1 have")
    .replace(/\b(i|you|we|they|he|she)'ll\b/g, "$1 will")
    .replace(/\b(i|you|we|they)'d\b/g, "$1 would")
    .replace(/\bwon't\b/g, "will not").replace(/\bcan't\b/g, "cannot")
    .replace(/\bcan not\b/g, "cannot").replace(/n't\b/g, " not")
    .replace(/\blet's\b/g, "let us")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bplease\b/g, "")
    .replace(/\b(okay|ok)\b/g, "okay")
    .replace(/\b(restroom|bathroom|toilet)\b/g, "restroom")
    .replace(/\b(subway|metro)\b/g, "subway")
    .replace(/\b(movie|film)\b/g, "film")
    .replace(/\b(color|colour)\b/g, "colour")
    .replace(/\b(trash|garbage|rubbish)\b/g, "rubbish")
    .replace(/\s+/g, " ").trim();
}

const alternativeGroups = [
  ["Hello", "Hi", "Hey"],
  ["Thank you", "Thanks", "Thanks a lot", "Thank you very much"],
  ["Goodbye", "Bye", "Bye bye"],
  ["Sorry", "I am sorry"],
  ["It's okay", "That's okay", "It's alright", "No worries"],
  ["You're welcome", "You are welcome", "No problem"],
  ["Yes", "That's right", "Correct"],
  ["No", "That's not right", "That's incorrect"],
  ["I don't understand", "I do not get it"],
  ["How much is it?", "How much does it cost?"],
  ["The bill, please", "The check, please", "Can I have the bill?"],
  ["Please say that again", "Could you repeat that?", "Can you say that again?"],
  ["Please speak more slowly", "Please speak slower", "Could you speak more slowly?"],
  ["Nice to meet you", "Pleased to meet you"],
  ["I'm very well", "I'm very good", "I'm doing very well"],
  ["And you?", "What about you?", "How about you?"],
  ["I agree", "I agree with you"],
].map(group => group.map(normalizeEnglish));

export function matchesEnglishAnswer(answer: string, expected: string): boolean {
  const actual = normalizeEnglish(answer);
  // 'Please' is optional in longer answers, but is also a standalone card.
  if (!actual) return expected.toLowerCase() === "please" && answer.trim().toLowerCase().replace(/[.!?]/g, "") === "please";
  return expected.split(/\s+\/\s+/).some(variant => {
    const target = normalizeEnglish(variant);
    return actual === target || alternativeGroups.some(group => group.includes(target) && group.includes(actual));
  });
}
