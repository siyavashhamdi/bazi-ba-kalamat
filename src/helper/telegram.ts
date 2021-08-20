import { TelegramCommands } from '../enum';
import { TelegramBotOptions } from '../type';
import * as TelegramBot from 'node-telegram-bot-api';
import { Utils } from './utils';
import { words2 } from '../constant';

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
    this.telegramBot.onText(/(.+)/, (msg: any, match: any) => {
      Utils.consoleLog(`message received: ${ JSON.stringify(msg) } | match: ${ match[0] }`);

      const chatId = msg.chat.id;
      const isCommandMode = match[0][0] === '/';

      const helpText = `کافیست برای دریافت کلمات از فرمان generate/ با فرمت زیر استفاده شود:
/generate {تعداد حروف کلمات خروجی}-{حروف به هم چسبیده}

برای مثال:
/generate ۵-ابپتثج

با اینکار، کلمات ۵ حرفی متشکل از حروف 'ا'، 'ب'، 'پ'، 'ت'، 'ث' و 'ج' برگشت داده خواهد شد.
`;

      if (!isCommandMode) {
        this.sendMessage(chatId, `لطفن برای ارسال فرمان، از کاراکتر / پیش از متن فرمان استفاده شود.\n${ helpText }`);

        return;
      }

      const msgSplitted = match[0].substring(1).split(' ');
      const command = msgSplitted[0] as TelegramCommands;
      const params = msgSplitted[1];

      Utils.consoleLog(`${ command }|${ params }`);

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

        case TelegramCommands.help:
          this.sendMessage(chatId, helpText);
          break;

        case TelegramCommands.generate:
          const paramsSplitted = params.split('-');
          const numOfLetters = paramsSplitted[0];
          const letters = paramsSplitted[1];

          this.sendMessage(chatId, `numOfLetters: ${ numOfLetters } | letters: ${ letters } | words2: ${ JSON.stringify(words2) }`);
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
