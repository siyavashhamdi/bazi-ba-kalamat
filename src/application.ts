import { Utils, Telegram } from './helper';

export async function bootstrap() {
  Utils.consoleLog('Application started');

  const telegram = new Telegram({ token: process.env.TLG_API_TOKEN || '' });

  telegram.startListening();
}
