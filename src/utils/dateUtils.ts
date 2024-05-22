import enGB from "date-fns/locale/en-GB";
import { formatRelative } from "date-fns";

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
    other: "yyyy-MM-dd",
};

const locale = {
    ...enGB,
    formatRelative: (token: string) => formatRelativeLocale[token],
};

export const formatRelativeDate = (date: string | number | Date, baseDate: string | number | Date = new Date()) => {
    // @ts-ignore
    return formatRelative(date, baseDate, { locale });
};
