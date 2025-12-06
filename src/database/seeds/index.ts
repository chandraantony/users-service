import { DataSource, DataSourceOptions } from 'typeorm';
import RoleSeeder from './role';
import AddressSeeder from './address';
import { typeOrmConfig } from '../../../src/config/db.config';

async function runSeeders() {
  const dataSource = new DataSource(typeOrmConfig as DataSourceOptions);
  await dataSource.initialize();

  console.log('Seeding...');

  await RoleSeeder.run(dataSource);
  await AddressSeeder.run(dataSource);

  console.log('Seeding Finished');
  await dataSource.destroy();
}

runSeeders().catch((err) => {
  console.error(err);
  process.exit(1);
});
