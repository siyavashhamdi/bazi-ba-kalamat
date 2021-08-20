import { config } from 'dotenv';
import { bootstrap } from './application';

config({ path: 'src/config/.env' });

bootstrap();
