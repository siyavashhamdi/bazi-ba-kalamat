import { TelegramCommands } from '../enum';
import { TelegramBotOptions } from '../type';
import * as TelegramBot from 'node-telegram-bot-api';
import { Utils } from './utils';

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
    this.telegramBot.onText((msg: any) => {
      Utils.consoleLog(`message received: ${ JSON.stringify(msg) }`);

      const chatId = msg.chat.id;
      const isCommandMode = msg[0] === '/';
      const helpText = `کافیست برای دریافت کلمات از فرمان /تولید با فرمت زیر استفاده شود:
/تولید {حروف به هم چسبیده} {تعداد حروف کلمات خروجی}

برای مثال:
/تولید ابپتثج ۵

با اینکار، کلمات ۵ حرفی متشکل از حروف 'ا'، 'ب'، 'پ'، 'ت'، 'ث' و 'ج' برگشت داده خواهد شد.
`;

      if (!isCommandMode) {
        this.sendMessage(chatId, `لطفن برای ارسال فرمان، از کاراکتر / پیش از متن فرمان استفاده شود.\n${ helpText }`);

        return;
      }

      const command = msg as TelegramCommands;

      switch (command) {
        case TelegramCommands.start:
          this.sendMessage(chatId, `${ msg?.chat?.first_name } عزیز؛\nبه بات تولید کلمه خوش آمدید.\n\n${ helpText }`);
          break;

        case TelegramCommands.hello:
          this.sendMessage(chatId, `سلام ${ msg?.chat?.first_name } عزیز`);
          break;

        case TelegramCommands.id:
          const resp = `شناسه چت شما: ${ chatId }`;

          this.sendMessage(chatId, resp);
          break;

        case TelegramCommands.generate:
          break;

        default:
          this.sendMessage(chatId, `فرمان وارد شده معتبر نیست!\n\n${ helpText }`);
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
