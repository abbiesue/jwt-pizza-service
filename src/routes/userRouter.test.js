const request = require('supertest');
const app = require('../service');
const { Role, DB } = require('../database/database.js');

//place for global variables

async function createAdminUser() {
  let user = { password: 'toomanysecrets', roles: [{ role: Role.Admin }] };
  user.name = randomName();
  user.email = user.name + '@admin.com';

  user = await DB.addUser(user);
  return { ...user, password: 'toomanysecrets' };
}

//GET /api/user/me tests
test('validGetUser', async () => {

});

//PUT /api/user/:userId tests 
test('validPutUser', async () => {
    
});
