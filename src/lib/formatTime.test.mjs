import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime } from './formatTime.mjs';

test('formats midnight hour as 12 AM', () => {
  assert.equal(formatTime('00:13'), '12:13 AM');
});

test('formats noon hour as 12 PM', () => {
  assert.equal(formatTime('12:00'), '12:00 PM');
});

test('formats afternoon hour', () => {
  assert.equal(formatTime('13:49'), '1:49 PM');
});

test('formats late night hour', () => {
  assert.equal(formatTime('23:59'), '11:59 PM');
});

test('formats single-digit morning hour', () => {
  assert.equal(formatTime('02:26'), '2:26 AM');
});
