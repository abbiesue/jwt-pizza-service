const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

//global variables
let testAdmin;
let testDiner;
let testMenu;

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

beforeAll(async () => {
    testAdmin = await createAdminUser();
    testDiner = await registerUser();
    testMenu = await DB.addMenuItem({ title: randomName(), description: 'test pizza', image: 'pizza9.png', price: 0.05 });
});

//GET /api/order/menu tests
test('getMenu', async () => {
    const getRes = await request(app).get('/api/order/menu');
    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
    expect(getRes.body.some((item) => item.id === testMenu.id)).toBe(true);
});

//PUT /api/order/menu tests
test('putAsAdmin', async () => {

});

test('putAsDiner', async () => {

});

//POST /api/order tests
test('validPostOrder', async () => {

});

test('invalidPostOrder', async () => {

});

//GET /api/order tests
test('validGetOrders', async () => {

});

test('invalidGetOrders', async () => {

});