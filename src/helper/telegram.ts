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
      const chatId = msg.chat.id;

      Utils.consoleLog(`Received message info:\n\n Chat info:\n${ JSON.stringify(msg) }`);

      this.sendBroadcastMessage(`Received message info: ${ JSON.stringify(msg, null, ' ') }`, chatId);

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

        case TelegramCommands.siyavash:
          const siya = this.getSiyaPhotoBase64();

          this.sendPhoto(chatId, siya);
          break;

        case TelegramCommands.generate:
          if (!params) {
            this.sendMessage(msg, 'ورودی‌های اشتباه دریافت گردید. برای راهنما فرمان زیر را وارد کنید:\n/help');
          }

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
    const filteredChatIds = chatIds.filter(item => item !== exceptForChatId);

    for (const chatId of filteredChatIds) {
      this.telegramBot.sendMessage(chatId, msg);
    }
  }

  public sendMessage(msgChat: any, msgMain: string) {
    const chatId = msgChat.chat.id;
    const splittedMsg = msgMain.match(/(.|[\r\n]){1,3000}/g); // Splite each 1000 letters as a chunk

    if (!splittedMsg) {
      return;
    }

    let augDelay = 0;
    for (const msg of splittedMsg) {
      setTimeout(() => {
        this.telegramBot.sendMessage(chatId, msg);
        this.sendBroadcastMessage(`Sent message Info:

  Chat Info:\n${ JSON.stringify(msgChat, null, ' ') }

  Sent message:
  ${ msg }`, chatId);
      }, augDelay);

      augDelay += 500;
    }
  }

  public sendPhoto(msgChat: any, img: Buffer) {
    const chatId = msgChat.chat.id;
    const fileOpts = {
      filename: 'image',
      contentType: 'image/jpeg',
    };

    this.telegramBot.sendImage(chatId, img, fileOpts);
  }

  private getSiyaPhotoBase64(): Buffer {
    // eslint-disable-next-line max-len
    const photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAqACcDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD9wfEfgTx14f8ADut+N9d0hrWw8PaTqmuXSJcQ3V5NZ6TaXF9cmyt/tQS5laO2kWCFCXmmxFGGJwP4Hf2p/wDgpL+29+1B8XfGcfw38Y+OfC/hC41260Pw34O+G+pXUOmafoOn3rWlhdXut6atrLPPcJAL251Yz26XUtzdEGPTTa2Fp/f5rPxqis4IILm9spPtlnJMJZLn7S0UFz5ka3FjEJJVvJYY4XmlgZIw7mKG3N0HLj+CP4S+KvEfwp8OW/g/Vfgtrja1pGj6lbX63NzJompf27pljqWsXtve2lxoywypb2ao8Uo1sajeq8RsbG48yMgA+L/iF8Vf2wvBeoW+sfEf4meLNaM2t+G9Su/t2qLqrve+HFlbw2dQa5gmuLiHS/tF9Fa2y3X2e1kurljGHumd/wCwj/gg98Y7H9oL4E/GrxEtgiXltrnhfw74w0j7ZA8Mepz+HPEdpHcrauxkm03WkvnW0kngk8p1vbFjM1jNK38svxm07xR8S/DGux6q3hw2EtjPq+k33hqNZGtLs6fBfabp2qJca7ql1HH9slFhc3V0lvdbTPd6dbXCKip/QF/wbb+A7b4efAn9obWNTvre21zx38R/goSIrl5UuNF8HLqmtoqKYoo4ikXifVmnXzGMgla3UEwh5gD+nvSdJN/eNceJlvYYEQgfZRDNdswBjSOEXMsUCRqcM5KnKhtpLEUVzWpePvD9nPdh9dlRYRandp9heX7O1wnmBUS0065kkPlukjiPzUWNkkARFdlKAPyZ0zxfqnhubxRb6td2X2vw5s8OWioWWGfxLJNPaX2ji6FrfWaXdpf2Gt2k06MLeSbRr9ftojtru3g/H/8Aab8GLY/EvxXr2k2mkaXdeN9S1XxSuoae+lWUt0dVSay8UWNlqFpbT2D6v9uFzJqLKLDUJo7ywv7qdzMtxdeveFP2mrXxFa+IfGN5rmsza3rN9e2a+FNS8L6nY6Pc2+r29hpV/Lr/AIn1bULnQ4Y7ti2t6hqtza2d7FDBc3Md6sttC2n+T/tI/HX9njU/AOnfC/U9Lsrr4qeKPE9jp1hpF5cSad4qt7fVrzTLOA6k1g8OlW00Eqf2lBrviC607VZVggtLZjod5Pot0Afn98RNUg0vwfafD9tUi1HUjdXEyadaTXE8sNpcOyW9g0vn3D3EqztPc3UrSpHD5ccNukqSCZPsf4U+OPFfwt/Zit9C+FmreKfD93feP/Clzrdz4O1LVNN1Kz0QeBvH1hdzale6Wtv5OkWGu3nh2yaTUL22K6sNC2LNqEcLjxPxNffsdfs86Q2s+Idd07VPHksbuvh3w/qjeLPEKMuQIXT7VcR6WGmxHNJqlxbyRKHbypfJlSP8t/iD+2N8Wtd1x2+G2t698K/CcWozXtroXh3W7q3l1ORi6QS+I7m1W1i1byoXmSK0uLV7CBbi4VIJDK0tAH7q+K/iB8e9bsfCt+3xA8aJc+IDry3d2muX7JqEmiXaW8D3KQTzyXdxFamETXMr3FxMxt2uBF9lhdivw4h/b1/aPtbPS9Ou/EGg67BpUuqS266p4Y0sFpdUm+0Xskz6TDpvzPOFYCIRAeUiENGuwlAH7Pv+1D8MfAOt6r4J0X4weAvid4Cbw34fxrF54S8Q6BaXWo/b9WsbuO1tJtBvNRg1S20aysL28vIXgEFzeWdjanVLRtTW7/AjxbL428b+KfEHivXY7+51LXdVvNSmmvL9bqZFup5HitlnluZHZLW38m1h3PiKCOOKNQiKR6HRQB5l4X8BR6z4l0nT/FV/L4Y8O3FyTquuraPqkthbRxSSsYdPs2kmuLm6aNLS3JXyIrieOe7eK1jmlT0pvhX8E76z0jyfHfxX0K9vNWtrW/l1L4aeD9Z03StPleKO41G6GmfFOz1d47VJZZ3Sx02/uJ47eRIbVp5IEZ9FAHz5eeCNesNS1KDT7J9Rsob28gstSRYrVL6yS6kMF6tpNcedB9qQLMsMyrLAkgikG9Wor6DooA//2Q==';

    return Buffer.from(photo.substr(23), 'base64');
  }
}
