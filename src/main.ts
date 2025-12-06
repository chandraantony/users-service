import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { User } from '@entities/user.entity';
import { Role } from '@entities/role.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const result = errors.map((error) => ({
          property: error.property,
          message: Object.values(error.constraints || {})[0],
        }));
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: result,
        });
      },
    })
  );

  const config = new DocumentBuilder()
    .setTitle('Users API')
    .setDescription('API for managing users')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [User, Role],
  });

  SwaggerModule.setup('api/docs', app, document);
  await app.listen(process.env.PORT || 3000);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
