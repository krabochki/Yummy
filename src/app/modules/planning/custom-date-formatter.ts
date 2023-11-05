import {
  CalendarNativeDateFormatter,
  DateFormatterParams,
} from 'angular-calendar';

//24 часовой формат для календаря
export class CustomDateFormatter extends CalendarNativeDateFormatter {
  public override dayViewHour({ date, locale }: DateFormatterParams): string {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric' }).format(date);
  }
}
