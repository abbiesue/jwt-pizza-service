const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

//place for global variables
let testAdmin;
let testDiner;
let secondTestDiner;

async function createAdminUser() {
    let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
    user.name = randomName();
    user.email = user.name + '@admin.com';

    user = await DB.addUser(user);
    const loginRes = await request(app).put('/api/auth').send({ email: user.email, password: 'toomanysecrets' });
    return { ...user, password: 'toomanysecrets', token: loginRes.body.token };
}

function randomName() {
    return Math.random().toString(36).substring(2, 12);
}

function randomEmail() {
    return Math.random().toString(36).substring(2, 12) + '@test.com';
}

async function registerUser() {
    const user = {name: randomName(), email: randomEmail(), password: 'a'};
    const registerRes = await request(app).post('/api/auth').send(user);
    return { ...registerRes.body.user, password: user.password, token: registerRes.body.token };
}

function expectValidJwt(potentialJwt) {
  expect(potentialJwt).toMatch(/^[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*\.[a-zA-Z0-9\-_]*$/);
}

beforeAll(async () => {
    testAdmin = await createAdminUser();
    testDiner = await registerUser();
    secondTestDiner = await registerUser();
});

//GET /api/user/me tests
test('validGetUser', async () => {
    const getRes = await request(app).get('/api/user/me').set('Authorization', `Bearer ${testDiner.token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body).toMatchObject({ id: testDiner.id, name: testDiner.name, email: testDiner.email, roles: [{ role: 'diner' }] });
});

test ('getUserWithoutToken', async () => {
    const getRes = await request(app).get('/api/user/me');
    expect(getRes.status).toBe(401);
    expect(getRes.body.message).toBe('unauthorized');
});

//PUT /api/user/:userId tests 
test('validPutUser', async () => {
    const updateRes = await request(app)
        .put(`/api/user/${testDiner.id}`)
        .set('Authorization', `Bearer ${testDiner.token}`)
        .send({name: 'renamed diner', email: testDiner.email, password: testDiner.password});

    expect(updateRes.status).toBe(200); 
    expectValidJwt(updateRes.body.token);
    expect(updateRes.body.user).toMatchObject({ id: testDiner.id, name: 'renamed diner', email: testDiner.email });
});

test('invalidPutUser', async () => {
    const updateRes = await request(app)
        .put(`/api/user/${testDiner.id}`)
        .set('Authorization', `Bearer ${secondTestDiner.token}`)
        .send({name: 'renamed diner', email: testDiner.email, password: testDiner.password});

    expect(updateRes.status).toBe(403);
    expect(updateRes.body.message).toBe('unauthorized');
}); 

test('adminPutUser', async () => {
    const updateRes = await request(app)
        .put(`/api/user/${testDiner.id}`)
        .set('Authorization', `Bearer ${testAdmin.token}`)
        .send({name: 'admin renamed diner', email: testDiner.email, password: testDiner.password});

    expect(updateRes.status).toBe(200); 
    expectValidJwt(updateRes.body.token);
    expect(updateRes.body.user).toMatchObject({ id: testDiner.id, name: 'admin renamed diner', email: testDiner.email });
});
