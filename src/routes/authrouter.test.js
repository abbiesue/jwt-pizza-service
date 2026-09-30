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
  unregisteredUser.email = Math.random().toString(36).substring(2, 12) + '@test.com';
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
  const registerRes = await request(app).post('/api/auth').send(unregisteredUser);
  expect(registerRes.status).toBe(200);
  expectValidJwt(registerRes.body.token);
  
  const expectedUser = { ...unregisteredUser, roles: [{ role: 'diner' }] };
  delete expectedUser.password;
  expect(registerRes.body.user).toMatchObject(expectedUser);
});

//DELETE /api/auth tests
test('validLogout', async () => {
  const logoutUser = {name: 'logout diner', email: Math.random().toString(36).substring(2, 12) + '@test.com', password: 'c'}
  const registerRes = await request(app).post('/api/auth').send(logoutUser);
  const token = registerRes.body.token;

  const logoutRes = await request(app).delete('/api/auth').set('Authorization', `Bearer ${token}`);
  expect(logoutRes.status).toBe(200);
  expect(logoutRes.body.message).toBe("logout successful");

  const meRes = await request(app).get('/api/user/me').set('Authorization', `Bearer ${token}`);
  expect(meRes.status).toBe(401);
});
