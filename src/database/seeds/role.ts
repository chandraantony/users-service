import { Role } from '../../../src/entities/role.entity';
import { DataSource } from 'typeorm';

export default class RoleSeeder {
  public static async run(dataSource: DataSource) {
    const repo = dataSource.getRepository(Role);

    const defaultRoles = [{ name: 'admin' }, { name: 'user' }, { name: 'manager' }];

    for (const role of defaultRoles) {
      const exists = await repo.findOne({ where: { name: role.name } });
      if (!exists) {
        await repo.save(repo.create(role));
      }
    }

    console.log('Roles seeding complete');
  }
}
