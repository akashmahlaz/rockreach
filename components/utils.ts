export const cls = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(" ");

export function timeAgo(date: Date | string | number): string {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const now = new Date();
  const sec = Math.max(1, Math.floor((now.getTime() - d.getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const unitSeconds: Record<Intl.RelativeTimeFormatUnit, number> = {
    second: 1,
    seconds: 1,
    minute: 60,
    minutes: 60,
    hour: 3600,
    hours: 3600,
    day: 86400,
    days: 86400,
    week: 604800,
    weeks: 604800,
    month: 2629800,
    months: 2629800,
    quarter: 7889400,
    quarters: 7889400,
    year: 31557600,
    years: 31557600,
  };
  const ranges: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, "second"], [3600, "minute"], [86400, "hour"],
    [604800, "day"], [2629800, "week"], [31557600, "month"],
  ];
  let unit: Intl.RelativeTimeFormatUnit = "year";
  let value = -Math.floor(sec / unitSeconds.year);
  for (const [limit, limitUnit] of ranges) {
    if (sec < limit) {
      unit = limitUnit;
      value = -Math.floor(sec / unitSeconds[unit]);
      break;
    }
  }
  return rtf.format(value, unit);
}

export const makeId = (prefix: string): string => `${prefix}${Math.random().toString(36).slice(2, 10)}`;
