import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Rank Everything API')
    .setDescription('The Asset Rating Platform API documentation')
    .setVersion('1.0')
    .addTag('assets')
    .addTag('tenants')
    .addTag('users')
    .addTag('evaluations')
    .addTag('templates')
    .addTag('ai')
    .addTag('reports')
    .addTag('prompts')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}

void bootstrap();
