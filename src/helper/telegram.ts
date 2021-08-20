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
    this.telegramBot.onText(/(.+)/, (msg: any, match: any) => {
      Utils.consoleLog(`message received: ${ JSON.stringify(msg) } | match: ${ match[0] }`);

      const chatId = msg.chat.id;
      const isCommandMode = match[0][0] === '/';

      const helpText = `کافیست برای دریافت واژه‌ها از فرمان generate/ با فرمت زیر استفاده شود:
/generate {لیست حرف‌ها}-{تعداد حرف‌های خروجی}

برای مثال:
/generate ۵-ابپتثج
با اینکار، واژه‌های ۵ حرفی متشکل از حرف‌های 'ا'، 'ب'، 'پ'، 'ت'، 'ث' و 'ج' برگشت داده خواهد شد.
`;

      if (!isCommandMode) {
        this.sendMessage(chatId, `برای کار با بات نیاز است تا فرمان ارسال کنید!\n
لطفن برای ارسال فرمان، از کاراکتر / پیش از متن فرمان استفاده شود.\n${ helpText }`);

        return;
      }

      const msgSplitted: Array<string> = match[0].substring(1).split(' ');
      const command = msgSplitted[0] as TelegramCommands;
      const params = msgSplitted[1];

      Utils.consoleLog(`${ command }|${ params }`);

      switch (command) {
        case TelegramCommands.start:
          this.sendMessage(chatId, `${ msg?.chat?.first_name } عزیز؛\nبه بات تولید واژه خوش آمدید.\n\n${ helpText }`);
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
          const paramNumOfLetters = Utils.ConvertPersianNum2Latin(paramsSplitted[0]);
          const paramLetters = paramsSplitted[1];

          if (!paramNumOfLetters || !paramLetters) {
            this.sendMessage(chatId, 'ورودی‌های اشتباه دریافت گردید. برای راهنما فرمان زیر را وارد کنید:/help');
          }

          const foundRes = Utils.generateLetters(paramNumOfLetters, paramLetters.split(''));
          const respMsg = `«جستجوی واژه‌های ${ paramNumOfLetters } حرفی برای حرف‌های ${ paramLetters.split('').join('-') }»

تعداد واژه‌های یافت‌شده: ${ foundRes.length } عدد

لیست واژه‌ها:\n${ foundRes.length ? foundRes.join(', ') : 'واژه‌ای یافت نگردید.' }

نکته: در واژه‌های یافت‌شده ممکن است کلمات نامتعارف نیز یافت شود!`;

          this.sendMessage(chatId, respMsg);
          break;

        default:
          this.sendMessage(chatId, `فرمان وارد شده معتبر نیست!\n\n${ helpText } `);
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
