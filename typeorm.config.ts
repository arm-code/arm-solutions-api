import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config(); // Carga el .env

export default new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    schema: 'armsolutions',
    entities: ['dist/src/**/*.entity{.ts,.js}'],
    migrations: ['dist/src/migrations/*{.ts,.js}'],
    // SSL solo cuando la base lo requiere (Supabase). Postgres local: DB_SSL=false
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
});