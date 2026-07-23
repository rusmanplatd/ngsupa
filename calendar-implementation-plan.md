# Calendar Component Improvements Plan

This document outlines the proposed improvements to the calendar component, addressing missing features commonly found in fully-featured calendar libraries.

## User Review Required

Please review the proposed features and confirm if you would like to proceed with all of them, or if there are specific priorities. 

> [!IMPORTANT]
> Adding event resizing and time-range selection will introduce new outputs (`eventResize` and `timeRangeSelect`) to the `CalendarComponent` that the host application will need to consume.
> 
> Also, changing the locale from a hardcoded string to a configurable input might require minor updates to the consuming components if a non-US locale is desired.

1. for timezone and date manipulation stick to pure JavaScript `Date` functions (as it is currently implemented)
2. For "Drag to Create" (Time Range Selection), should be available in week/day/month view (selecting multiple days)

## Proposed Changes

### Feature 1: Event Resizing (Duration Change)
Allow users to change the duration of an event by dragging its bottom edge in the Week and Day views.
- **Add Output**: `eventResize` to `CalendarComponent` and `CalendarModels`.
- **Implement**: Add a drag handle at the bottom of `cal-timed-event` blocks in `calendar-week-view.component.ts` and `calendar-day-view.component.ts`. Use CDK Drag Drop or custom pointer events for the handle.

### Feature 2: Time Range Selection (Drag to Create)
Allow users to click and drag on empty slots in the Week/Day grid to select a time range.
- **Add Output**: `timeRangeSelect` emitting `start` and `end` Dates.
- **Implement**: Add pointer event listeners (mousedown, mousemove, mouseup) to the grid columns in week/day views to render a temporary "selection box" and emit the selected range upon release.

### Feature 3: Localization Support (I18n)
Remove hardcoded `'en-US'` strings and make the locale configurable.
- **Implement**: Add a `locale` input to `CalendarComponent` (defaulting to `'en-US'`).
- **Refactor**: Update `CalendarService`, `calendar-month-view.component.ts`, `calendar-week-view.component.ts`, and `calendar-day-view.component.ts` to use this configurable locale signal instead of hardcoding `'en-US'`.

### Feature 4: Proper Multi-day Event Rendering
Currently, events spanning multiple days are only supported if they are `allDay`. Timed events spanning multiple days do not render across day boundaries properly.
- **Refactor**: Update `eventOverlapsDay` and layout logic in `calendar.service.ts` to chunk multi-day timed events into segments for each day they intersect.

### Feature 5: Auto-scroll to Current Time
When a user opens the Week or Day view, it should automatically scroll to show the current time.
- **Implement**: In `ngAfterViewInit` of `calendar-week-view` and `calendar-day-view`, calculate the scroll position of the `cal-week-scroll-area` container to center on `currentTimeTop()`.

## Verification Plan

### Automated Tests
- If there are unit tests for the calendar component, I will add tests for the new `locale` configuration and the multi-day event chunking logic in the service.

### Manual Verification
- Render the calendar component with the new features.
- Test dragging the bottom edge of an event to resize it.
- Test clicking and dragging on an empty slot to select a time range.
- Change the `locale` input and verify that month names, weekdays, and times format correctly.
- Add an event spanning 3 days and verify it renders correctly in month, week, and day views.
- Open the week view and verify the scroll container automatically scrolls to the current time indicator.
