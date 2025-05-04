import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingMiddleware } from './logging.middleware';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply logging middleware to all routes
  app.use(new LoggingMiddleware().use);

  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Qdrant LTMs Experiment')
    .setDescription('The Qdrant LTMs Experiment API description')
    .setVersion('1.0')
    .addTag('llm')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory, {
    jsonDocumentUrl: 'api/openapi.json',
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
