const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

//global variables

//helper functions
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

//GET /api/order/menu tests

//PUT /api/order/menu tests

//GET /api/order tests

//POST /api/order tests