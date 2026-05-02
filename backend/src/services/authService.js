const { createUser, findUserByIdentifier } = require('./usersService');

async function loginOrCreateUser(data) {
  try {
    const user = await findUserByIdentifier(data);

    if (user) {
      return user;
    }

    return createUser(data);
  } catch (error) {
    console.error('🔴 loginOrCreateUser 错误:', error);
    throw error;
  }
}

module.exports = {
  loginOrCreateUser
};
