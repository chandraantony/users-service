import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { readdirSync, readFileSync } from 'fs';
import path, { join } from 'path';

@Injectable()
export class StoredProcedureLoader implements OnModuleInit {
  private readonly logger = new Logger(StoredProcedureLoader.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    const proceduresPath = path.join(__dirname, 'procedures');

    this.logger.log(`Loading stored procedures from: ${proceduresPath}`);

    const files = readdirSync(proceduresPath).filter((f) => f.endsWith('.sql'));

    for (const file of files) {
      try {
        const filePath = join(proceduresPath, file);
        const sql = readFileSync(filePath, 'utf8');

        this.logger.log(`Executing: ${file}`);
        await this.dataSource.query(sql);
      } catch (err) {
        this.logger.error(`Error loading stored procedure file: ${file}`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.error(err.message);
      }
    }

    this.logger.log(`Stored Procedure loaded successfully.`);
  }
}
