const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

//global variables
let testAdmin;
let testFranchisee;
let testFranchise;
let testDiner;

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
    testFranchisee = await registerUser();
    testFranchise = await DB.createFranchise({ name: randomName(), admins: [{ email: testFranchisee.email }] });
});

//GET /api/franchise tests
test('getFranchisesWithoutToken', async () => {

});
 
test('getFranchisesByName', async () => {

});
 
test('getFranchisesAsAdmin', async () => {

});

//POST /api/franchise tests
test('validPostFranchise', async () => {

});
 
test('postFranchiseAsDiner', async () => {
    
});
 
test('postFranchiseUnknownAdmin', async () => {
    
});

//GET /api/franchise/:userId tests
test('getOwnFranchises', async () => {

});
 
test('getOwnFranchisesWithNone', async () => {
    
});
 
test('getOtherUserFranchisesAsDiner', async () => {
    
});
 
test('getUserFranchisesAsAdmin', async () => {
    
});
 
test('getUserFranchisesWithoutToken', async () => {
    
});

//POST /api/franchise/:franchiseId/store tests
test('postStoreAsAdmin', async () => {
    
});
 
test('postStoreAsFranchisee', async () => {

});
 
test('postStoreAsDiner', async () => {

});

//DELETE /api/franchise/:franchiseId/store/:storeId tests

//DELETE /api/franchise/:franchiseId tests