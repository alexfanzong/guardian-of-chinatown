import test from 'node:test';
import assert from 'node:assert/strict';
import * as language from '../app/language.js';

test('an explicitly selected language still opens that combat interface', () => {
  assert.equal(typeof language.initialLanguage, 'function');
  assert.equal(language.initialLanguage('?lang=en', ['zh-CN']), 'en');
  assert.equal(language.initialLanguage('?lang=zh', ['en-US']), 'zh');
});

test('default combat stays English regardless of browser language', () => {
  assert.equal(typeof language.initialLanguage, 'function');
  for (const [preferences, expected] of [
    [['zh-CN', 'en-US'], 'en'],
    [['zh-TW'], 'en'],
    [['zh-Hant-HK', 'en'], 'en'],
    [['en-GB', 'zh-CN'], 'en'],
    [['fr-FR', 'zh-CN', 'en'], 'en'],
    [['fr-FR'], 'en'],
    [[], 'en'],
  ]) assert.equal(language.initialLanguage('', preferences), expected);
  assert.equal(language.initialLanguage('?lang=unknown', ['zh-CN']), 'en');
});
