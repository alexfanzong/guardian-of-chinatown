export function initialLanguage(search) {
  const requested = new URLSearchParams(search).get('lang');
  if (requested === 'en' || requested === 'zh') return requested;
  return 'en';
}

export function localized(lang, english, chinese) {
  return lang === 'zh' ? chinese : english;
}

export function handName(side, lang) {
  return side === 'L' ? localized(lang, 'left', '左') : localized(lang, 'right', '右');
}
