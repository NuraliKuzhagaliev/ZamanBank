const topics = [
  {
    matches: /баланс|остаток|balance/i,
    en: 'The Dashboard shows a fictional balance of 250,000 KZT.',
    ru: 'В кабинете показан вымышленный баланс 250 000 ₸.'
  },
  {
    matches: /цел[ьиъяея]|накоп|sav(e|ing)|goals?/i,
    en: 'Sign in to the demo, open the Dashboard and select + Create goal. Enter a name, amount and deadline.',
    ru: 'Войдите в демо, откройте кабинет и нажмите «+ Создать цель». Укажите название, сумму и срок.'
  },
  {
    matches: /операци|транзакци|transaction/i,
    en: 'Open the Dashboard to see sample deposits and withdrawals.',
    ru: 'Откройте кабинет, чтобы посмотреть примеры поступлений и списаний.'
  }
];

export function demoChatReply(message, locale) {
  const topic = topics.find(({ matches }) => matches.test(message));
  const text = locale === 'ru'
    ? topic?.ru || 'Спросите о демо-балансе, целях накопления или примерах операций.'
    : topic?.en || 'Ask about the demo balance, savings goals or sample transactions.';
  return { text, suggested_action: null, source: 'demo' };
}
