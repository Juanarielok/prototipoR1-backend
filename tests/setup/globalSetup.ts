import testSequelize from './testDatabase';

// Import models barrel to trigger model registration on the test sequelize instance
import '../../src/models';

beforeAll(async () => {
  await testSequelize.sync({ force: true });
});

afterAll(async () => {
  await testSequelize.close();
});
