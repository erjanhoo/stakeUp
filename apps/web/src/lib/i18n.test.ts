import { expect, it } from 'vitest';
import { translate } from './i18n';
it('keeps English copy and user content intact, including object property names', () => {
  expect(translate('Overview', 'en')).toBe('Overview');
  for (const content of ['toString', '__proto__', 'Reading with Алина'])
    expect(translate(content, 'ru')).toBe(content);
});
it('translates interface, validation and structured activity without changing a challenge title', () => {
  expect(translate('Overview', 'ru')).toBe('Обзор');
  expect(translate('Use at least 8 characters.', 'ru')).toBe('Используйте не менее 8 символов.');
  expect(translate('Too small: expected string to have >=3 characters', 'ru')).toBe(
    'Минимум 3 символов.',
  );
  expect(translate('Proposed Read with Anna', 'ru')).toBe('Предложено Read with Anna');
});
