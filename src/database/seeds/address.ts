import { Address } from '../../../src/entities/addresses.entity';
import { DataSource } from 'typeorm';

export default class AddressSeeder {
  public static async run(dataSource: DataSource) {
    const repo = dataSource.getRepository(Address);

    const defaultAddresses = [
      {
        street: 'Jalan Merdeka 10',
        city: 'Jakarta',
        postalCode: '10110',
      },
      {
        street: 'Jalan Asia Afrika 22',
        city: 'Bandung',
        postalCode: '40111',
      },
      {
        street: 'Jalan Sudirman 55',
        city: 'Medan',
        postalCode: '20111',
      },
    ];

    for (const addr of defaultAddresses) {
      const exists = await repo.findOne({
        where: {
          street: addr.street,
          city: addr.city,
        },
      });

      if (!exists) {
        await repo.save(repo.create(addr));
      }
    }

    console.log('Addresses seeding complete');
  }
}
