import * as moment from 'moment-timezone';
import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { exec } from 'child_process';
import wordsA from '../constant';

export class Utils {
  public static zeroPad = (num: unknown, places: number): string => String(num).padStart(places, '0');

  public static formatDateTime(dateTime: number | Date, timezone = 'Asia/Tehran'): string {
    const unixTs = typeof dateTime === 'number' ? dateTime : dateTime.getTime();
    const date = moment(unixTs).tz(timezone);

    return date.format('yyyy/MM/DD, HH:mm:ss.SSS');
  }

  public static addSecondsToDate(date: Date, seconds: number): Date {
    const addedDate = moment(date).add(seconds, 's');

    return addedDate.toDate();
  }

  public static ConvertPersianNum2Latin(num: string): number {
    let res: any = '';

    for (const digit of num) {
      switch (digit) {
        case '۰':
          res += '0';
          break;

        case '۱':
          res += '1';
          break;

        case '۲':
          res += '2';
          break;

        case '۳':
          res += '3';
          break;

        case '۴':
          res += '4';
          break;

        case '۵':
          res += '5';
          break;

        case '۶':
          res += '6';
          break;

        case '۷':
          res += '7';
          break;

        case '۸':
          res += '8';
          break;

        case '۹':
          res += '9';
          break;

        default:
          res += digit;
      }
    }

    return +res;
  }

  public static convertKeyVal2Obj(keyVal: Array<string>): any {
    const objKeyVal = {};

    for (const arg of keyVal) {
      const [key, val] = arg.substring(2).split('=');

      Object.assign(objKeyVal, { [key]: val });
    }

    return objKeyVal;
  }

  public static consoleLog(logValue: string | number): void {
    const dateTime = this.formatDateTime(new Date());
    const modifiedLogValue = `[${ dateTime }] : ${ logValue }`;

    // eslint-disable-next-line no-console
    console.log(modifiedLogValue);

    Utils.fileLog(modifiedLogValue);
  }

  public static async fileLog(logValue: string | number): Promise<void> {
    let logDirPath = require?.main?.path;

    if (!logDirPath) {
      return;
    }

    logDirPath += '/log/';

    if (!existsSync(logDirPath)) {
      mkdirSync(logDirPath);
    }

    const todayDate = moment(new Date()).tz('Asia/Tehran').format('yyyyMMDD');
    const logFileName = `${ todayDate }.log`;
    const logFullPath = logDirPath + logFileName;

    appendFileSync(logFullPath, `${ logValue.toString() }\n`);
  }

  public static rebootMachine() {
    exec('reboot');
  }

  public static async makeAppAlive(callback?: () => void): Promise<void> {
    // Heart beat every 1 hour

    setInterval(() => {
      if (callback) {
        callback();
      }
    }, 10 * 60 * 1000);
  }

  public static generateLetters(numOfLetter: number, letters: Array<string>) {
    let foundWords: Array<string> = [];

    for (const word of wordsA) {
      let isFound = true;

      for (const ltr of word) {
        if (!letters.includes(ltr)) {
          isFound = false;
          break;
        }
      }

      if (isFound) {
        foundWords.push(word);
      }
    }

    foundWords = foundWords.filter((item, pos, self) => {
      return self.indexOf(item) === pos;
    });

    foundWords = foundWords.sort();

    const finalRes: Array<string> = [];

    for (const foundWord of foundWords) {
      if (foundWord.length === numOfLetter) {
        finalRes.push(foundWord);
      }
    }

    return finalRes;
  }
}
