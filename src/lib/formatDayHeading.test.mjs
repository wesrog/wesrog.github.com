import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDayHeading } from './formatDayHeading.mjs';

test('formats a date string with correct weekday', () => {
  assert.equal(formatDayHeading('2010-02-11'), 'Thursday, February 11, 2010');
});

test('does not shift the date across a UTC day boundary', () => {
  // Regression guard: new Date('2010-02-01') parses as UTC midnight, which
  // renders as Jan 31 in negative-UTC-offset timezones if formatted naively.
  assert.equal(formatDayHeading('2010-02-01'), 'Monday, February 1, 2010');
});

test('formats a date near the end of a month', () => {
  assert.equal(formatDayHeading('2010-02-28'), 'Sunday, February 28, 2010');
});
