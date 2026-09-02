const test = require('node:test');
const assert = require('node:assert/strict');
const { buildMessagePayload } = require('../routes/chat');

test('buildMessagePayload keeps attachment data for image messages', () => {
  const payload = buildMessagePayload({
    text: 'Here is the view',
    itineraryId: null,
    imageUrl: '/uploads/messages/123-photo.jpg'
  });

  assert.equal(payload.text, 'Here is the view');
  assert.equal(payload.image, '/uploads/messages/123-photo.jpg');
  assert.equal(payload.itineraryId, null);
});

test('buildMessagePayload rejects empty messages without text, image, or itinerary', () => {
  const payload = buildMessagePayload({ text: '   ', itineraryId: null, imageUrl: '' });

  assert.equal(payload.valid, false);
  assert.match(payload.error, /Write a message or attach/i);
});
