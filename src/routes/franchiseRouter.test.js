const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

//global variables
let testAdmin;
let testFranchisee;
let testFranchise;
let testDiner;
const createdFranchiseIds = [];

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

async function createFranchise() {
    const franchise = await DB.createFranchise({ name: randomName(), admins: [{ email: testFranchisee.email }] });
    createdFranchiseIds.push(franchise.id);
    return franchise;
}

beforeAll(async () => {
    testAdmin = await createAdminUser();
    testDiner = await registerUser();
    testFranchisee = await registerUser();
    testFranchise = await createFranchise();
});

afterAll(async () => {
    for (const id of createdFranchiseIds) {
        await DB.deleteFranchise(id);
    }
});

//GET /api/franchise tests
test('getFranchisesWithoutToken', async () => {
    const getRes = await request(app).get('/api/franchise');
 
    expect(getRes.status).toBe(200);
    expect(Array.isArray(getRes.body.franchises)).toBe(true);
    expect(typeof getRes.body.more).toBe('boolean');
});
 
test('getFranchisesByName', async () => {
    const getRes = await request(app).get('/api/franchise').query({ name: testFranchise.name });
 
    expect(getRes.status).toBe(200);
    expect(getRes.body.franchises).toHaveLength(1);
    expect(getRes.body.franchises[0]).toMatchObject({ id: testFranchise.id, name: testFranchise.name });
    expect(Array.isArray(getRes.body.franchises[0].stores)).toBe(true);
});
 
test('getFranchisesAsAdmin', async () => {
    const getRes = await request(app)
        .get('/api/franchise')
        .query({ name: testFranchise.name })
        .set('Authorization', `Bearer ${testAdmin.token}`);
 
    expect(getRes.status).toBe(200);
    expect(getRes.body.franchises).toHaveLength(1);
    expect(getRes.body.franchises[0].admins).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: testFranchisee.id, email: testFranchisee.email })])
    );
    expect(Array.isArray(getRes.body.franchises[0].stores)).toBe(true);
});

//POST /api/franchise tests
test('validPostFranchise', async () => {
    const newFranchise = { name: randomName(), admins: [{ email: testFranchisee.email }] };
    const postRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${testAdmin.token}`)
        .send(newFranchise);
 
    expect(postRes.status).toBe(200);
    expect(postRes.body).toMatchObject({ name: newFranchise.name, admins: [{ email: testFranchisee.email, id: testFranchisee.id }] });
    expect(postRes.body.id).toBeDefined();
    createdFranchiseIds.push(postRes.body.id);
});
 
test('postFranchiseAsDiner', async () => {
    const postRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${testDiner.token}`)
        .send({ name: randomName(), admins: [{ email: testDiner.email }] });
 
    expect(postRes.status).toBe(403);
    expect(postRes.body.message).toBe('unable to create a franchise');
});
 
test('postFranchiseUnknownAdmin', async () => {
    const postRes = await request(app)
        .post('/api/franchise')
        .set('Authorization', `Bearer ${testAdmin.token}`)
        .send({ name: randomName(), admins: [{ email: randomEmail() }] });
 
    expect(postRes.status).toBe(404);
    expect(postRes.body.message).toContain('unknown user for franchise admin');
});

//GET /api/franchise/:userId tests
test('getOwnFranchises', async () => {
    const getRes = await request(app)
        .get(`/api/franchise/${testFranchisee.id}`)
        .set('Authorization', `Bearer ${testFranchisee.token}`);
 
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: testFranchise.id, name: testFranchise.name })]));
});
 
test('getUserFranchisesAsAdmin', async () => {
    const getRes = await request(app)
        .get(`/api/franchise/${testFranchisee.id}`)
        .set('Authorization', `Bearer ${testAdmin.token}`);
 
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: testFranchise.id })]));
});

//POST /api/franchise/:franchiseId/store tests
test('postStoreAsAdmin', async () => {
    const postRes = await request(app)
        .post(`/api/franchise/${testFranchise.id}/store`)
        .set('Authorization', `Bearer ${testAdmin.token}`)
        .send({ name: randomName() });
 
    expect(postRes.status).toBe(200);
    expect(postRes.body).toMatchObject({ franchiseId: testFranchise.id });
    expect(postRes.body.id).toBeDefined();
});
 
test('postStoreAsFranchisee', async () => {
    const storeName = randomName();
    const postRes = await request(app)
        .post(`/api/franchise/${testFranchise.id}/store`)
        .set('Authorization', `Bearer ${testFranchisee.token}`)
        .send({ name: storeName });
 
    expect(postRes.status).toBe(200);
    expect(postRes.body).toMatchObject({ franchiseId: testFranchise.id, name: storeName });
});
 
test('postStoreAsDiner', async () => {
    const postRes = await request(app)
        .post(`/api/franchise/${testFranchise.id}/store`)
        .set('Authorization', `Bearer ${testDiner.token}`)
        .send({ name: randomName() });
 
    expect(postRes.status).toBe(403);
    expect(postRes.body.message).toBe('unable to create a store');

});

//DELETE /api/franchise/:franchiseId/store/:storeId tests
test('deleteStoreAsAdmin', async () => {

});
 
test('deleteStoreAsDiner', async () => {

});

//DELETE /api/franchise/:franchiseId tests
test('validDeleteFranchise', async () => {

});
