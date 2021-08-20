import { TelegramCommands } from '../enum';
import { TelegramBotOptions } from '../type';
import * as TelegramBot from 'node-telegram-bot-api';

export class Telegram {
  constructor(options: TelegramBotOptions) {
    if (options.token === '') {
      throw new Error('No token found for Telegram Bot in config env file');
    }

    this.options = { ...options };
    this.telegramBot = new TelegramBot(this.options.token, { polling: true });
  }

  private telegramBot: any;

  private options: TelegramBotOptions;

  public startListening(): void {
    this.telegramBot.onText(/\/(.+)/, (msg: any, match: any) => {
      const command = match[1] as TelegramCommands;
      const chatId = msg.chat.id;

      switch (command) {
        case TelegramCommands.start:
          this.sendMessage(chatId, `Dear ${ msg.first_name }\nWelcome to the Siyavas's bot`);
          break;

        case TelegramCommands.hello:
          this.sendMessage(chatId, `Hello ${ msg.first_name }`);
          break;

        case TelegramCommands.id:
          const resp = `Your chat id is: ${ chatId }`;

          this.sendMessage(chatId, resp);
          break;

        case TelegramCommands.generate:
          break;

        default:
          this.sendMessage(chatId, 'Command is not valid!');
          break;
      }
    });
  }

  public sendBroadcastMessage(msg: string) {
    const chatIds = process.env.TLG_CHAT_IDS?.split(',').map(item => +item) ?? [];

    for (const chatId of chatIds) {
      this.sendMessage(chatId, msg);
    }
  }

  public sendMessage(chatId: number, msg: string) {
    this.telegramBot.sendMessage(chatId, msg);
  }
}
