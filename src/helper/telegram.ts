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
      Utils.consoleLog(`Received message info: ${ JSON.stringify(msg) }`);

      if (!paramNumOfLetters || !paramLetters) {
        this.sendMessage(msg, 'ورودی‌های اشتباه دریافت گردید. برای راهنما فرمان زیر را وارد کنید:\n/help');
      } y

      const isCommandMode = match[0][0] === '/';

      const helpText = `کافیست برای دریافت واژه‌ها از فرمان generate/ با فرمت زیر استفاده شود:
/generate {لیست حرف‌ها}-{تعداد حرف‌های خروجی}

برای مثال:
/generate ۵-ابپتثج
با اینکار، واژه‌های ۵ حرفی متشکل از حرف‌های 'ا'، 'ب'، 'پ'، 'ت'، 'ث' و 'ج' برگشت داده خواهد شد.
`;

      if (!isCommandMode) {
        this.sendMessage(msg, `برای کار با بات نیاز است تا فرمان ارسال کنید!\n
لطفن برای ارسال فرمان، از کاراکتر / پیش از متن فرمان استفاده شود.\n${ helpText }`);

        return;
      }

      const msgSplitted: Array<string> = match[0].substring(1).split(' ');
      const command = msgSplitted[0] as TelegramCommands;
      const params = msgSplitted[1];

      if (!params) {
        this.sendMessage(msg, 'ورودی‌های اشتباه دریافت گردید. برای راهنما فرمان زیر را وارد کنید:\n/help');
      }

      switch (command) {
        case TelegramCommands.start:
          this.sendMessage(msg, `${ msg?.chat?.first_name } عزیز؛\nبه بات تولید واژه خوش آمدید.\n\n${ helpText }`);
          break;

        case TelegramCommands.hello:
          this.sendMessage(msg, `سلام ${ msg?.chat?.first_name } عزیز`);
          break;

        case TelegramCommands.id:
          const resp = `شناسه چت شما: ${ msg }`;

          this.sendMessage(msg, resp);
          break;

        case TelegramCommands.help:
          this.sendMessage(msg, helpText);
          break;

        case TelegramCommands.generate:
          const paramsSplitted = params.split('-');
          const paramNumOfLetters = Utils.ConvertPersianNum2Latin(paramsSplitted[0]);
          const paramLetters = paramsSplitted[1];

          if (!paramNumOfLetters || !paramLetters) {
            this.sendMessage(msg, 'ورودی‌های اشتباه دریافت گردید. برای راهنما فرمان زیر را وارد کنید:\n/help');
          }

          const foundRes = Utils.generateLetters(paramNumOfLetters, paramLetters.split(''));
          const respMsg = `«جستجوی واژه‌های ${ paramNumOfLetters } حرفی برای حرف‌های ${ paramLetters.split('').join('-') }»

تعداد واژه‌های یافت‌شده: ${ foundRes.length } عدد

لیست واژه‌ها:\n${ foundRes.length ? foundRes.join(', ') : 'واژه‌ای یافت نگردید.' }

نکته: در واژه‌های یافت‌شده ممکن است کلمات نامتعارف نیز دیده شود!`;

          this.sendMessage(msg, respMsg);
          break;

        default:
          this.sendMessage(msg, `فرمان وارد شده معتبر نیست!\n\n${ helpText } `);
          break;
      }
    });
  }

  public sendBroadcastMessage(msg: string, exceptForChatId?: number) {
    const chatIds = process.env.TLG_CHAT_IDS?.split(',').map(item => +item) ?? [];

    for (const chatId of chatIds.filter(item => item !== exceptForChatId)) {
      this.sendMessage(chatId, msg);
    }
  }

  public sendMessage(msgChat: any, msg: string) {
    const chatId = msgChat.chat.id;

    this.telegramBot.sendMessage(chatId, msg);
    this.sendBroadcastMessage(`${ JSON.stringify(msgChat, null, ' ') }\n\n${ msg }`);
  }
}
