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

afterEach(() => {
    jest.restoreAllMocks();
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
    const newItem = { title: randomName(), description: 'added by admin', image: 'pizza8.png', price: 0.0001 };
    const addRes = await request(app)
        .put('/api/order/menu')
        .set('Authorization', `Bearer ${testAdmin.token}`)
        .send(newItem);

    expect(addRes.status).toBe(200);
    expect(addRes.body.some((item) => item.title === newItem.title)).toBe(true);
});

test('putAsDiner', async () => {
    const newItem = { title: randomName(), description: 'added by diner', image: 'pizza8.png', price: 0.0001 };
    const addRes = await request(app)
        .put('/api/order/menu')
        .set('Authorization', `Bearer ${testDiner.token}`)
        .send(newItem);

    expect(addRes.status).toBe(403);
    expect(addRes.body.message).toBe('unable to add menu item');
});

//POST /api/order tests
test('validPostOrder', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => ({ jwt: 'factory.jwt.token', reportUrl: 'http://factory.test/report' }),
    });

    const orderReq = { franchiseId: 1, storeId: 1, items: [{ menuId: testMenu.id, description: testMenu.title, price: 0.05 }] };
    const orderRes = await request(app)
        .post('/api/order')
        .set('Authorization', `Bearer ${testDiner.token}`)
        .send(orderReq);

    expect(orderRes.status).toBe(200);
    expect(orderRes.body.jwt).toBe('factory.jwt.token');
    expect(orderRes.body.followLinkToEndChaos).toBe('http://factory.test/report');
    expect(orderRes.body.order).toMatchObject({ franchiseId: 1, storeId: 1 });
    expect(orderRes.body.order.id).toBeDefined();
});

test('invalidPostOrder', async () => {

});

//GET /api/order tests
test('validGetOrders', async () => {

});

test('invalidGetOrders', async () => {

});