import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EventsModule } from './modules/events/events.module';
import { PaymentMethodsModule } from './modules/payment-methods/payment-methods.module';
import { TransactionsModule } from './modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que el .env esté disponible en todo el proyecto
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        schema: 'armsolutions',
        autoLoadEntities: true,
        synchronize: false, // ¡Falso en producción! Usaremos migraciones.
        ssl: {
          rejectUnauthorized: false, // Requerido para conexiones seguras con Supabase
        },
      }),
    }),

    // Autenticación (global, expone SupabaseAuthGuard a toda la app)
    AuthModule,

    // Módulos de negocio (feature: finanzas, ex-business.xlsx)
    PaymentMethodsModule,
    CategoriesModule,
    EventsModule,
    TransactionsModule,
    DashboardModule,
  ],
  providers: [
    // Envuelve TODAS las respuestas exitosas en { success, message, data }
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // Captura TODAS las excepciones y responde en el mismo formato estándar
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
