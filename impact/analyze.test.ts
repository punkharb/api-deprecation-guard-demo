import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, type Usage } from './analyze.ts';

const usage: Usage[] = [
  { app: 'A', method: 'GET', path: '/users/{id}', field: 'name' },
  { app: 'B', method: 'GET', path: '/users/{id}', field: 'name' },
  { app: 'B', method: 'GET', path: '/users/{id}', field: 'phone' },
  { app: 'C', method: 'GET', path: '/users/{id}', field: 'id' },
  { app: 'D', method: 'GET', path: '/orders', field: 'total' },
];

// Real entries copied from `oasdiff changelog base.yaml 1-remove.yaml -f json` (v1.40.0)
const phoneRemoved = {
  id: 'response-optional-property-removed',
  text: 'removed the optional property `phone` from the response with the `200` status',
  level: 1, operation: 'GET', path: '/users/{id}',
};
const ordersRemoved = {
  id: 'api-path-removed-without-deprecation',
  text: 'API path removed without deprecation',
  level: 3, operation: 'GET', path: '/orders',
};
const ordersDeprecated = {
  id: 'endpoint-deprecated-with-sunset',
  text: 'endpoint deprecated with sunset date `2027-06-01`',
  level: 1, operation: 'GET', path: '/orders',
};
const versionChanged = { id: 'api-version-changed', text: 'the API version changed', level: 1 };

test('removing a response field breaks only the app that reads it', () => {
  const r = analyze([phoneRemoved], usage);
  assert.deepEqual(r.broken.map(x => x.app), ['B']);
  assert.deepEqual(r.safe, ['A', 'C', 'D']);
});

test('removing an endpoint breaks every app that calls it', () => {
  const r = analyze([ordersRemoved, versionChanged], usage);
  assert.deepEqual(r.broken.map(x => x.app), ['D']);
});

test('removing a nested field (items/total) breaks the app reading it', () => {
  const r = analyze([{
    id: 'response-optional-property-removed',
    text: 'removed the optional property `items/total` from the response with the `200` status',
    level: 1, operation: 'GET', path: '/orders',
  }], usage);
  assert.deepEqual(r.broken.map(x => x.app), ['D']);
});

test('changing a field type breaks the app reading it', () => {
  const r = analyze([{
    id: 'response-property-type-changed',
    text: 'the `phone` response\'s property `type` changed from `string` to `integer` for status `200`',
    level: 3, operation: 'GET', path: '/users/{id}',
  }], usage);
  assert.deepEqual(r.broken, [{ app: 'B', reason: "GET /users/{id} field 'phone' changed (response-property-type-changed)" }]);
});

test('deprecating an endpoint warns its callers with the sunset date, breaks nobody', () => {
  const r = analyze([ordersDeprecated], usage);
  assert.deepEqual(r.broken, []);
  assert.deepEqual(r.warned, [{ app: 'D', reason: 'GET /orders deprecated, sunset 2027-06-01' }]);
});
