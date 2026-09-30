const request = require('supertest');
const app = require('../service');

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

const registeredUser = { name: 'registered diner', email: 'reg@test.com', password: 'a' };
const unregisteredUser = { name: 'unregistered diner', email: 'unreg@test.com', password: 'b' };
let registeredUserAuthToken;

beforeAll(async () => {
  registeredUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
  const unregisteredUser = { email: Math.random().toString(36).substring(2, 12) + '@test.com', password: 'a' };
  const registerRes = await request(app).post('/api/auth').send(registeredUser);
  registeredUserAuthToken = registerRes.body.token;
  expectValidJwt(registeredUserAuthToken);
});

//PUT /api/auth tests
test('validLogin', async () => {
  const loginRes = await request(app).put('/api/auth').send(registeredUser);
  expect(loginRes.status).toBe(200);
  expectValidJwt(loginRes.body.token);

  const expectedUser = { ...registeredUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(loginRes.body.user).toMatchObject(expectedUser);
});

test('unregisteredLogin', async () => {
  const loginRes = await request(app).put('/api/auth').send(unregisteredUser);

  expect(loginRes.status).toBe(404);
  expect(loginRes.body.message).toBe('unknown user');
  expect(loginRes.body.token).toBeUndefined();
});

//POST /api/auth tests
test('validRegister', async () => {
  
});

//DELETE /api/auth tests
test('validLogout', async () => {

});
