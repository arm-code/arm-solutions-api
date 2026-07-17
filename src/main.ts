import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Configuración de CORS estricto
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.error(`Origen bloqueado por CORS: ${origin}`);
        callback(new Error('No permitido por políticas de CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 2. Tipado Estricto y Validación Global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Remueve propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // Lanza un error si envían propiedades no permitidas
      transform: true,            // Transforma los payloads a los tipos de los DTOs
    }),
  );

  // Prefijo global para la API
  app.setGlobalPrefix('api/v1');

  // 3. Configuración de OpenAPI (Swagger) y Renderizado con Scalar
  const config = new DocumentBuilder()
    .setTitle('ARM Solutions API')
    .setDescription('API central de herramientas personales y gestión de negocios')
    .setVersion('1.0')
    .addBearerAuth() // Para cuando integres la autenticación de Supabase
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Montamos Scalar en la ruta /docs
  app.use(
    '/docs',
    apiReference({
      spec: {
        content: document,
      },
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Aplicación corriendo en: http://localhost:${port}/api/v1`);
  logger.log(`Documentación (Scalar) disponible en: http://localhost:${port}/docs`);
}
bootstrap();