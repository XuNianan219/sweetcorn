const { createUser, findUserByIdentifier } = require('./usersService');

async function loginOrCreateUser(data) {
  const user = await findUserByIdentifier(data);

  if (user) {
    return user;
  }

  return createUser(data);
}

module.exports = {
  loginOrCreateUser
};
