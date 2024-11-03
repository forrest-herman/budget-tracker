import { formatRelative } from 'date-fns';
import enGB from 'date-fns/locale/en-GB';

// https://date-fns.org/docs/I18n-Contribution-Guide#formatrelative
// https://github.com/date-fns/date-fns/blob/master/src/locale/en-US/_lib/formatRelative/index.js
// https://github.com/date-fns/date-fns/issues/1218
// https://stackoverflow.com/questions/47244216/how-to-customize-date-fnss-formatrelative

const formatRelativeLocale: { [key: string]: string } = {
  lastWeek: "'Last' eeee",
  yesterday: "'Yesterday'",
  today: "'Today'",
  tomorrow: "'Tomorrow'",
  nextWeek: "'Next' eeee",
  other: 'yyyy-MM-dd',
};

const locale = {
  ...enGB,
  formatRelative: (token: string) => formatRelativeLocale[token],
};

export const formatRelativeDate = (
  date: string | number | Date,
  baseDate: string | number | Date = new Date(),
) => {
  // @ts-ignore
  return formatRelative(date, baseDate, { locale });
};

export const convertDateForServer = (date: Date) => {
  if (process.env.NODE_ENV == 'development') return date;
  return convertLocalDateToUTCIgnoringTimezone(date);
};

export const convertDateForClient = (date: Date) => {
  if (process.env.NODE_ENV == 'development') return date;
  return convertUTCToLocalDateIgnoringTimezone(date);
};

export function convertLocalDateToUTCIgnoringTimezone(date: Date) {
  const timestamp = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    //   date.getHours(),
    //   date.getMinutes(),
    //   date.getSeconds(),
    //   date.getMilliseconds(),
  );

  return new Date(timestamp);
}

export function convertUTCToLocalDateIgnoringTimezone(utcDate: Date) {
  return new Date(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth(),
    utcDate.getUTCDate(),
    //   utcDate.getUTCHours(),
    //   utcDate.getUTCMinutes(),
    //   utcDate.getUTCSeconds(),
    //   utcDate.getUTCMilliseconds(),
  );
}

export function dateFromSheetsCell(cell: string): Date | null {
  if (!cell) return null;
  // Sheets date usually has the form `Date(year,month,date)` (if the user didn't change anything)
  let [year, monthIndex, day] = cell.substring(5, cell.length - 1).split(',');
  return new Date(Date.UTC(parseInt(year), parseInt(monthIndex), parseInt(day))); // uses UTC timezone
}
