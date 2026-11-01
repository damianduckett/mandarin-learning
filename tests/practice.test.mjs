import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const dirname = path.dirname(fileURLToPath(import.meta.url));

function load(relativePath) {
  const filename = path.resolve(dirname, '..', relativePath);
  const localRequire = createRequire(filename);
  const compiled = { exports: {} };
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  });
  new Function('require', 'module', 'exports', outputText)(name =>
    name.startsWith('.') ? load(path.relative(path.resolve(dirname, '..'), path.resolve(path.dirname(filename), name + '.ts'))) : localRequire(name), compiled, compiled.exports);
  return compiled.exports;
}

const { matchesEnglishAnswer } = load('lib/english-answer.ts');
const { completeLesson } = load('lib/lesson-practice.ts');
const { phrases } = load('app/phrases.ts');

test('accepts canonical answers for every phrase and slash alternative', () => {
  for (const phrase of phrases) {
    for (const variant of phrase.english.split(/\s+\/\s+/)) {
      assert.equal(matchesEnglishAnswer(variant, phrase.english), true, `${phrase.id}: ${variant}`);
    }
  }
});

test('accepts common variants, contractions and formatting', () => {
  for (const [actual, expected] of [
    ['  HI!!! ', 'Hello'], ['Thanks', 'Thank you'],
    ['I am hungry', "I'm hungry"], ['I don’t understand.', "I don't understand"],
    ['I cannot open this file', "I can't open this file."],
    ['Where is the bathroom?', 'Where is the restroom?'],
    ['Give me a cup of green tea', 'Please give me a cup of green tea.'],
    ['PLEASE!', 'Please'], ['No', "No / That's not right"],
  ]) assert.equal(matchesEnglishAnswer(actual, expected), true, actual);
});

test('rejects opposite meanings, reversed roles, wrong numbers and partial answers', () => {
  for (const [actual, expected] of [
    ['I know', "I don't know"], ['I am not hungry', "I'm hungry"],
    ['I like you', 'You like me'], ['two tickets', 'three tickets'],
    ['tea', 'Please give me a cup of green tea.'],
    ['', 'Hello'], ['please', 'Hello'], ['!!!', 'Please'], ['I can open this file', "I can't open this file"],
  ]) assert.equal(matchesEnglishAnswer(actual, expected), false, actual);
});

test('repeating a mastered lesson keeps increasing lifetime totals', () => {
  let stats;
  for (let i = 0; i < 1200; i++) stats = completeLesson(stats, 10);
  assert.deepEqual(stats, { completions: 1200, masteryPoints: 12000, bestScore: 10 });
  const missed = completeLesson(stats, 0);
  assert.deepEqual(missed, { completions: 1201, masteryPoints: 12000, bestScore: 10 });
  assert.deepEqual(stats, { completions: 1200, masteryPoints: 12000, bestScore: 10 });
  assert.deepEqual(completeLesson(JSON.parse(JSON.stringify(missed)), 7), { completions: 1202, masteryPoints: 12007, bestScore: 10 });
});

test('old progress needs no migration to start tracking lesson practice', () => {
  assert.deepEqual(completeLesson(undefined, 4), { completions: 1, masteryPoints: 4, bestScore: 4 });
});

const { recordRecall, recommendedMode, isComplete, masteryPercent } = load('lib/phrase-mastery.ts');
const { reviewCard } = load('lib/spaced-repetition.ts');
test('recognition unlocks typing, typed recall completes, further practice earns points', () => {
  let value;
  assert.equal(recommendedMode(value), 'choice');
  for(let i=0;i<3;i++) value=recordRecall(value,'choice',true,false);
  assert.equal(recommendedMode(value),'write');
  assert.equal(isComplete(value),false);
  assert.equal(masteryPercent(value),50);
  for(let i=0;i<3;i++) value=recordRecall(value,'write',true,false);
  assert.equal(isComplete(value),true);
  assert.equal(masteryPercent(value),100);
  assert.equal(value.points,9);
  value=recordRecall(JSON.parse(JSON.stringify(value)),'write',true,false);
  assert.equal(value.points,11);
  assert.equal(isComplete(value),true);
});
test('mistakes, hints and repeated choices cannot falsely complete a phrase', () => {
  let value=recordRecall(undefined,'choice',false,false);
  value=recordRecall(value,'write',true,true);
  assert.equal(value.points,0);
  assert.equal(masteryPercent(value),0);
  for(let i=0;i<30;i++) value=recordRecall(value,'choice',true,false);
  assert.equal(isComplete(value),false);
  assert.equal(masteryPercent(value),50);
  assert.equal(value.attempts,32);
});
test('legacy progress cards are safely upgraded before the next answer', () => {
  const legacy = { phraseId: 1, stage: 2, dueAt: '2026-10-30T12:00:00.000Z', lastReviewedAt: '2026-10-30T12:00:00.000Z', correctStreak: 2, lapses: 0 };
  const upgraded = reviewCard(legacy, 1, true, new Date('2026-11-01T12:00:00.000Z'));
  assert.equal(upgraded.phraseId, 1);
  assert.equal(Number.isFinite(upgraded.stability), true);
  assert.equal(Number.isFinite(upgraded.difficulty), true);
});
