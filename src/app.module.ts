import { Module } from '@nestjs/common';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/db.config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { StoredProcedureLoader } from 'database/load.procedure';
@Module({
  imports: [
    RedisModule.forRoot({
      type: 'single',
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(typeOrmConfig),
    UsersModule,
  ],
  providers: process.env.NODE_ENV == 'production' ? [StoredProcedureLoader] : [],
})
export class AppModule {}
