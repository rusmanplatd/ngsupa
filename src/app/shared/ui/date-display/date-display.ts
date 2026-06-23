import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'relativeTime',
  pure: true,
})
export class RelativeTimePipe implements PipeTransform {
  transform(value: Date | string | number | null): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);
    const now = Date.now();
    const diffMs = now - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 5) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}w ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}mo ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years}y ago`;
  }
}

@Pipe({
  name: 'formatDate',
  pure: true,
})
export class FormatDatePipe implements PipeTransform {
  transform(
    value: Date | string | number | null,
    format: 'short' | 'medium' | 'long' | 'time' = 'medium'
  ): string {
    if (!value) return '';

    const date = value instanceof Date ? value : new Date(value);

    const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
      short: { month: 'short', day: 'numeric' },
      medium: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
      time: { hour: 'numeric', minute: '2-digit', hour12: true },
    };

    return new Intl.DateTimeFormat('en-US', optionsMap[format]).format(date);
  }
}
