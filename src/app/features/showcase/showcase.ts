import { Component, inject, signal } from '@angular/core';
import { ButtonComponent } from '../../shared/ui/button/button';
import { InputComponent } from '../../shared/ui/input/input';
import { ToggleComponent } from '../../shared/ui/toggle/toggle';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../../shared/ui/segmented-control/segmented-control';
import { CardComponent } from '../../shared/ui/card/card';
import { AvatarComponent } from '../../shared/ui/avatar/avatar';
import { ListComponent, ListItemComponent } from '../../shared/ui/list/list';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';
import { DividerComponent } from '../../shared/ui/divider/divider';
import { LucideDynamicIcon, icons } from '@lucide/angular';
import { NavBarComponent } from '../../shared/ui/nav-bar/nav-bar';
import { ToastService, ToastContainerComponent } from '../../shared/ui/toast/toast';
import { BadgeComponent } from '../../shared/ui/badge/badge';
import { AlertComponent } from '../../shared/ui/alert/alert';
import { CheckboxComponent } from '../../shared/ui/checkbox/checkbox';
import { RadioGroupComponent, RadioOption } from '../../shared/ui/radio/radio';
import { ChipComponent } from '../../shared/ui/chip/chip';
import { SelectComponent, SelectOption, SelectGroup } from '../../shared/ui/select/select';
import { DropdownComponent, DropdownOption, DropdownGroup } from '../../shared/ui/dropdown/dropdown';
import { ProgressComponent } from '../../shared/ui/progress/progress';
// import { DateDisplayComponent } from '../../shared/ui/date-display/date-display';

import { SliderComponent } from '../../shared/ui/slider/slider';
import { SkeletonComponent, SkeletonGroupComponent } from '../../shared/ui/skeleton/skeleton';
import { TextareaComponent } from '../../shared/ui/textarea/textarea';
import { SearchBarComponent } from '../../shared/ui/search-bar/search-bar';
import { StepperComponent } from '../../shared/ui/stepper/stepper';
import { TooltipDirective } from '../../shared/ui/tooltip/tooltip';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state';
import { AccordionComponent, AccordionItem } from '../../shared/ui/accordion/accordion';
import { KbdComponent } from '../../shared/ui/kbd/kbd';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card';
import { ToolbarComponent } from '../../shared/ui/toolbar/toolbar';
import { RelativeTimePipe, FormatDatePipe } from '../../shared/ui/date-display/date-display';
import { ActionSheetService } from '../../shared/ui/action-sheet/action-sheet';
import { ModalService, ModalComponent } from '../../shared/ui/modal/modal';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog';
import { BottomSheetService } from '../../shared/ui/bottom-sheet/bottom-sheet';
import { ContextMenuService, ContextMenuItem } from '../../shared/ui/context-menu/context-menu';
import { PopoverDirective } from '../../shared/ui/popover/popover';
import { DatePickerComponent, DateRange } from '../../shared/ui/date-picker/date-picker';
import { TimePickerComponent, TimeValue, TimeRange } from '../../shared/ui/time-picker/time-picker';
import { TabBarComponent, Tab } from '../../shared/ui/tab-bar/tab-bar';
import { CarouselComponent, CarouselSlideDirective } from '../../shared/ui/carousel/carousel';
import { TreeComponent, type TreeNode, type TreeNodeEditEvent, type TreeContextMenuEvent } from '../../shared/ui/tree/tree';
import { ListboxComponent, ListboxOptionComponent } from '../../shared/ui/listbox/listbox';
import { PaginatorComponent } from '../../shared/ui/paginator/paginator';
import { TabsComponent, TabItem } from '../../shared/ui/tabs/tabs';
import {
  DataTableComponent,
  DataTableCellDirective,
  type DataTableColumnDef,
} from '../../shared/ui/data-table/data-table';

@Component({
  selector: 'app-showcase',
  imports: [
    ButtonComponent,
    InputComponent,
    ToggleComponent,
    SegmentedControlComponent,
    CardComponent,
    AvatarComponent,
    ListComponent,
    ListItemComponent,
    SpinnerComponent,
    DividerComponent,
    LucideDynamicIcon,
    NavBarComponent,
    ToastContainerComponent,
    BadgeComponent,
    AlertComponent,
    CheckboxComponent,
    RadioGroupComponent,
    ChipComponent,
    SelectComponent,
    DropdownComponent,
    ProgressComponent,
    SliderComponent,
    SkeletonComponent,
    SkeletonGroupComponent,
    TextareaComponent,
    SearchBarComponent,
    StepperComponent,
    TooltipDirective,
    EmptyStateComponent,
    AccordionComponent,
    KbdComponent,
    StatCardComponent,
    ToolbarComponent,
    RelativeTimePipe,
    FormatDatePipe,
    PopoverDirective,
    DatePickerComponent,
    CarouselComponent,
    CarouselSlideDirective,
    TreeComponent,
    ListboxComponent,
    ListboxOptionComponent,
    PaginatorComponent,
    TimePickerComponent,
    TabBarComponent,
    TabsComponent,
    DataTableComponent,
    DataTableCellDirective,
  ],
  template: `
    <app-toast-container />
    <app-nav-bar title="Design System">
      <span nav-leading class="text-sm font-semibold text-system-blue">NgSupa</span>
    </app-nav-bar>

    <main class="mx-auto max-w-4xl px-5 pb-32">

      <!-- ═══════════════════════════════════════════════════
           Header
           ═══════════════════════════════════════════════════ -->
      <div class="pt-8 pb-10">
        <h1 class="text-4xl font-bold tracking-tighter text-[var(--text-primary)]" style="font: var(--type-large-title)">
          Apple HIG Design System
        </h1>
        <p class="mt-2 text-[var(--text-secondary)]" style="font: var(--type-body)">
          A comprehensive component library following Apple Human Interface Guidelines,
          built with Angular signals and semantic design tokens.
        </p>
      </div>

      <!-- ═══════════════════════════════════════════════════
           Section: Typography Scale
           ═══════════════════════════════════════════════════ -->
      <section id="typography" class="mb-16">
        <h2 class="section-title">Typography Scale</h2>
        <app-card variant="outlined" padding="lg">
          <div class="space-y-4">
            <div class="flex items-baseline justify-between gap-4">
              <span style="font: var(--type-large-title)" class="text-[var(--text-primary)]">Large Title</span>
              <span class="text-xs tabular-nums text-[var(--text-tertiary)] shrink-0">34px / 600</span>
            </div>
            <div class="h-px bg-[var(--separator)]"></div>
            <div class="flex items-baseline justify-between gap-4">
              <span style="font: var(--type-title-1)" class="text-[var(--text-primary)]">Title 1</span>
              <span class="text-xs tabular-nums text-[var(--text-tertiary)] shrink-0">28px / 700</span>
            </div>
            <div class="h-px bg-[var(--separator)]"></div>
            <div class="flex items-baseline justify-between gap-4">
              <span style="font: var(--type-title-2)" class="text-[var(--text-primary)]">Title 2</span>
              <span class="text-xs tabular-nums text-[var(--text-tertiary)] shrink-0">22px / 700</span>
            </div>
            <div class="h-px bg-[var(--separator)]"></div>
            <div class="flex items-baseline justify-between gap-4">
              <span style="font: var(--type-title-3)" class="text-[var(--text-primary)]">Title 3</span>
              <span class="text-xs tabular-nums text-[var(--text-tertiary)] shrink-0">20px / 600</span>
            </div>
            <div class="h-px bg-[var(--separator)]"></div>
            <div class="flex items-baseline justify-between gap-4">
              <span style="font: var(--type-headline)" class="text-[var(--text-primary)]">Headline</span>
              <span class="text-xs tabular-nums text-[var(--text-tertiary)] shrink-0">17px / 600</span>
            </div>
            <div class="h-px bg-[var(--separator)]"></div>
            <div class="flex items-baseline justify-between gap-4">
              <span style="font: var(--type-body)" class="text-[var(--text-primary)]">Body</span>
              <span class="text-xs tabular-nums text-[var(--text-tertiary)] shrink-0">17px / 400</span>
            </div>
            <div class="h-px bg-[var(--separator)]"></div>
            <div class="flex items-baseline justify-between gap-4">
              <span style="font: var(--type-callout)" class="text-[var(--text-primary)]">Callout</span>
              <span class="text-xs tabular-nums text-[var(--text-tertiary)] shrink-0">16px / 400</span>
            </div>
            <div class="h-px bg-[var(--separator)]"></div>
            <div class="flex items-baseline justify-between gap-4">
              <span style="font: var(--type-subheadline)" class="text-[var(--text-primary)]">Subheadline</span>
              <span class="text-xs tabular-nums text-[var(--text-tertiary)] shrink-0">15px / 400</span>
            </div>
            <div class="h-px bg-[var(--separator)]"></div>
            <div class="flex items-baseline justify-between gap-4">
              <span style="font: var(--type-footnote)" class="text-[var(--text-primary)]">Footnote</span>
              <span class="text-xs tabular-nums text-[var(--text-tertiary)] shrink-0">13px / 400</span>
            </div>
            <div class="h-px bg-[var(--separator)]"></div>
            <div class="flex items-baseline justify-between gap-4">
              <span style="font: var(--type-caption-1)" class="text-[var(--text-primary)]">Caption 1</span>
              <span class="text-xs tabular-nums text-[var(--text-tertiary)] shrink-0">12px / 400</span>
            </div>
            <div class="h-px bg-[var(--separator)]"></div>
            <div class="flex items-baseline justify-between gap-4">
              <span style="font: var(--type-caption-2)" class="text-[var(--text-primary)]">Caption 2</span>
              <span class="text-xs tabular-nums text-[var(--text-tertiary)] shrink-0">11px / 400</span>
            </div>
          </div>
        </app-card>
      </section>

      <!-- ═══════════════════════════════════════════════════
           Section: Color Palette
           ═══════════════════════════════════════════════════ -->
      <section id="colors" class="mb-16">
        <h2 class="section-title">Color Palette</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          @for (color of systemColors; track color.name) {
            <div class="rounded-2xl overflow-hidden border border-[var(--border-default)]">
              <div class="h-16" [style.background]="color.value"></div>
              <div class="p-2.5 bg-[var(--surface-primary)]">
                <p class="text-xs font-semibold text-[var(--text-primary)]">{{ color.name }}</p>
                <p class="text-[10px] text-[var(--text-tertiary)] mt-0.5 font-mono">{{ color.token }}</p>
              </div>
            </div>
          }
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════
           Section: Buttons
           ═══════════════════════════════════════════════════ -->
      <section id="buttons" class="mb-16">
        <h2 class="section-title">Buttons</h2>
        <div class="space-y-6">
          <!-- Variants -->
          <div>
            <h3 class="subsection-label">Variants</h3>
            <div class="flex flex-wrap items-center gap-3">
              <button appButton variant="filled">Filled</button>
              <button appButton variant="tinted">Tinted</button>
              <button appButton variant="plain">Plain</button>
              <button appButton variant="gray">Gray</button>
              <button appButton variant="destructive">Destructive</button>
              <button appButton variant="ghost">Ghost</button>
            </div>
          </div>
          <!-- Sizes -->
          <div>
            <h3 class="subsection-label">Sizes</h3>
            <div class="flex flex-wrap items-center gap-3">
              <button appButton variant="filled" size="sm">Small</button>
              <button appButton variant="filled" size="md">Medium</button>
              <button appButton variant="filled" size="lg">Large</button>
            </div>
          </div>
          <!-- Pill / Rounded -->
          <div>
            <h3 class="subsection-label">Pill Buttons</h3>
            <div class="flex flex-wrap items-center gap-3">
              <button appButton variant="filled" [rounded]="true">Rounded Filled</button>
              <button appButton variant="tinted" [rounded]="true">Rounded Tinted</button>
              <button appButton variant="gray" [rounded]="true">Rounded Gray</button>
            </div>
          </div>
          <!-- States -->
          <div>
            <h3 class="subsection-label">States</h3>
            <div class="flex flex-wrap items-center gap-3">
              <button appButton variant="filled" [loading]="true">Loading</button>
              <button appButton variant="filled" [disabled]="true">Disabled</button>
            </div>
          </div>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Inputs & Forms
           ═══════════════════════════════════════════════════ -->
      <section id="inputs" class="mb-16 mt-16">
        <h2 class="section-title">Inputs & Forms</h2>
        <div class="grid gap-8 md:grid-cols-2">
          <!-- Text Inputs -->
          <div class="space-y-4">
            <h3 class="subsection-label">Text Inputs</h3>
            <app-input
              label="Email address"
              type="email"
              leadingIcon="mail"
              autocomplete="email"
              [value]="emailVal()"
              (valueChange)="emailVal.set($event)"
            />
            <app-input
              label="Password"
              type="password"
              leadingIcon="lock"
              autocomplete="current-password"
            />
            <app-input
              label="Full name"
              hint="Enter your full name"
              leadingIcon="user"
              [clearable]="true"
              [value]="nameVal()"
              (valueChange)="nameVal.set($event)"
            />
            <app-input
              label="With error"
              error="This field is required"
              [value]="''"
            />
          </div>

          <!-- Input States -->
          <div class="space-y-4">
            <h3 class="subsection-label">Input States</h3>
            <app-input
              label="Success state"
              state="success"
              [value]="'john@example.com'"
              leadingIcon="mail"
            />
            <app-input
              label="Read-only"
              [readonly]="true"
              [value]="'Cannot edit this'"
              trailingIcon="lock"
            />
            <app-input
              label="Disabled input"
              [disabled]="true"
              [value]="'Disabled'"
            />
            <app-input
              label="Character count"
              hint="Max 50 characters"
              [maxLength]="50"
              [showCounter]="true"
              [value]="counterVal()"
              (valueChange)="counterVal.set($event)"
            />
          </div>

          <!-- Textarea -->
          <div class="space-y-4">
            <h3 class="subsection-label">Textarea</h3>
            <app-textarea
              label="Description"
              hint="Write a brief description"
              [maxLength]="200"
              [showCounter]="true"
            />
            <app-textarea
              label="Auto-grow with limit"
              hint="Grows up to 5 rows"
              [minRows]="2"
              [maxRows]="5"
            />
            <app-textarea
              label="With error"
              error="Description is too short"
              [value]="'Hi'"
            />
          </div>

          <!-- Select & Search -->
          <div class="space-y-4">
            <h3 class="subsection-label">Select</h3>
            <app-select
              label="Country"
              [options]="countryOptions"
              [value]="selectedCountry()"
              (valueChange)="selectedCountry.set($event)"
              [clearable]="true"
              hint="Select your country"
            />
            <app-select
              label="Disabled select"
              [options]="countryOptions"
              [disabled]="true"
              [value]="'us'"
            />
            <h3 class="subsection-label mt-6">Search Bar</h3>
            <app-search-bar
              placeholder="Search components…"
              [value]="searchVal()"
              (valueChange)="searchVal.set($event)"
            />
          </div>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Advanced Select
           ═══════════════════════════════════════════════════ -->
      <section id="advanced-select" class="mb-16 mt-16">
        <h2 class="section-title">Advanced Select</h2>
        <div class="grid gap-8 md:grid-cols-2">

          <!-- Searchable with Icons -->
          <div class="space-y-4">
            <h3 class="subsection-label">Searchable with Icons</h3>
            <app-select
              label="Programming Language"
              [options]="selectLanguageOptions"
              [value]="selectLanguage()"
              [searchable]="true"
              [clearable]="true"
              placeholder="Search languages…"
              (valueChange)="selectLanguage.set($event)"
              hint="Type to filter options"
            />
            <app-select
              label="Notification Channel"
              [options]="selectNotificationOptions"
              [value]="selectNotification()"
              [searchable]="true"
              [clearable]="true"
              (valueChange)="selectNotification.set($event)"
            />
          </div>

          <!-- Multi-select with Groups -->
          <div class="space-y-4">
            <h3 class="subsection-label">Multi-select with Groups</h3>
            <app-select
              label="Permissions"
              [groups]="selectPermissionGroups"
              [values]="selectPermissions()"
              [multiple]="true"
              [searchable]="true"
              [clearable]="true"
              [maxSelections]="6"
              (valuesChange)="selectPermissions.set($event)"
              hint="Select up to 6 permissions"
            />
            <app-select
              label="Favorite Fruits"
              [options]="selectFruitOptions"
              [values]="selectFruits()"
              [multiple]="true"
              [clearable]="true"
              (valuesChange)="selectFruits.set($event)"
            />
          </div>

          <!-- States -->
          <div class="space-y-4">
            <h3 class="subsection-label">States</h3>
            <app-select
              label="With Error"
              [options]="countryOptions"
              error="Please select a country"
            />
            <app-select
              label="Disabled"
              [options]="countryOptions"
              [disabled]="true"
              [value]="'us'"
            />
          </div>

          <!-- With Descriptions -->
          <div class="space-y-4">
            <h3 class="subsection-label">With Descriptions</h3>
            <app-select
              label="App Icon"
              [options]="selectAppIconOptions"
              [value]="selectAppIcon()"
              [searchable]="true"
              (valueChange)="selectAppIcon.set($event)"
              hint="Icons from the design system"
            />
            <app-select
              label="Country (clearable)"
              [options]="countryOptions"
              [value]="selectClearableCountry()"
              [clearable]="true"
              placeholder="Pick a country"
              (valueChange)="selectClearableCountry.set($event)"
            />
          </div>

        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Advanced Dropdown
           ═══════════════════════════════════════════════════ -->
      <section id="dropdown" class="mb-16 mt-16">
        <h2 class="section-title">Advanced Dropdown</h2>
        <div class="grid gap-8 md:grid-cols-2">

          <!-- Basic Single Select -->
          <div class="space-y-4">
            <h3 class="subsection-label">Basic Single Select</h3>
            <app-dropdown
              label="Notification Channel"
              [options]="notificationOptions"
              [value]="selectedNotification()"
              (valueChange)="selectedNotification.set($event)"
              hint="Choose how you'd like to be notified"
            />
            <app-dropdown
              label="Country"
              [options]="dropdownCountryOptions"
              [value]="ddCountry()"
              [clearable]="true"
              placeholder="Pick a country"
              (valueChange)="ddCountry.set($event)"
            />
          </div>

          <!-- Searchable with Icons -->
          <div class="space-y-4">
            <h3 class="subsection-label">Searchable with Icons</h3>
            <app-dropdown
              label="Programming Language"
              [options]="languageOptions"
              [value]="selectedLanguage()"
              [searchable]="true"
              [clearable]="true"
              placeholder="Search languages…"
              (valueChange)="selectedLanguage.set($event)"
            />
            <app-dropdown
              label="App Icon"
              [options]="appIconOptions"
              [value]="selectedAppIcon()"
              [searchable]="true"
              (valueChange)="selectedAppIcon.set($event)"
              hint="Icons from the design system"
            />
          </div>

          <!-- Multi-select with Groups -->
          <div class="space-y-4">
            <h3 class="subsection-label">Multi-select with Groups</h3>
            <app-dropdown
              label="Permissions"
              [groups]="permissionGroups"
              [values]="selectedPermissions()"
              [multiple]="true"
              [searchable]="true"
              [clearable]="true"
              [maxSelections]="6"
              (valuesChange)="selectedPermissions.set($event)"
              hint="Select up to 6 permissions"
            />
            <app-dropdown
              label="Favorite Fruits"
              [options]="fruitOptions"
              [values]="selectedFruits()"
              [multiple]="true"
              [clearable]="true"
              (valuesChange)="selectedFruits.set($event)"
            />
          </div>

          <!-- States -->
          <div class="space-y-4">
            <h3 class="subsection-label">States</h3>
            <app-dropdown
              label="With Error"
              [options]="dropdownCountryOptions"
              error="Please select a country"
            />
            <app-dropdown
              label="Disabled"
              [options]="dropdownCountryOptions"
              [disabled]="true"
              [value]="'us'"
            />
            <app-dropdown
              label="With Descriptions"
              [options]="notificationOptions"
              [value]="'push'"
              [searchable]="true"
              [clearable]="true"
              (valueChange)="selectedNotification.set($event)"
            />
          </div>

        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Date Picker
           ═══════════════════════════════════════════════════ -->
      <section id="date-picker" class="mb-16 mt-16">
        <h2 class="section-title">Date Picker</h2>
        <div class="grid gap-8 md:grid-cols-2">
          <!-- Single Date -->
          <div class="space-y-4">
            <h3 class="subsection-label">Single Date</h3>
            <app-date-picker
              label="Birthday"
              hint="Select your date of birth"
              [value]="selectedDate()"
              (dateChange)="selectedDate.set($event)"
            />
            <app-date-picker
              label="Event Date"
              [value]="eventDate()"
              (dateChange)="eventDate.set($event)"
              format="long"
            />
            <app-date-picker
              label="Quick Date"
              hint="Short format display"
              format="short"
              [value]="shortFormatDate()"
              (dateChange)="shortFormatDate.set($event)"
            />
          </div>

          <!-- Date Range -->
          <div class="space-y-4">
            <h3 class="subsection-label">Date Range</h3>
            <app-date-picker
              label="Trip Dates"
              mode="range"
              hint="Select start and end dates"
              [rangeValue]="dateRange()"
              (rangeChange)="dateRange.set($event)"
            />
            <app-date-picker
              label="Booking Period"
              mode="range"
              format="long"
              [rangeValue]="bookingRange()"
              (rangeChange)="bookingRange.set($event)"
            />
          </div>

          <!-- Constrained -->
          <div class="space-y-4">
            <h3 class="subsection-label">Constrained</h3>
            <app-date-picker
              label="Appointment"
              hint="Only future weekdays"
              [minDate]="today"
              [disabledDaysOfWeek]="[0, 6]"
              [value]="constrainedDate()"
              (dateChange)="constrainedDate.set($event)"
            />
            <app-date-picker
              label="Monday Start"
              hint="Week starts on Monday"
              [firstDayOfWeek]="1"
              [value]="mondayStartDate()"
              (dateChange)="mondayStartDate.set($event)"
            />
          </div>

          <!-- Disabled & Error -->
          <div class="space-y-4">
            <h3 class="subsection-label">States</h3>
            <app-date-picker
              label="Read-only"
              [disabled]="true"
              [value]="sampleDate"
            />
            <app-date-picker
              label="With Error"
              error="Please select a valid date"
            />
            <app-date-picker
              label="Not Clearable"
              [clearable]="false"
              [value]="sampleDate"
            />
          </div>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Time Picker
           ═══════════════════════════════════════════════════ -->
      <section id="time-picker" class="mb-16 mt-16">
        <h2 class="section-title">Time Picker</h2>
        <div class="grid gap-8 md:grid-cols-2">
          <!-- 12h Default -->
          <div class="space-y-4">
            <h3 class="subsection-label">12-Hour Format</h3>
            <app-time-picker
              label="Alarm"
              hint="Set your wake-up time"
              [value]="selectedTime()"
              (timeChange)="selectedTime.set($event)"
            />
            <app-time-picker
              label="Meeting"
              [value]="meetingTime()"
              (timeChange)="meetingTime.set($event)"
            />
          </div>

          <!-- 24h Format -->
          <div class="space-y-4">
            <h3 class="subsection-label">24-Hour Format</h3>
            <app-time-picker
              label="Departure"
              hint="24-hour clock"
              format="24h"
              [value]="departureTime()"
              (timeChange)="departureTime.set($event)"
            />
            <app-time-picker
              label="Server Maintenance"
              format="24h"
              [value]="maintenanceTime()"
              (timeChange)="maintenanceTime.set($event)"
            />
          </div>

          <!-- Minute Steps -->
          <div class="space-y-4">
            <h3 class="subsection-label">Minute Steps</h3>
            <app-time-picker
              label="Appointment"
              hint="15-minute intervals"
              [minuteStep]="15"
              [value]="appointmentTime()"
              (timeChange)="appointmentTime.set($event)"
            />
            <app-time-picker
              label="Quick Slot"
              hint="5-minute intervals"
              [minuteStep]="5"
              [value]="quickSlotTime()"
              (timeChange)="quickSlotTime.set($event)"
            />
          </div>

          <!-- States -->
          <div class="space-y-4">
            <h3 class="subsection-label">States</h3>
            <app-time-picker
              label="Disabled"
              [disabled]="true"
              [value]="{ hours: 9, minutes: 30 }"
            />
            <app-time-picker
              label="With Error"
              error="Please select a valid time"
            />
            <app-time-picker
              label="Not Clearable"
              [clearable]="false"
              [value]="{ hours: 14, minutes: 0 }"
            />
          </div>

          <!-- Range Mode -->
          <div class="space-y-4">
            <h3 class="subsection-label">Range Mode</h3>
            <app-time-picker
              label="Work Hours"
              hint="Select start and end time"
              mode="range"
              [rangeValue]="workHoursRange()"
              (rangeChange)="workHoursRange.set($event)"
            />
            <app-time-picker
              label="Shift Schedule"
              hint="24-hour format"
              mode="range"
              format="24h"
              [minuteStep]="15"
              [rangeValue]="shiftRange()"
              (rangeChange)="shiftRange.set($event)"
            />
          </div>

          <!-- Pre-filled Range -->
          <div class="space-y-4">
            <h3 class="subsection-label">Pre-filled Range</h3>
            <app-time-picker
              label="Business Hours"
              mode="range"
              [rangeValue]="businessHoursRange()"
              (rangeChange)="businessHoursRange.set($event)"
            />
          </div>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Toggles, Checks, Radios
           ═══════════════════════════════════════════════════ -->
      <section id="controls" class="mb-16 mt-16">
        <h2 class="section-title">Controls</h2>
        <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <!-- Toggle -->
          <div class="space-y-4">
            <h3 class="subsection-label">Toggle / Switch</h3>
            <app-toggle label="Notifications" [(checked)]="toggleA" />
            <app-toggle label="Dark Mode" [(checked)]="toggleB" />
            <app-toggle label="Disabled On" [disabled]="true" [checked]="true" />
            <app-toggle label="Disabled Off" [disabled]="true" />
          </div>

          <!-- Checkbox -->
          <div class="space-y-4">
            <h3 class="subsection-label">Checkbox</h3>
            <app-checkbox label="Accept terms" description="I agree to the terms and conditions" [(checked)]="checkA" />
            <app-checkbox label="Subscribe to newsletter" [(checked)]="checkB" />
            <app-checkbox label="Disabled option" [disabled]="true" />
            <app-checkbox label="Indeterminate" [indeterminate]="true" />
          </div>

          <!-- Radio Default -->
          <div class="space-y-4">
            <h3 class="subsection-label">Radio Group</h3>
            <app-radio-group
              [options]="radioOptions"
              [(value)]="radioValue"
              ariaLabel="Theme preference"
            />
          </div>

          <!-- Radio Card Variant -->
          <div class="space-y-4">
            <h3 class="subsection-label">Radio Card Variant</h3>
            <app-radio-group
              [options]="radioOptions"
              [(value)]="radioCardValue"
              ariaLabel="Theme preference card"
              variant="card"
            />
          </div>

          <!-- Slider -->
          <div class="space-y-4">
            <h3 class="subsection-label">Slider</h3>
            <app-slider
              label="Volume"
              [(value)]="sliderVal"
              [min]="0"
              [max]="100"
              [showValue]="true"
              suffix="%"
              minLabel="🔇"
              maxLabel="🔊"
            />
            <app-slider
              label="Brightness"
              [(value)]="brightnessVal"
              [min]="0"
              [max]="100"
              [step]="10"
              [showValue]="true"
              suffix="%"
            />
          </div>

          <!-- Stepper -->
          <div class="space-y-4">
            <h3 class="subsection-label">Stepper</h3>
            <app-stepper label="Quantity" [(value)]="stepperVal" [min]="0" [max]="10" />
            <app-stepper label="Disabled" [(value)]="stepperVal" [disabled]="true" />
          </div>

          <!-- Segmented Control -->
          <div class="space-y-4">
            <h3 class="subsection-label">Segmented Control</h3>
            <app-segmented-control
              [options]="segmentOptions"
              [(value)]="segmentValue"
              ariaLabel="View mode"
            />
            <p class="text-xs text-[var(--text-secondary)]">
              Selected: {{ segmentValue() }}
            </p>
          </div>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Cards & Layout
           ═══════════════════════════════════════════════════ -->
      <section id="cards" class="mb-16 mt-16">
        <h2 class="section-title">Cards</h2>
        <div class="space-y-8">
          <!-- Card Variants -->
          <div>
            <h3 class="subsection-label">Card Variants</h3>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <app-card>
                <p class="text-sm font-medium text-[var(--text-primary)]">Glass (Default)</p>
                <p class="mt-1 text-xs text-[var(--text-secondary)]">Frosted glass with backdrop blur</p>
              </app-card>
              <app-card variant="elevated">
                <p class="text-sm font-medium text-[var(--text-primary)]">Elevated</p>
                <p class="mt-1 text-xs text-[var(--text-secondary)]">Raised with shadow</p>
              </app-card>
              <app-card variant="outlined">
                <p class="text-sm font-medium text-[var(--text-primary)]">Outlined</p>
                <p class="mt-1 text-xs text-[var(--text-secondary)]">Subtle border</p>
              </app-card>
              <app-card variant="outlined" [interactive]="true">
                <p class="text-sm font-medium text-[var(--text-primary)]">Interactive</p>
                <p class="mt-1 text-xs text-[var(--text-secondary)]">Hover to lift</p>
              </app-card>
            </div>
          </div>

          <!-- Stat Cards -->
          <div>
            <h3 class="subsection-label">Stat Cards</h3>
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <app-stat-card title="Total Users" value="12,847" [change]="12.5" icon="users" />
              <app-stat-card title="Revenue" value="$48,290" [change]="-3.2" icon="dollar-sign" />
              <app-stat-card title="Active Sessions" value="1,024" [change]="0" icon="activity" subtitle="right now" />
              <app-stat-card title="Conversion" value="3.6%" [change]="8.1" icon="trending-up" variant="glass" />
            </div>
          </div>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Avatars
           ═══════════════════════════════════════════════════ -->
      <section id="avatars" class="mb-16 mt-16">
        <h2 class="section-title">Avatars</h2>
        <div class="flex items-end gap-4 flex-wrap">
          <app-avatar size="xs" name="Alice Blue" />
          <app-avatar size="sm" name="Bob Green" status="online" />
          <app-avatar size="md" name="Charlie Red" status="away" />
          <app-avatar size="lg" name="Diana Purple" status="offline" />
          <app-avatar size="xl" name="Eve Orange" />
        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Feedback & Status
           ═══════════════════════════════════════════════════ -->
      <section id="feedback" class="mb-16 mt-16">
        <h2 class="section-title">Feedback & Status</h2>
        <div class="space-y-8">

          <!-- Alerts -->
          <div>
            <h3 class="subsection-label">Alerts</h3>
            <div class="space-y-3 max-w-2xl">
              <app-alert variant="info" title="Information" message="Your account has been verified successfully." [dismissible]="true" />
              <app-alert variant="success" title="Success" message="Your changes have been saved." />
              <app-alert variant="warning" title="Warning" message="Your session will expire in 5 minutes." />
              <app-alert variant="error" title="Error" message="Failed to connect to server. Please try again." [dismissible]="true" />
            </div>
          </div>

          <!-- Badges -->
          <div>
            <h3 class="subsection-label">Badges</h3>
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-3">
                <app-badge>Default</app-badge>
                <app-badge variant="success">Success</app-badge>
                <app-badge variant="warning">Warning</app-badge>
                <app-badge variant="error">Error</app-badge>
                <app-badge variant="info">Info</app-badge>
                <app-badge variant="neutral">Neutral</app-badge>
              </div>
              <div class="flex flex-wrap items-center gap-3">
                <app-badge [subtle]="true">Subtle</app-badge>
                <app-badge variant="success" [subtle]="true">Subtle</app-badge>
                <app-badge variant="warning" [subtle]="true">Subtle</app-badge>
                <app-badge variant="error" [subtle]="true">Subtle</app-badge>
                <app-badge variant="info" [subtle]="true">Subtle</app-badge>
              </div>
              <div class="flex items-center gap-4">
                <app-badge [count]="5" />
                <app-badge [count]="42" variant="error" />
                <app-badge [count]="150" variant="success" />
                <app-badge [dot]="true" variant="error" ariaLabel="New notifications" />
                <app-badge [dot]="true" variant="success" ariaLabel="Online" />
              </div>
            </div>
          </div>

          <!-- Chips -->
          <div>
            <h3 class="subsection-label">Chips</h3>
            <div class="flex flex-wrap gap-2">
              @for (chip of chipLabels; track chip; let i = $index) {
                <app-chip
                  [selected]="selectedChips().has(chip)"
                  [removable]="selectedChips().has(chip)"
                  (chipClick)="toggleChip(chip)"
                  (removed)="toggleChip(chip)"
                >{{ chip }}</app-chip>
              }
            </div>
          </div>

          <!-- Progress -->
          <div>
            <h3 class="subsection-label">Progress</h3>
            <div class="grid gap-6 md:grid-cols-2">
              <div class="space-y-4">
                <app-progress [value]="72" color="blue" [showLabel]="true" label="Upload" size="md" />
                <app-progress [value]="45" color="green" [showLabel]="true" label="Processing" />
                <app-progress [value]="89" color="gradient" [showLabel]="true" label="Syncing" />
                <app-progress [determinate]="false" color="blue" />
              </div>
              <div class="flex items-center justify-around">
                <app-progress shape="ring" [value]="72" [showLabel]="true" [ringSize]="80" color="blue" label="Storage" />
                <app-progress shape="ring" [value]="45" [showLabel]="true" [ringSize]="64" color="green" label="Battery" />
                <app-progress shape="ring" [value]="89" [showLabel]="true" [ringSize]="48" color="orange" />
              </div>
            </div>
          </div>

          <!-- Spinners -->
          <div>
            <h3 class="subsection-label">Spinners</h3>
            <div class="flex items-center gap-6">
              <app-spinner size="sm" />
              <app-spinner size="md" />
              <app-spinner size="lg" />
            </div>
          </div>

          <!-- Skeleton -->
          <div>
            <h3 class="subsection-label">Skeleton Loading</h3>
            <div class="grid gap-4 md:grid-cols-2">
              <app-card variant="outlined">
                <div class="flex items-center gap-3 mb-4">
                  <app-skeleton variant="circle" width="40px" />
                  <div class="flex-1 space-y-2">
                    <app-skeleton variant="text" width="60%" />
                    <app-skeleton variant="text" width="40%" />
                  </div>
                </div>
                <app-skeleton-group [lines]="3" />
              </app-card>
              <app-card variant="outlined" padding="none">
                <app-skeleton variant="rect" height="120px" />
                <div class="p-4">
                  <app-skeleton-group [lines]="2" />
                </div>
              </app-card>
            </div>
          </div>

          <!-- Toasts -->
          <div>
            <h3 class="subsection-label">Toasts</h3>
            <div class="flex flex-wrap gap-3">
              <button appButton variant="tinted" (click)="toastService.info('This is an info toast')">Info</button>
              <button appButton variant="tinted" (click)="toastService.success('Operation successful!')">Success</button>
              <button appButton variant="tinted" (click)="toastService.warning('Please be careful')">Warning</button>
              <button appButton variant="tinted" (click)="toastService.error('Something went wrong')">Error</button>
            </div>
          </div>

          <!-- Empty State -->
          <div>
            <h3 class="subsection-label">Empty State</h3>
            <app-card variant="outlined">
              <app-empty-state
                icon="inbox"
                title="No messages"
                description="You're all caught up! Check back later for new messages."
                actionLabel="Compose"
                (actionClick)="toastService.info('Compose clicked')"
              />
            </app-card>
          </div>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Navigation
           ═══════════════════════════════════════════════════ -->
      <section id="navigation" class="mb-16 mt-16">
        <h2 class="section-title">Navigation</h2>
        <div class="space-y-8">

          <!-- Lists -->
          <div>
            <h3 class="subsection-label">Lists</h3>
            <div class="max-w-md space-y-4">
              <app-list header="General">
                <app-list-item label="Profile" leadingIcon="user" [showChevron]="true" />
                <app-list-item label="Notifications" leadingIcon="bell" trailing="On" [showChevron]="true" />
                <app-list-item label="Security" leadingIcon="shield" [showChevron]="true" [last]="true" />
              </app-list>
              <app-list header="Danger Zone">
                <app-list-item
                  label="Delete Account"
                  leadingIcon="trash"
                  [destructive]="true"
                  [last]="true"
                  (pressed)="toastService.error('This is a destructive action')"
                />
              </app-list>
            </div>
          </div>

          <!-- Segmented (already shown above — just reference) -->

          <!-- Tab Bar -->
          <div>
            <h3 class="subsection-label">Tab Bar</h3>
            <p class="text-xs text-[var(--text-secondary)] mb-4">Mobile tab bar with animated indicator, badges, and multiple variants. Resize to mobile to see the real component on dashboard/profile pages.</p>
            <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              <!-- Default Variant -->
              <div class="space-y-2">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Default</p>
                <div class="tab-bar-preview">
                  <div class="tab-bar-preview__screen">
                    <div class="tab-bar-preview__content">
                      <svg lucideIcon="layout" [size]="28" class="text-[var(--text-quaternary)]" />
                      <span class="text-xs text-[var(--text-tertiary)]">{{ tabBarDefaultActive() }}</span>
                    </div>
                    <app-tab-bar
                      [tabs]="tabBarDefaultTabs"
                      [(activeTab)]="tabBarDefaultActive"
                      style="position: absolute; bottom: 0; left: 0; right: 0;"
                    />
                  </div>
                </div>
              </div>

              <!-- Floating Variant -->
              <div class="space-y-2">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Floating</p>
                <div class="tab-bar-preview">
                  <div class="tab-bar-preview__screen">
                    <div class="tab-bar-preview__content">
                      <svg lucideIcon="layout" [size]="28" class="text-[var(--text-quaternary)]" />
                      <span class="text-xs text-[var(--text-tertiary)]">{{ tabBarFloatingActive() }}</span>
                    </div>
                    <app-tab-bar
                      [tabs]="tabBarFloatingTabs"
                      [(activeTab)]="tabBarFloatingActive"
                      variant="floating"
                      style="position: absolute; bottom: 0; left: 0; right: 0;"
                    />
                  </div>
                </div>
              </div>

              <!-- Minimal Variant -->
              <div class="space-y-2">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Minimal</p>
                <div class="tab-bar-preview">
                  <div class="tab-bar-preview__screen">
                    <div class="tab-bar-preview__content">
                      <svg lucideIcon="layout" [size]="28" class="text-[var(--text-quaternary)]" />
                      <span class="text-xs text-[var(--text-tertiary)]">{{ tabBarMinimalActive() }}</span>
                    </div>
                    <app-tab-bar
                      [tabs]="tabBarMinimalTabs"
                      [(activeTab)]="tabBarMinimalActive"
                      variant="minimal"
                      style="position: absolute; bottom: 0; left: 0; right: 0;"
                    />
                  </div>
                </div>
              </div>

              <!-- With Badges -->
              <div class="space-y-2">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">With Badges</p>
                <div class="tab-bar-preview">
                  <div class="tab-bar-preview__screen">
                    <div class="tab-bar-preview__content">
                      <svg lucideIcon="bell" [size]="28" class="text-[var(--text-quaternary)]" />
                      <span class="text-xs text-[var(--text-tertiary)]">{{ tabBarBadgeActive() }}</span>
                    </div>
                    <app-tab-bar
                      [tabs]="tabBarBadgeTabs"
                      [(activeTab)]="tabBarBadgeActive"
                      style="position: absolute; bottom: 0; left: 0; right: 0;"
                    />
                  </div>
                </div>
              </div>

              <!-- With Disabled -->
              <div class="space-y-2">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Disabled Tab</p>
                <div class="tab-bar-preview">
                  <div class="tab-bar-preview__screen">
                    <div class="tab-bar-preview__content">
                      <svg lucideIcon="lock" [size]="28" class="text-[var(--text-quaternary)]" />
                      <span class="text-xs text-[var(--text-tertiary)]">{{ tabBarDisabledActive() }}</span>
                    </div>
                    <app-tab-bar
                      [tabs]="tabBarDisabledTabs"
                      [(activeTab)]="tabBarDisabledActive"
                      style="position: absolute; bottom: 0; left: 0; right: 0;"
                    />
                  </div>
                </div>
              </div>

              <!-- Floating + Badges -->
              <div class="space-y-2">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Floating + Badges</p>
                <div class="tab-bar-preview">
                  <div class="tab-bar-preview__screen">
                    <div class="tab-bar-preview__content">
                      <svg lucideIcon="sparkles" [size]="28" class="text-[var(--text-quaternary)]" />
                      <span class="text-xs text-[var(--text-tertiary)]">{{ tabBarFloatingBadgeActive() }}</span>
                    </div>
                    <app-tab-bar
                      [tabs]="tabBarFloatingBadgeTabs"
                      [(activeTab)]="tabBarFloatingBadgeActive"
                      variant="floating"
                      style="position: absolute; bottom: 0; left: 0; right: 0;"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Content Tabs
           ═══════════════════════════════════════════════════ -->
      <section id="content-tabs" class="mb-16 mt-16">
        <h2 class="section-title">Content Tabs</h2>
        <div class="space-y-8">
          <!-- Interactive Content Demo -->
          <div>
            <h3 class="subsection-label">Interactive Content</h3>
            <p class="text-xs text-[var(--text-secondary)] mb-4">Click the tabs to change the content below.</p>
            <div class="border border-[var(--border-default)] rounded-2xl overflow-hidden bg-[var(--surface-primary)]">
              <div class="border-b border-[var(--border-default)] bg-[var(--surface-secondary)] px-4 pt-4">
                <app-tabs
                  [tabs]="contentTabs"
                  [(activeTab)]="contentTabInteractive"
                />
              </div>
              <div class="p-6 min-h-[160px]">
                @switch (contentTabInteractive()) {
                  @case ('overview') {
                    <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h4 class="text-lg font-semibold text-[var(--text-primary)]">Component Overview</h4>
                      <p class="text-sm text-[var(--text-secondary)] leading-relaxed">
                        Tabs organize content across different screens, data sets, and other interactions. The active tab is visually distinguished from the rest.
                      </p>
                    </div>
                  }
                  @case ('api') {
                    <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h4 class="text-lg font-semibold text-[var(--text-primary)]">API Reference</h4>
                      <div class="bg-[var(--surface-secondary)] rounded-lg p-4 font-mono text-xs text-[var(--text-secondary)]">
                        <span class="text-purple-500">interface</span> <span class="text-blue-500">TabItem</span> {{ '{' }}<br>
                        &nbsp;&nbsp;id: <span class="text-yellow-500">string</span>;<br>
                        &nbsp;&nbsp;label: <span class="text-yellow-500">string</span>;<br>
                        &nbsp;&nbsp;icon?: <span class="text-yellow-500">string</span>;<br>
                        {{ '}' }}
                      </div>
                    </div>
                  }
                  @case ('examples') {
                    <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h4 class="text-lg font-semibold text-[var(--text-primary)]">Interactive Examples</h4>
                      <div class="grid grid-cols-2 gap-4">
                        <div class="h-20 rounded-lg bg-[var(--fill-tertiary)] flex items-center justify-center">
                          <svg lucideIcon="layout" [size]="24" class="text-[var(--text-tertiary)]" />
                        </div>
                        <div class="h-20 rounded-lg bg-[var(--fill-tertiary)] flex items-center justify-center">
                          <svg lucideIcon="layers" [size]="24" class="text-[var(--text-tertiary)]" />
                        </div>
                      </div>
                    </div>
                  }
                  @case ('styling') {
                    <div class="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <h4 class="text-lg font-semibold text-[var(--text-primary)]">Design Tokens</h4>
                      <div class="flex flex-wrap gap-2">
                        <span class="px-2 py-1 bg-[var(--color-system-blue)] text-white text-xs rounded-md">--color-system-blue</span>
                        <span class="px-2 py-1 border border-[var(--border-default)] text-[var(--text-secondary)] text-xs rounded-md">--separator</span>
                        <span class="px-2 py-1 bg-[var(--fill-secondary)] text-[var(--text-primary)] text-xs rounded-md">--fill-secondary</span>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          </div>

          <!-- Variants -->
          <div>
            <h3 class="subsection-label">Variants</h3>
            <div class="flex flex-col gap-6">
              <div class="space-y-2">
                <p class="text-xs text-[var(--text-secondary)]">Underline (Default)</p>
                <app-tabs
                  [tabs]="contentTabs"
                  [(activeTab)]="contentTabUnderline"
                />
              </div>
              <div class="space-y-2">
                <p class="text-xs text-[var(--text-secondary)]">Filled (Segmented Style)</p>
                <app-tabs
                  [tabs]="contentTabs"
                  [(activeTab)]="contentTabFilled"
                  variant="filled"
                />
              </div>
              <div class="space-y-2">
                <p class="text-xs text-[var(--text-secondary)]">Pills</p>
                <app-tabs
                  [tabs]="contentTabs"
                  [(activeTab)]="contentTabPills"
                  variant="pills"
                />
              </div>
            </div>
          </div>

          <!-- Icons & Badges -->
          <div>
            <h3 class="subsection-label">Icons & Badges</h3>
            <app-tabs
              [tabs]="contentTabsWithBadges"
              [(activeTab)]="contentTabBadges"
              variant="underline"
            />
          </div>

          <!-- Vertical -->
          <div>
            <h3 class="subsection-label">Vertical Orientation</h3>
            <div class="grid grid-cols-3 gap-6">
              <app-tabs
                [tabs]="contentTabs"
                [(activeTab)]="contentTabVerticalUnderline"
                variant="underline"
                orientation="vertical"
              />
              <app-tabs
                [tabs]="contentTabs"
                [(activeTab)]="contentTabVerticalFilled"
                variant="filled"
                orientation="vertical"
              />
              <app-tabs
                [tabs]="contentTabs"
                [(activeTab)]="contentTabVerticalPills"
                variant="pills"
                orientation="vertical"
              />
            </div>
          </div>

          <!-- Sizes -->
          <div>
            <h3 class="subsection-label">Sizes</h3>
            <div class="flex flex-col gap-6 items-start">
              <app-tabs [tabs]="contentTabs" [(activeTab)]="contentTabSm" size="sm" variant="filled" />
              <app-tabs [tabs]="contentTabs" [(activeTab)]="contentTabMd" size="md" variant="filled" />
              <app-tabs [tabs]="contentTabs" [(activeTab)]="contentTabLg" size="lg" variant="filled" />
            </div>
          </div>

          <!-- Full Width -->
          <div>
            <h3 class="subsection-label">Full Width</h3>
            <div class="max-w-md border border-[var(--border-default)] rounded-xl overflow-hidden p-4 bg-[var(--surface-primary)]">
              <app-tabs
                [tabs]="contentTabs"
                [(activeTab)]="contentTabFullWidth"
                variant="underline"
                [fullWidth]="true"
              />
            </div>
          </div>

        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Listbox (CDK)
           ═══════════════════════════════════════════════════ -->
      <section id="listbox" class="mb-16 mt-16">
        <h2 class="section-title">Listbox</h2>
        <div class="grid gap-8 md:grid-cols-2">

          <!-- Single Select -->
          <div class="space-y-4">
            <h3 class="subsection-label">Single Select</h3>
            <app-listbox
              header="Appearance"
              [value]="listboxSingleValue()"
              (valueChange)="listboxSingleValue.set($event.value)"
              [attr.aria-label]="'Appearance'"
              footer="Choose your preferred theme"
            >
              @for (opt of listboxThemeOptions; track opt.value) {
                <app-listbox-option
                  [value]="opt.value"
                  [icon]="opt.icon"
                  [description]="opt.description"
                  [selected]="listboxSingleValue().includes(opt.value)"
                >
                  {{ opt.label }}
                </app-listbox-option>
              }
            </app-listbox>
          </div>

          <!-- Multi Select -->
          <div class="space-y-4">
            <h3 class="subsection-label">Multi Select</h3>
            <app-listbox
              header="Notifications"
              [value]="listboxMultiValue()"
              [multiple]="true"
              (valueChange)="listboxMultiValue.set($event.value)"
              [attr.aria-label]="'Notification preferences'"
            >
              @for (opt of listboxNotifOptions; track opt.value) {
                <app-listbox-option
                  [value]="opt.value"
                  [icon]="opt.icon"
                  [description]="opt.description"
                  [disabled]="opt.disabled ?? false"
                  [selected]="listboxMultiValue().includes(opt.value)"
                >
                  {{ opt.label }}
                </app-listbox-option>
              }
            </app-listbox>
          </div>

          <!-- Card Variant -->
          <div class="space-y-4">
            <h3 class="subsection-label">Card Variant</h3>
            <app-listbox
              [value]="listboxCardValue()"
              variant="card"
              (valueChange)="listboxCardValue.set($event.value)"
              [attr.aria-label]="'Priority level'"
            >
              @for (opt of listboxPriorityOptions; track opt.value) {
                <app-listbox-option
                  [value]="opt.value"
                  [icon]="opt.icon"
                  [trailing]="opt.trailing"
                  [selected]="listboxCardValue().includes(opt.value)"
                >
                  {{ opt.label }}
                </app-listbox-option>
              }
            </app-listbox>
          </div>

          <!-- Disabled -->
          <div class="space-y-4">
            <h3 class="subsection-label">Disabled</h3>
            <app-listbox
              header="Account"
              [value]="['profile']"
              [disabled]="true"
              [attr.aria-label]="'Account settings'"
            >
              @for (opt of listboxAccountOptions; track opt.value) {
                <app-listbox-option
                  [value]="opt.value"
                  [icon]="opt.icon"
                  [selected]="opt.value === 'profile'"
                >
                  {{ opt.label }}
                </app-listbox-option>
              }
            </app-listbox>
          </div>

        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Data Display
           ═══════════════════════════════════════════════════ -->
      <section id="data-display" class="mb-16 mt-16">
        <h2 class="section-title">Data Display</h2>
        <div class="space-y-8">

          <!-- Accordion -->
          <div>
            <h3 class="subsection-label">Accordion</h3>
            <div class="grid gap-6 md:grid-cols-2">
              <div>
                <p class="text-xs text-[var(--text-tertiary)] mb-2">Default</p>
                <app-card variant="outlined" padding="none">
                  <app-accordion [items]="accordionItems" />
                </app-card>
              </div>
              <div>
                <p class="text-xs text-[var(--text-tertiary)] mb-2">Separated + Multiple</p>
                <app-accordion [items]="accordionItems" variant="separated" [multiple]="true" />
              </div>
            </div>
          </div>

          <!-- Date Display -->
          <div>
            <h3 class="subsection-label">Date Formatting</h3>
            <app-card variant="outlined">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-[var(--text-secondary)]">Relative Time</span>
                  <span class="text-sm font-medium text-[var(--text-primary)]">{{ sampleDate | relativeTime }}</span>
                </div>
                <div class="h-px bg-[var(--separator)]"></div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-[var(--text-secondary)]">Short Format</span>
                  <span class="text-sm font-medium text-[var(--text-primary)]">{{ sampleDate | formatDate:'short' }}</span>
                </div>
                <div class="h-px bg-[var(--separator)]"></div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-[var(--text-secondary)]">Medium Format</span>
                  <span class="text-sm font-medium text-[var(--text-primary)]">{{ sampleDate | formatDate:'medium' }}</span>
                </div>
                <div class="h-px bg-[var(--separator)]"></div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-[var(--text-secondary)]">Long Format</span>
                  <span class="text-sm font-medium text-[var(--text-primary)]">{{ sampleDate | formatDate:'long' }}</span>
                </div>
                <div class="h-px bg-[var(--separator)]"></div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-[var(--text-secondary)]">Time Only</span>
                  <span class="text-sm font-medium text-[var(--text-primary)]">{{ sampleDate | formatDate:'time' }}</span>
                </div>
              </div>
            </app-card>
          </div>

          <!-- Icons -->
          <div>
            <h3 class="subsection-label">Icons</h3>
            <div class="flex flex-wrap items-center gap-4 text-[var(--text-secondary)]">
              @for (icon of iconNames; track icon) {
                <div class="flex flex-col items-center gap-1" [appTooltip]="icon">
                  <svg [lucideIcon]="icon" [size]="22" />
                  <span class="text-[10px] text-[var(--text-tertiary)]">{{ icon }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Overlays
           ═══════════════════════════════════════════════════ -->
      <section id="overlays" class="mb-16 mt-16">
        <h2 class="section-title">Overlays</h2>
        <div class="space-y-8">

          <!-- Modal -->
          <div>
            <h3 class="subsection-label">Modal</h3>
            <div class="flex flex-wrap gap-3">
              <button appButton variant="tinted" (click)="showModal()">Open Modal</button>
            </div>
          </div>

          <!-- Confirm Dialog -->
          <div>
            <h3 class="subsection-label">Confirm Dialog</h3>
            <div class="flex flex-wrap gap-3">
              <button appButton variant="tinted" (click)="showConfirm()">Confirm Action</button>
              <button appButton variant="destructive" (click)="showDestructiveConfirm()">Delete Item</button>
            </div>
          </div>

          <!-- Bottom Sheet -->
          <div>
            <h3 class="subsection-label">Bottom Sheet</h3>
            <div class="flex flex-wrap gap-3">
              <button appButton variant="tinted" (click)="showBottomSheet()">Open Bottom Sheet</button>
            </div>
          </div>

          <!-- Action Sheet -->
          <div>
            <h3 class="subsection-label">Action Sheet</h3>
            <div class="flex flex-wrap gap-3">
              <button appButton variant="tinted" (click)="showActionSheet()">Action Sheet</button>
            </div>
          </div>

          <!-- Context Menu -->
          <div>
            <h3 class="subsection-label">Context Menu</h3>
            <app-card variant="outlined" [interactive]="true">
              <div
                class="flex items-center justify-center gap-2 py-6 text-sm text-[var(--text-secondary)] cursor-context-menu select-none"
                (contextmenu)="onContextMenu($event)"
              >
                <svg lucideIcon="menu" [size]="16" />
                Right-click here for context menu
              </div>
            </app-card>
          </div>

          <!-- Popover -->
          <div>
            <h3 class="subsection-label">Popover</h3>
            <div class="flex flex-wrap gap-3">
              <button
                appButton variant="gray"
                [appPopover]="'This popover appears below the trigger. Great for supplementary information.'"
                popoverTitle="Bottom Popover"
                popoverPosition="bottom"
              >Popover Bottom</button>
              <button
                appButton variant="gray"
                [appPopover]="'This popover appears above the trigger element.'"
                popoverTitle="Top Popover"
                popoverPosition="top"
              >Popover Top</button>
              <button
                appButton variant="gray"
                [appPopover]="'Positioned to the left of the trigger.'"
                popoverTitle="Left Popover"
                popoverPosition="left"
              >Popover Left</button>
              <button
                appButton variant="gray"
                [appPopover]="'Positioned to the right of the trigger.'"
                popoverTitle="Right Popover"
                popoverPosition="right"
              >Popover Right</button>
            </div>
          </div>

          <!-- Tooltip -->
          <div>
            <h3 class="subsection-label">Tooltip</h3>
            <div class="flex flex-wrap gap-3">
              <button
                appButton variant="gray"
                [appTooltip]="'This is a tooltip!'"
                tooltipPosition="top"
                [tooltipDelay]="200"
              >Hover for Tooltip</button>
            </div>
          </div>
        </div>
      </section>


      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Carousel
           ═══════════════════════════════════════════════════ -->
      <section id="carousel" class="mb-16 mt-16">
        <h2 class="section-title">Carousel</h2>
        <div class="space-y-12">

          <!-- Default with Peek -->
          <div>
            <h3 class="subsection-label">Default with Peek</h3>
            <app-carousel title="Featured" [peek]="true">
              @for (card of carouselCards; track card.title) {
                <div appCarouselSlide
                  class="carousel-demo-card"
                  [style.background]="card.gradient"
                >
                  <span class="carousel-demo-icon">{{ card.icon }}</span>
                  <span class="carousel-demo-label">{{ card.title }}</span>
                  <span class="carousel-demo-desc">{{ card.subtitle }}</span>
                </div>
              }
            </app-carousel>
          </div>

          <!-- Card Variant -->
          <div>
            <h3 class="subsection-label">Card Variant</h3>
            <app-carousel variant="card" title="Explore" [peek]="false">
              @for (feature of carouselFeatures; track feature.title) {
                <div appCarouselSlide class="carousel-feature-slide">
                  <div class="carousel-feature-icon-wrap" [style.background]="feature.color">
                    <svg [lucideIcon]="feature.icon" [size]="24" />
                  </div>
                  <div class="carousel-feature-body">
                    <p class="carousel-feature-title">{{ feature.title }}</p>
                    <p class="carousel-feature-desc">{{ feature.description }}</p>
                  </div>
                </div>
              }
            </app-carousel>
          </div>

          <!-- Full-bleed with Autoplay -->
          <div>
            <h3 class="subsection-label">Full-bleed + Autoplay</h3>
            <app-carousel variant="fullbleed" [peek]="false" [showArrows]="true" [autoplay]="4000">
              @for (banner of carouselBanners; track banner.title) {
                <div appCarouselSlide
                  class="carousel-banner-slide"
                  [style.background]="banner.gradient"
                >
                  <div class="carousel-banner-content">
                    <span class="carousel-banner-badge">{{ banner.badge }}</span>
                    <h4 class="carousel-banner-title">{{ banner.title }}</h4>
                    <p class="carousel-banner-desc">{{ banner.description }}</p>
                  </div>
                </div>
              }
            </app-carousel>
          </div>

        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Tree
           ═══════════════════════════════════════════════════ -->
      <section id="tree" class="mb-16 mt-16">
        <h2 class="section-title">Tree</h2>
        <div class="space-y-8">

          <!-- Basic File Tree -->
          <div>
            <h3 class="subsection-label">Basic File Tree</h3>
            <div class="max-w-lg">
              <app-tree
                [data]="fileTreeData"
                [expandAllOnInit]="true"
                (nodeClick)="toastService.info('Clicked: ' + $event.label)"
              />
            </div>
          </div>

          <!-- Selectable Tree -->
          <div>
            <h3 class="subsection-label">Selectable with Tri-state</h3>
            <div class="max-w-lg">
              <app-tree
                [data]="fileTreeData"
                [selectable]="true"
                [expandAllOnInit]="true"
                (selectionChange)="toastService.info('Selected: ' + $event.length + ' items')"
              />
            </div>
          </div>

          <!-- Editable + Context Menu -->
          <div>
            <h3 class="subsection-label">Editable + Context Menu</h3>
            <p class="text-xs text-[var(--text-tertiary)] mb-2">Double-click to rename · Right-click for context menu</p>
            <div class="max-w-lg">
              <app-tree
                [data]="editableTreeData"
                [editable]="true"
                [expandAllOnInit]="true"
                (nodeEdit)="onTreeNodeEdit($event)"
                (contextAction)="onTreeContextAction($event)"
              />
            </div>
          </div>

          <!-- Draggable Tree -->
          <div>
            <h3 class="subsection-label">Draggable</h3>
            <p class="text-xs text-[var(--text-tertiary)] mb-2">Drag nodes by the grip handle to reorder</p>
            <div class="max-w-lg">
              <app-tree
                [data]="draggableTreeData"
                [draggable]="true"
                [expandAllOnInit]="true"
                (nodeDrop)="toastService.info('Moved: ' + $event.node.label)"
              />
            </div>
          </div>

          <!-- Searchable + Lines -->
          <div>
            <h3 class="subsection-label">Searchable with Connecting Lines</h3>
            <div class="max-w-lg">
              <app-tree
                [data]="fileTreeData"
                [searchable]="true"
                [showLines]="true"
                [expandAllOnInit]="true"
              />
            </div>
          </div>

        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Utility
           ═══════════════════════════════════════════════════ -->
      <section id="utility" class="mb-16 mt-16">
        <h2 class="section-title">Utility</h2>
        <div class="space-y-8">

          <!-- Kbd -->
          <div>
            <h3 class="subsection-label">Keyboard Shortcuts</h3>
            <div class="flex flex-wrap items-center gap-6">
              <div class="flex items-center gap-2">
                <span class="text-sm text-[var(--text-secondary)]">Search</span>
                <app-kbd keys="⌘ + K" />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-[var(--text-secondary)]">Save</span>
                <app-kbd keys="⌘ + S" />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-[var(--text-secondary)]">Undo</span>
                <app-kbd keys="⌘ + Z" />
              </div>
              <div class="flex items-center gap-2">
                <span class="text-sm text-[var(--text-secondary)]">Settings</span>
                <app-kbd keys="⌘ + ," size="md" />
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div>
            <h3 class="subsection-label">Divider</h3>
            <div class="space-y-3 max-w-md">
              <p class="text-sm text-[var(--text-secondary)]">Content above</p>
              <app-divider />
              <p class="text-sm text-[var(--text-secondary)]">Content below</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════════════════════════════════════════
           Section: Paginator
           ═══════════════════════════════════════════════════ -->
      <section id="paginator" class="mb-16 mt-16">
        <h2 class="section-title">Paginator</h2>
        <div class="space-y-8">

          <!-- Default -->
          <div>
            <h3 class="subsection-label">Default</h3>
            <app-paginator
              [currentPage]="paginatorPage()"
              [totalPages]="24"
              (pageChange)="paginatorPage.set($event)"
            />
          </div>

          <!-- With Page Info -->
          <div>
            <h3 class="subsection-label">With Page Info</h3>
            <app-paginator
              [currentPage]="paginatorInfoPage()"
              [totalPages]="12"
              [showPageInfo]="true"
              (pageChange)="paginatorInfoPage.set($event)"
            />
          </div>

          <!-- Small -->
          <div>
            <h3 class="subsection-label">Small</h3>
            <app-paginator
              class="paginator-sm"
              [currentPage]="paginatorSmPage()"
              [totalPages]="30"
              [maxVisiblePages]="5"
              (pageChange)="paginatorSmPage.set($event)"
            />
          </div>

          <!-- Large -->
          <div>
            <h3 class="subsection-label">Large</h3>
            <app-paginator
              class="paginator-lg"
              [currentPage]="paginatorLgPage()"
              [totalPages]="8"
              [showPageInfo]="true"
              (pageChange)="paginatorLgPage.set($event)"
            />
          </div>

          <!-- Few Pages (no ellipsis) -->
          <div>
            <h3 class="subsection-label">Few Pages (No Ellipsis)</h3>
            <app-paginator
              [currentPage]="paginatorFewPage()"
              [totalPages]="4"
              (pageChange)="paginatorFewPage.set($event)"
            />
          </div>

        </div>
      </section>

      <app-divider />

      <!-- ═══════════════════════════════════════════════════
           Section: Data Table
           ═══════════════════════════════════════════════════ -->
      <section id="data-table" class="mb-16 mt-16">
        <h2 class="section-title">Data Table</h2>
        <div class="space-y-10">

          <!-- Basic Sortable -->
          <div>
            <h3 class="subsection-label">Basic with Sorting</h3>
            <app-data-table
              [columns]="dtBasicColumns"
              [data]="dtEmployees"
              [trackByFn]="dtTrackById"
              [pageSize]="5"
              [searchable]="true"
              searchPlaceholder="Search employees…"
            >
              <ng-template appDataTableCell="status" let-row>
                <app-badge
                  [variant]="row.status === 'Active' ? 'success' : row.status === 'Away' ? 'warning' : 'neutral'"
                  [subtle]="true"
                >{{ row.status }}</app-badge>
              </ng-template>
            </app-data-table>
          </div>

          <!-- Selectable with Custom Cells -->
          <div>
            <h3 class="subsection-label">Selectable with Custom Cells</h3>
            <app-data-table
              [columns]="dtUserColumns"
              [data]="dtUsers"
              [trackByFn]="dtTrackById"
              [selectable]="true"
              [pageSize]="5"
              searchPlaceholder="Search users…"
              (selectionChange)="onDtSelectionChange($event)"
            >
              <ng-template appDataTableCell="name" let-row>
                <div class="flex items-center gap-3">
                  <app-avatar [name]="row.name" size="xs" />
                  <div>
                    <div class="text-sm font-medium text-[var(--text-primary)]">{{ row.name }}</div>
                    <div class="text-xs text-[var(--text-tertiary)]">{{ row.email }}</div>
                  </div>
                </div>
              </ng-template>
              <ng-template appDataTableCell="role" let-row>
                <app-badge variant="info" [subtle]="true">{{ row.role }}</app-badge>
              </ng-template>
              <ng-template appDataTableCell="status" let-row>
                <div class="flex items-center gap-1.5">
                  <span
                    class="inline-block w-2 h-2 rounded-full"
                    [class]="row.status === 'Active' ? 'bg-[var(--color-system-green)]' : row.status === 'Inactive' ? 'bg-[var(--text-quaternary)]' : 'bg-[var(--color-system-orange)]'"
                  ></span>
                  <span class="text-sm text-[var(--text-secondary)]">{{ row.status }}</span>
                </div>
              </ng-template>
            </app-data-table>
          </div>

          <!-- Expandable Rows -->
          <div>
            <h3 class="subsection-label">Expandable Rows</h3>
            <app-data-table
              [columns]="dtOrderColumns"
              [data]="dtOrders"
              [trackByFn]="dtTrackById"
              [expandable]="true"
              [expandedRowTemplate]="orderDetailTmpl"
              [pageSize]="5"
              [searchable]="false"
            >
              <ng-template appDataTableCell="total" let-row>
                <span class="font-semibold tabular-nums text-[var(--text-primary)]">{{ row.total }}</span>
              </ng-template>
              <ng-template appDataTableCell="status" let-row>
                <app-badge
                  [variant]="row.status === 'Delivered' ? 'success' : row.status === 'Shipped' ? 'info' : row.status === 'Processing' ? 'warning' : 'neutral'"
                >{{ row.status }}</app-badge>
              </ng-template>
            </app-data-table>

            <ng-template #orderDetailTmpl let-row>
              <div class="grid gap-4 md:grid-cols-3">
                <div>
                  <p class="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Shipping Address</p>
                  <p class="text-sm text-[var(--text-primary)]">{{ row.address }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Payment Method</p>
                  <p class="text-sm text-[var(--text-primary)]">{{ row.payment }}</p>
                </div>
                <div>
                  <p class="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Notes</p>
                  <p class="text-sm text-[var(--text-secondary)] italic">{{ row.notes }}</p>
                </div>
              </div>
            </ng-template>
          </div>

          <!-- Striped -->
          <div>
            <h3 class="subsection-label">Striped Rows</h3>
            <app-data-table
              [columns]="dtProductColumns"
              [data]="dtProducts"
              [trackByFn]="dtTrackById"
              [striped]="true"
              [pageSize]="5"
              [searchable]="true"
              searchPlaceholder="Search products…"
            >
              <ng-template appDataTableCell="price" let-row>
                <span class="font-semibold tabular-nums">{{ row.price }}</span>
              </ng-template>
              <ng-template appDataTableCell="stock" let-row>
                <app-badge
                  [variant]="row.stock > 50 ? 'success' : row.stock > 10 ? 'warning' : 'error'"
                  [subtle]="true"
                >{{ row.stock }} units</app-badge>
              </ng-template>
            </app-data-table>
          </div>

          <!-- Loading State -->
          <div>
            <h3 class="subsection-label">Loading State</h3>
            <app-data-table
              [columns]="dtBasicColumns"
              [data]="[]"
              [trackByFn]="dtTrackById"
              [loading]="true"
            />
          </div>

          <!-- Empty State -->
          <div>
            <h3 class="subsection-label">Empty State</h3>
            <app-data-table
              [columns]="dtBasicColumns"
              [data]="[]"
              [trackByFn]="dtTrackById"
              [searchable]="false"
              emptyIcon="database"
              emptyTitle="No records found"
              emptyDescription="Add new records to get started with your data."
            />
          </div>

        </div>
      </section>

    </main>

    <!-- Bottom toolbar demo -->
    <app-toolbar ariaLabel="Page actions" variant="prominent">
      <span toolbar-leading class="text-xs text-[var(--text-tertiary)]">40 components</span>
      <button appButton variant="gray" size="sm" [rounded]="true" (click)="toastService.info('Shared!')">
        <svg lucideIcon="share" [size]="14" /> Share
      </button>
      <button toolbar-trailing appButton variant="filled" size="sm" [rounded]="true">
        <svg lucideIcon="download" [size]="14" /> Export
      </button>
    </app-toolbar>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
    }

    .section-title {
      font: var(--type-title-2);
      color: var(--text-primary);
      margin-bottom: 1rem;
    }

    .subsection-label {
      font: var(--type-footnote);
      font-weight: 600;
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.75rem;
    }

    /* ── Carousel Demo Slides ──────────────────────────── */
    .carousel-demo-card {
      width: 220px;
      height: 280px;
      border-radius: var(--radius-xl);
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: flex-end;
      padding: 20px;
      color: #fff;
      position: relative;
      overflow: hidden;
    }

    .carousel-demo-card::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, oklch(0% 0 0 / 0.4), transparent 60%);
      pointer-events: none;
    }

    .carousel-demo-icon {
      font-size: 2.5rem;
      position: relative;
      z-index: 1;
      margin-bottom: 8px;
      filter: drop-shadow(0 2px 6px oklch(0% 0 0 / 0.25));
    }

    .carousel-demo-label {
      font: var(--type-headline);
      position: relative;
      z-index: 1;
      text-shadow: 0 1px 4px oklch(0% 0 0 / 0.3);
    }

    .carousel-demo-desc {
      font: var(--type-caption-1);
      opacity: 0.85;
      position: relative;
      z-index: 1;
      margin-top: 2px;
    }

    /* Card variant slides */
    .carousel-feature-slide {
      width: 260px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .carousel-feature-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .carousel-feature-body {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .carousel-feature-title {
      font: var(--type-headline);
      color: var(--text-primary);
      margin: 0;
    }

    .carousel-feature-desc {
      font: var(--type-caption-1);
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    }

    /* Full-bleed banner slides */
    .carousel-banner-slide {
      width: 100%;
      min-height: 240px;
      display: flex;
      align-items: flex-end;
      padding: 32px 28px;
      position: relative;
      border-radius: var(--radius-xl);
      overflow: hidden;
    }

    .carousel-banner-slide::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, oklch(0% 0 0 / 0.55), oklch(0% 0 0 / 0.05) 70%);
      pointer-events: none;
    }

    .carousel-banner-content {
      position: relative;
      z-index: 1;
      color: #fff;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .carousel-banner-badge {
      font: var(--type-caption-1);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      opacity: 0.85;
    }

    .carousel-banner-title {
      font: var(--type-title-2);
      margin: 0;
      text-shadow: 0 2px 8px oklch(0% 0 0 / 0.3);
    }

    .carousel-banner-desc {
      font: var(--type-subheadline);
      opacity: 0.9;
      margin: 0;
      max-width: 400px;
    }
    /* ── Tab Bar Preview (phone frame) ──────────────────── */
    .tab-bar-preview {
      border-radius: var(--radius-xl);
      border: 1.5px solid var(--border-default);
      overflow: hidden;
      background: var(--surface-grouped);
    }

    .tab-bar-preview__screen {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .tab-bar-preview__content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 100%;
      padding-bottom: 56px;
    }

    /* Override fixed positioning for tab bar inside preview frames */
    /* stylelint-disable-next-line selector-pseudo-element-no-unknown */
    .tab-bar-preview ::ng-deep app-tab-bar {
      position: absolute !important;
      z-index: 1;
    }
  `],
})
export class ShowcaseComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly actionSheetService = inject(ActionSheetService);
  private readonly modalService = inject(ModalService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly bottomSheetService = inject(BottomSheetService);
  private readonly contextMenuService = inject(ContextMenuService);

  // --- Date Picker state ---
  protected readonly selectedDate = signal<Date | null>(null);
  protected readonly eventDate = signal<Date | null>(null);
  protected readonly shortFormatDate = signal<Date | null>(null);
  protected readonly dateRange = signal<DateRange>({ start: null, end: null });
  protected readonly bookingRange = signal<DateRange>({ start: null, end: null });
  protected readonly constrainedDate = signal<Date | null>(null);
  protected readonly mondayStartDate = signal<Date | null>(null);
  protected readonly today = new Date();

  // --- Time Picker state ---
  protected readonly selectedTime = signal<TimeValue | null>(null);
  protected readonly meetingTime = signal<TimeValue | null>({ hours: 10, minutes: 30 });
  protected readonly departureTime = signal<TimeValue | null>(null);
  protected readonly maintenanceTime = signal<TimeValue | null>({ hours: 2, minutes: 0 });
  protected readonly appointmentTime = signal<TimeValue | null>(null);
  protected readonly quickSlotTime = signal<TimeValue | null>(null);

  // Range state
  protected readonly workHoursRange = signal<TimeRange>({ start: null, end: null });
  protected readonly shiftRange = signal<TimeRange>({ start: null, end: null });
  protected readonly businessHoursRange = signal<TimeRange>({
    start: { hours: 9, minutes: 0 },
    end: { hours: 17, minutes: 0 },
  });

  // --- Form state ---
  protected readonly emailVal = signal('');
  protected readonly nameVal = signal('');
  protected readonly counterVal = signal('');
  protected readonly searchVal = signal('');
  protected readonly selectedCountry = signal('');
  protected toggleA = signal(true);
  protected toggleB = signal(false);
  protected checkA = signal(false);
  protected checkB = signal(true);
  protected sliderVal = signal(65);
  protected brightnessVal = signal(50);
  protected stepperVal = signal(3);
  protected radioValue = signal('system');
  protected radioCardValue = signal('dark');

  protected readonly segmentOptions: SegmentOption[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];
  protected readonly segmentValue = signal('all');

  // --- Data ---
  protected readonly sampleDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

  protected readonly radioOptions: RadioOption[] = [
    { value: 'light', label: 'Light', description: 'Use light appearance' },
    { value: 'dark', label: 'Dark', description: 'Use dark appearance' },
    { value: 'system', label: 'System', description: 'Match system setting' },
  ];

  protected readonly countryOptions: SelectOption[] = [
    { value: 'us', label: 'United States', icon: 'globe' },
    { value: 'uk', label: 'United Kingdom', icon: 'globe' },
    { value: 'de', label: 'Germany', icon: 'globe' },
    { value: 'jp', label: 'Japan', icon: 'globe' },
    { value: 'au', label: 'Australia', icon: 'globe' },
  ];

  // --- Advanced Select state ---
  protected readonly selectLanguage = signal('');
  protected readonly selectNotification = signal('');
  protected readonly selectPermissions = signal<string[]>([]);
  protected readonly selectFruits = signal<string[]>([]);
  protected readonly selectAppIcon = signal('');
  protected readonly selectClearableCountry = signal('');

  protected readonly selectLanguageOptions: SelectOption[] = [
    { value: 'typescript', label: 'TypeScript', icon: 'hash', description: 'Typed JavaScript' },
    { value: 'python', label: 'Python', icon: 'hash', description: 'General purpose' },
    { value: 'rust', label: 'Rust', icon: 'hash', description: 'Systems programming' },
    { value: 'go', label: 'Go', icon: 'hash', description: 'Cloud & backend' },
    { value: 'swift', label: 'Swift', icon: 'hash', description: 'Apple platforms' },
    { value: 'kotlin', label: 'Kotlin', icon: 'hash', description: 'Android & JVM' },
    { value: 'dart', label: 'Dart', icon: 'hash', description: 'Flutter framework' },
    { value: 'elixir', label: 'Elixir', icon: 'hash', description: 'Functional & concurrent' },
  ];

  protected readonly selectNotificationOptions: SelectOption[] = [
    { value: 'email', label: 'Email', icon: 'mail', description: 'Send via email' },
    { value: 'sms', label: 'SMS', icon: 'smartphone', description: 'Send via text message' },
    { value: 'push', label: 'Push Notification', icon: 'bell', description: 'Instant push alerts' },
    { value: 'slack', label: 'Slack', icon: 'message-circle', description: 'Post to channel' },
    { value: 'none', label: 'None', icon: 'volume', description: 'Disable notifications', disabled: true },
  ];

  protected readonly selectPermissionGroups: SelectGroup[] = [
    {
      label: 'Content',
      options: [
        { value: 'read', label: 'Read', icon: 'eye', description: 'View content' },
        { value: 'write', label: 'Write', icon: 'edit', description: 'Create & edit content' },
        { value: 'delete', label: 'Delete', icon: 'trash', description: 'Remove content' },
      ],
    },
    {
      label: 'Administration',
      options: [
        { value: 'users', label: 'Manage Users', icon: 'users', description: 'Add & remove users' },
        { value: 'settings', label: 'Settings', icon: 'settings', description: 'Configure system' },
        { value: 'billing', label: 'Billing', icon: 'dollar-sign', description: 'Manage payments' },
      ],
    },
    {
      label: 'Security',
      options: [
        { value: 'audit', label: 'Audit Log', icon: 'activity', description: 'View activity' },
        { value: 'api-keys', label: 'API Keys', icon: 'key', description: 'Manage API access' },
      ],
    },
  ];

  protected readonly selectFruitOptions: SelectOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'grape', label: 'Grape' },
    { value: 'mango', label: 'Mango' },
    { value: 'orange', label: 'Orange' },
    { value: 'peach', label: 'Peach' },
    { value: 'strawberry', label: 'Strawberry' },
  ];

  protected readonly selectAppIconOptions: SelectOption[] = [
    { value: 'home', label: 'Home', icon: 'home', description: 'Main screen' },
    { value: 'settings', label: 'Settings', icon: 'settings', description: 'App configuration' },
    { value: 'user', label: 'Profile', icon: 'user', description: 'Account details' },
    { value: 'bell', label: 'Notifications', icon: 'bell', description: 'Alert preferences' },
    { value: 'mail', label: 'Messages', icon: 'mail', description: 'Inbox & outbox' },
    { value: 'camera', label: 'Camera', icon: 'camera', description: 'Capture photos' },
    { value: 'heart', label: 'Favorites', icon: 'heart', description: 'Saved items' },
    { value: 'star', label: 'Ratings', icon: 'star', description: 'Reviews & ratings' },
  ];

  // --- Dropdown state ---
  protected readonly selectedNotification = signal('');
  protected readonly ddCountry = signal('');
  protected readonly selectedLanguage = signal('');
  protected readonly selectedAppIcon = signal('');
  protected readonly selectedPermissions = signal<string[]>([]);
  protected readonly selectedFruits = signal<string[]>([]);

  protected readonly notificationOptions: DropdownOption[] = [
    { value: 'email', label: 'Email', icon: 'mail', description: 'Send via email' },
    { value: 'sms', label: 'SMS', icon: 'smartphone', description: 'Send via text message' },
    { value: 'push', label: 'Push Notification', icon: 'bell', description: 'Instant push alerts' },
    { value: 'slack', label: 'Slack', icon: 'message-circle', description: 'Post to channel' },
    { value: 'none', label: 'None', icon: 'volume', description: 'Disable notifications', disabled: true },
  ];

  protected readonly dropdownCountryOptions: DropdownOption[] = [
    { value: 'us', label: 'United States', icon: 'globe' },
    { value: 'uk', label: 'United Kingdom', icon: 'globe' },
    { value: 'de', label: 'Germany', icon: 'globe' },
    { value: 'jp', label: 'Japan', icon: 'globe' },
    { value: 'au', label: 'Australia', icon: 'globe' },
    { value: 'ca', label: 'Canada', icon: 'globe' },
    { value: 'fr', label: 'France', icon: 'globe' },
    { value: 'br', label: 'Brazil', icon: 'globe' },
  ];

  protected readonly languageOptions: DropdownOption[] = [
    { value: 'typescript', label: 'TypeScript', icon: 'hash', description: 'Typed JavaScript' },
    { value: 'python', label: 'Python', icon: 'hash', description: 'General purpose' },
    { value: 'rust', label: 'Rust', icon: 'hash', description: 'Systems programming' },
    { value: 'go', label: 'Go', icon: 'hash', description: 'Cloud & backend' },
    { value: 'swift', label: 'Swift', icon: 'hash', description: 'Apple platforms' },
    { value: 'kotlin', label: 'Kotlin', icon: 'hash', description: 'Android & JVM' },
    { value: 'dart', label: 'Dart', icon: 'hash', description: 'Flutter framework' },
    { value: 'elixir', label: 'Elixir', icon: 'hash', description: 'Functional & concurrent' },
  ];

  protected readonly appIconOptions: DropdownOption[] = [
    { value: 'home', label: 'Home', icon: 'home' },
    { value: 'settings', label: 'Settings', icon: 'settings' },
    { value: 'user', label: 'Profile', icon: 'user' },
    { value: 'bell', label: 'Notifications', icon: 'bell' },
    { value: 'mail', label: 'Messages', icon: 'mail' },
    { value: 'camera', label: 'Camera', icon: 'camera' },
    { value: 'heart', label: 'Favorites', icon: 'heart' },
    { value: 'star', label: 'Ratings', icon: 'star' },
  ];

  protected readonly permissionGroups: DropdownGroup[] = [
    {
      label: 'Content',
      options: [
        { value: 'read', label: 'Read', icon: 'eye', description: 'View content' },
        { value: 'write', label: 'Write', icon: 'edit', description: 'Create & edit content' },
        { value: 'delete', label: 'Delete', icon: 'trash', description: 'Remove content' },
      ],
    },
    {
      label: 'Administration',
      options: [
        { value: 'users', label: 'Manage Users', icon: 'users', description: 'Add & remove users' },
        { value: 'settings', label: 'Settings', icon: 'settings', description: 'Configure system' },
        { value: 'billing', label: 'Billing', icon: 'dollar-sign', description: 'Manage payments' },
      ],
    },
    {
      label: 'Security',
      options: [
        { value: 'audit', label: 'Audit Log', icon: 'activity', description: 'View activity' },
        { value: 'api-keys', label: 'API Keys', icon: 'key', description: 'Manage API access' },
      ],
    },
  ];

  protected readonly fruitOptions: DropdownOption[] = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'grape', label: 'Grape' },
    { value: 'mango', label: 'Mango' },
    { value: 'orange', label: 'Orange' },
    { value: 'peach', label: 'Peach' },
    { value: 'strawberry', label: 'Strawberry' },
  ];

  protected readonly chipLabels = ['Swift', 'Angular', 'TypeScript', 'Design', 'iOS', 'Web'];
  protected readonly selectedChips = signal(new Set(['Angular', 'TypeScript']));

  // --- Listbox state ---
  protected readonly listboxSingleValue = signal<readonly string[]>(['system']);
  protected readonly listboxMultiValue = signal<readonly string[]>(['push', 'email']);
  protected readonly listboxCardValue = signal<readonly string[]>(['medium']);

  // --- Paginator state ---
  protected readonly paginatorPage = signal(1);
  protected readonly paginatorInfoPage = signal(5);
  protected readonly paginatorSmPage = signal(1);
  protected readonly paginatorLgPage = signal(3);
  protected readonly paginatorFewPage = signal(2);

  // --- Data Table state ---
  protected readonly dtTrackById = (item: Record<string, unknown>) => item['id'] as string | number;

  protected readonly dtBasicColumns: DataTableColumnDef[] = [
    { key: 'name', header: 'Name', sortable: true, sticky: true },
    { key: 'department', header: 'Department', sortable: true },
    { key: 'title', header: 'Title' },
    { key: 'status', header: 'Status', templateKey: 'status', width: '120px', align: 'center' },
  ];

  protected readonly dtEmployees: Record<string, unknown>[] = [
    { id: 1, name: 'Alice Chen', department: 'Engineering', title: 'Staff Engineer', status: 'Active' },
    { id: 2, name: 'Bob Martinez', department: 'Design', title: 'Lead Designer', status: 'Active' },
    { id: 3, name: 'Carol White', department: 'Product', title: 'Product Manager', status: 'Away' },
    { id: 4, name: 'David Kim', department: 'Engineering', title: 'Senior Engineer', status: 'Active' },
    { id: 5, name: 'Eva Johansson', department: 'Marketing', title: 'Head of Growth', status: 'Offline' },
    { id: 6, name: 'Frank Muller', department: 'Engineering', title: 'Frontend Engineer', status: 'Active' },
    { id: 7, name: 'Grace Okafor', department: 'Design', title: 'UX Researcher', status: 'Active' },
    { id: 8, name: 'Hiro Tanaka', department: 'Product', title: 'TPM', status: 'Away' },
    { id: 9, name: 'Ivy Patel', department: 'Engineering', title: 'Backend Engineer', status: 'Active' },
    { id: 10, name: 'James Lee', department: 'Marketing', title: 'Content Strategist', status: 'Active' },
    { id: 11, name: 'Karen Singh', department: 'Engineering', title: 'DevOps Engineer', status: 'Offline' },
    { id: 12, name: 'Leo Rossi', department: 'Design', title: 'Visual Designer', status: 'Active' },
  ];

  protected readonly dtUserColumns: DataTableColumnDef[] = [
    { key: 'name', header: 'User', sortable: true, templateKey: 'name', minWidth: '220px' },
    { key: 'role', header: 'Role', templateKey: 'role', width: '140px' },
    { key: 'location', header: 'Location', sortable: true },
    { key: 'status', header: 'Status', templateKey: 'status', width: '120px' },
    { key: 'joined', header: 'Joined', sortable: true, align: 'end', width: '120px' },
  ];

  protected readonly dtUsers: Record<string, unknown>[] = [
    { id: 101, name: 'Sarah Connor', email: 'sarah@skynet.io', role: 'Admin', location: 'Los Angeles', status: 'Active', joined: '2024-01-15' },
    { id: 102, name: 'John Wick', email: 'john@continental.com', role: 'Editor', location: 'New York', status: 'Active', joined: '2024-02-20' },
    { id: 103, name: 'Ellen Ripley', email: 'ripley@weyland.corp', role: 'Viewer', location: 'Gateway Station', status: 'Inactive', joined: '2023-11-05' },
    { id: 104, name: 'Tony Stark', email: 'tony@stark.ind', role: 'Admin', location: 'Malibu', status: 'Active', joined: '2023-09-12' },
    { id: 105, name: 'Lara Croft', email: 'lara@croft.manor', role: 'Editor', location: 'London', status: 'Away', joined: '2024-03-01' },
    { id: 106, name: 'Bruce Wayne', email: 'bruce@wayne.ent', role: 'Admin', location: 'Gotham', status: 'Active', joined: '2023-06-18' },
    { id: 107, name: 'Natasha Romanoff', email: 'natasha@shield.org', role: 'Editor', location: 'Moscow', status: 'Inactive', joined: '2024-04-22' },
    { id: 108, name: 'Peter Parker', email: 'peter@bugle.nyc', role: 'Viewer', location: 'Queens', status: 'Active', joined: '2024-05-10' },
  ];

  protected readonly dtOrderColumns: DataTableColumnDef[] = [
    { key: 'orderId', header: 'Order ID', sortable: true, width: '130px' },
    { key: 'customer', header: 'Customer', sortable: true },
    { key: 'date', header: 'Date', sortable: true },
    { key: 'total', header: 'Total', templateKey: 'total', align: 'end', width: '120px', sortable: true },
    { key: 'status', header: 'Status', templateKey: 'status', width: '130px', align: 'center' },
  ];

  protected readonly dtOrders: Record<string, unknown>[] = [
    { id: 'o1', orderId: '#ORD-2401', customer: 'Alice Chen', date: '2024-06-01', total: '$429.00', status: 'Delivered', address: '123 Main St, SF, CA 94102', payment: 'Visa **** 4242', notes: 'Left at front door' },
    { id: 'o2', orderId: '#ORD-2402', customer: 'Bob Martinez', date: '2024-06-03', total: '$89.50', status: 'Shipped', address: '456 Oak Ave, LA, CA 90001', payment: 'Apple Pay', notes: 'Signature required' },
    { id: 'o3', orderId: '#ORD-2403', customer: 'Carol White', date: '2024-06-05', total: '$1,250.00', status: 'Processing', address: '789 Pine Rd, NYC, NY 10001', payment: 'Mastercard **** 5555', notes: 'Gift wrap requested' },
    { id: 'o4', orderId: '#ORD-2404', customer: 'David Kim', date: '2024-06-06', total: '$64.99', status: 'Delivered', address: '321 Elm Blvd, SEA, WA 98101', payment: 'PayPal', notes: 'No special instructions' },
    { id: 'o5', orderId: '#ORD-2405', customer: 'Eva Johansson', date: '2024-06-08', total: '$799.00', status: 'Pending', address: '654 Birch Ln, CHI, IL 60601', payment: 'Visa **** 1234', notes: 'Express delivery' },
    { id: 'o6', orderId: '#ORD-2406', customer: 'Frank Muller', date: '2024-06-10', total: '$215.75', status: 'Shipped', address: '987 Cedar Dr, ATX, TX 73301', payment: 'Google Pay', notes: 'Contact-free delivery' },
    { id: 'o7', orderId: '#ORD-2407', customer: 'Grace Okafor', date: '2024-06-12', total: '$3,100.00', status: 'Delivered', address: '147 Maple Way, MIA, FL 33101', payment: 'Amex **** 3782', notes: 'Business order - invoice needed' },
  ];

  protected readonly dtProductColumns: DataTableColumnDef[] = [
    { key: 'product', header: 'Product', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
    { key: 'price', header: 'Price', templateKey: 'price', sortable: true, align: 'end', width: '110px' },
    { key: 'stock', header: 'Stock', templateKey: 'stock', align: 'center', width: '140px' },
    { key: 'sku', header: 'SKU', width: '120px' },
  ];

  protected readonly dtProducts: Record<string, unknown>[] = [
    { id: 'p1', product: 'Wireless Keyboard', category: 'Accessories', price: '$79.99', stock: 142, sku: 'KB-001' },
    { id: 'p2', product: 'USB-C Hub', category: 'Accessories', price: '$49.99', stock: 8, sku: 'HB-023' },
    { id: 'p3', product: '27" 4K Monitor', category: 'Displays', price: '$599.00', stock: 34, sku: 'MN-112' },
    { id: 'p4', product: 'Noise-Cancelling Headphones', category: 'Audio', price: '$349.00', stock: 67, sku: 'HP-045' },
    { id: 'p5', product: 'Mechanical Mouse', category: 'Accessories', price: '$69.99', stock: 3, sku: 'MS-007' },
    { id: 'p6', product: 'Webcam Pro', category: 'Video', price: '$129.00', stock: 51, sku: 'WC-089' },
    { id: 'p7', product: 'Standing Desk Mat', category: 'Furniture', price: '$44.99', stock: 95, sku: 'DM-034' },
    { id: 'p8', product: 'Thunderbolt Cable', category: 'Cables', price: '$29.99', stock: 210, sku: 'CB-156' },
    { id: 'p9', product: 'Desk Lamp', category: 'Lighting', price: '$89.00', stock: 18, sku: 'DL-072' },
    { id: 'p10', product: 'Laptop Stand', category: 'Accessories', price: '$59.99', stock: 43, sku: 'LS-011' },
  ];

  protected onDtSelectionChange(rows: Record<string, unknown>[]): void {
    this.toastService.info(`${rows.length} row${rows.length !== 1 ? 's' : ''} selected`);
  }

  // --- Tab Bar state ---
  protected readonly tabBarDefaultActive = signal('home');
  protected readonly tabBarFloatingActive = signal('home');
  protected readonly tabBarMinimalActive = signal('home');
  protected readonly tabBarBadgeActive = signal('home');
  protected readonly tabBarDisabledActive = signal('home');
  protected readonly tabBarFloatingBadgeActive = signal('discover');

  protected readonly tabBarDefaultTabs: Tab[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'search', label: 'Search', icon: 'search' },
    { id: 'library', label: 'Library', icon: 'book-open' },
    { id: 'profile', label: 'Profile', icon: 'user' },
  ];

  protected readonly tabBarFloatingTabs: Tab[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'discover', label: 'Discover', icon: 'compass' },
    { id: 'favorites', label: 'Favorites', icon: 'heart' },
    { id: 'profile', label: 'Profile', icon: 'user' },
  ];

  protected readonly tabBarMinimalTabs: Tab[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'search', label: 'Search', icon: 'search' },
    { id: 'camera', label: 'Camera', icon: 'camera' },
    { id: 'activity', label: 'Activity', icon: 'activity' },
    { id: 'profile', label: 'Profile', icon: 'user' },
  ];

  protected readonly tabBarBadgeTabs: Tab[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'inbox', label: 'Inbox', icon: 'mail', badge: 12 },
    { id: 'notifications', label: 'Alerts', icon: 'bell', badge: 3 },
    { id: 'updates', label: 'Updates', icon: 'download', badge: '' },
    { id: 'profile', label: 'Profile', icon: 'user' },
  ];

  protected readonly tabBarDisabledTabs: Tab[] = [
    { id: 'home', label: 'Home', icon: 'home' },
    { id: 'search', label: 'Search', icon: 'search' },
    { id: 'premium', label: 'Premium', icon: 'crown', disabled: true },
    { id: 'profile', label: 'Profile', icon: 'user' },
  ];

  protected readonly tabBarFloatingBadgeTabs: Tab[] = [
    { id: 'discover', label: 'Discover', icon: 'compass' },
    { id: 'trending', label: 'Trending', icon: 'trending-up', badge: '' },
    { id: 'messages', label: 'Messages', icon: 'message-circle', badge: 5 },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  // --- Content Tabs state ---
  protected readonly contentTabInteractive = signal('overview');
  protected readonly contentTabUnderline = signal('overview');
  protected readonly contentTabFilled = signal('overview');
  protected readonly contentTabPills = signal('overview');
  protected readonly contentTabBadges = signal('overview');
  protected readonly contentTabVerticalUnderline = signal('overview');
  protected readonly contentTabVerticalFilled = signal('overview');
  protected readonly contentTabVerticalPills = signal('overview');
  protected readonly contentTabSm = signal('overview');
  protected readonly contentTabMd = signal('overview');
  protected readonly contentTabLg = signal('overview');
  protected readonly contentTabFullWidth = signal('overview');

  protected readonly contentTabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'api', label: 'API' },
    { id: 'examples', label: 'Examples' },
    { id: 'styling', label: 'Styling' },
  ];

  protected readonly contentTabsWithBadges: TabItem[] = [
    { id: 'overview', label: 'Overview', icon: 'info' },
    { id: 'api', label: 'API', icon: 'code', badge: 'New' },
    { id: 'examples', label: 'Examples', icon: 'layout', badge: 3 },
    { id: 'styling', label: 'Styling', icon: 'palette' },
    { id: 'disabled', label: 'Advanced', icon: 'lock', disabled: true },
  ];

  protected readonly listboxThemeOptions = [
    { value: 'light', label: 'Light', icon: 'sun', description: 'Always use light appearance' },
    { value: 'dark', label: 'Dark', icon: 'moon', description: 'Always use dark appearance' },
    { value: 'system', label: 'Automatic', icon: 'monitor', description: 'Match system setting' },
  ];

  protected readonly listboxNotifOptions = [
    { value: 'push', label: 'Push Notifications', icon: 'bell', description: 'Instant alerts on your device' },
    { value: 'email', label: 'Email Digest', icon: 'mail', description: 'Daily summary in your inbox' },
    { value: 'sms', label: 'SMS Alerts', icon: 'smartphone', description: 'Text messages for critical updates' },
    { value: 'slack', label: 'Slack Integration', icon: 'message-circle', description: 'Post to your Slack channel' },
    { value: 'none', label: 'Do Not Disturb', icon: 'bell-off', description: 'Mute all notifications', disabled: true },
  ];

  protected readonly listboxPriorityOptions = [
    { value: 'urgent', label: 'Urgent', icon: 'alert-circle', trailing: 'P0' },
    { value: 'high', label: 'High', icon: 'arrow-up', trailing: 'P1' },
    { value: 'medium', label: 'Medium', icon: 'minus', trailing: 'P2' },
    { value: 'low', label: 'Low', icon: 'arrow-down', trailing: 'P3' },
  ];

  protected readonly listboxAccountOptions = [
    { value: 'profile', label: 'Profile', icon: 'user' },
    { value: 'security', label: 'Security', icon: 'shield' },
    { value: 'billing', label: 'Billing', icon: 'credit-card' },
  ];

  protected readonly accordionItems: AccordionItem[] = [
    {
      id: 'what',
      title: 'What is this design system?',
      content: 'A comprehensive Angular component library following Apple Human Interface Guidelines (HIG), featuring glassmorphism, spring animations, and semantic design tokens.',
      icon: 'info',
    },
    {
      id: 'tech',
      title: 'Technology stack',
      content: 'Built with Angular 22+, Tailwind CSS v4, standalone components, and signal-based state management. All components follow WCAG AA accessibility standards.',
      icon: 'layers',
    },
    {
      id: 'theme',
      title: 'Theming support',
      content: 'Full light and dark mode support using CSS light-dark() function and oklch color space. Theme preference is persisted in localStorage and respects system settings.',
      icon: 'sun',
    },
  ];

  protected readonly systemColors = [
    { name: 'Blue', token: 'system-blue', value: 'oklch(59% 0.24 264)' },
    { name: 'Red', token: 'system-red', value: 'oklch(59% 0.23 27)' },
    { name: 'Green', token: 'system-green', value: 'oklch(60% 0.19 145)' },
    { name: 'Orange', token: 'system-orange', value: 'oklch(70% 0.18 55)' },
    { name: 'Teal', token: 'system-teal', value: 'oklch(62% 0.12 200)' },
    { name: 'Purple', token: 'system-purple', value: 'oklch(55% 0.22 300)' },
    { name: 'Yellow', token: 'system-yellow', value: 'oklch(82% 0.16 85)' },
    { name: 'Pink', token: 'system-pink', value: 'oklch(62% 0.22 350)' },
    { name: 'Indigo', token: 'system-indigo', value: 'oklch(50% 0.22 280)' },
    { name: 'Gray', token: 'gray-500', value: 'oklch(55% 0.013 264)' },
  ];

  protected readonly iconNames = Object.values(icons as Record<string, any>)
    .map(icon => icon.icon ? icon.icon.name : icon.name)
    .filter(name => typeof name === 'string');

  // --- Carousel data ---
  protected readonly carouselCards = [
    { icon: '🎵', title: 'Music', subtitle: 'Discover new sounds', gradient: 'linear-gradient(135deg, oklch(55% 0.24 350), oklch(45% 0.22 310))' },
    { icon: '📸', title: 'Photos', subtitle: 'Capture every moment', gradient: 'linear-gradient(135deg, oklch(60% 0.18 55), oklch(50% 0.22 35))' },
    { icon: '🎮', title: 'Games', subtitle: 'Play & compete', gradient: 'linear-gradient(135deg, oklch(55% 0.22 280), oklch(45% 0.24 264))' },
    { icon: '📚', title: 'Books', subtitle: 'Read anywhere', gradient: 'linear-gradient(135deg, oklch(58% 0.19 145), oklch(48% 0.19 170))' },
    { icon: '🎬', title: 'Movies', subtitle: 'Stream tonight', gradient: 'linear-gradient(135deg, oklch(52% 0.23 27), oklch(42% 0.23 10))' },
    { icon: '🏃', title: 'Fitness', subtitle: 'Stay on track', gradient: 'linear-gradient(135deg, oklch(62% 0.12 200), oklch(52% 0.14 220))' },
  ];

  protected readonly carouselFeatures = [
    { icon: 'zap', title: 'Performance', description: 'Blazing fast signal-based rendering with zero wasted cycles.', color: 'var(--color-system-orange)' },
    { icon: 'shield', title: 'Security', description: 'Built-in XSS protection and strict CSP compliance.', color: 'var(--color-system-blue)' },
    { icon: 'layers', title: 'Composable', description: 'Mix and match standalone components effortlessly.', color: 'var(--color-system-purple)' },
    { icon: 'globe', title: 'Accessible', description: 'WCAG AA conformance with full keyboard navigation.', color: 'var(--color-system-green)' },
    { icon: 'moon', title: 'Dark Mode', description: 'Adaptive theming with light-dark() and oklch.', color: 'var(--color-system-teal)' },
  ];

  protected readonly carouselBanners = [
    { badge: 'New', title: 'Angular Signals', description: 'Reactive primitives that simplify state management.', gradient: 'linear-gradient(135deg, oklch(48% 0.24 264), oklch(38% 0.22 290))' },
    { badge: 'Featured', title: 'Glassmorphism UI', description: 'Frosted glass surfaces with depth and elegance.', gradient: 'linear-gradient(135deg, oklch(52% 0.20 200), oklch(42% 0.18 170))' },
    { badge: 'Trending', title: 'Spring Animations', description: 'Physics-based transitions that feel natural.', gradient: 'linear-gradient(135deg, oklch(55% 0.22 350), oklch(42% 0.23 20))' },
  ];

  // --- Tree data ---
  protected readonly fileTreeData: TreeNode[] = [
    {
      id: 'src',
      label: 'src',
      icon: 'folder',
      children: [
        {
          id: 'app',
          label: 'app',
          icon: 'folder',
          children: [
            {
              id: 'components',
              label: 'components',
              icon: 'folder',
              children: [
                { id: 'button-ts', label: 'button.ts', icon: 'file-code' },
                { id: 'input-ts', label: 'input.ts', icon: 'file-code' },
                { id: 'modal-ts', label: 'modal.ts', icon: 'file-code' },
              ],
            },
            {
              id: 'services',
              label: 'services',
              icon: 'folder',
              children: [
                { id: 'auth-ts', label: 'auth.service.ts', icon: 'file-code', badge: 'new' },
                { id: 'api-ts', label: 'api.service.ts', icon: 'file-code' },
              ],
            },
            { id: 'app-ts', label: 'app.ts', icon: 'file-code' },
            { id: 'app-html', label: 'app.html', icon: 'file-text' },
            { id: 'app-css', label: 'app.css', icon: 'palette' },
          ],
        },
        { id: 'main-ts', label: 'main.ts', icon: 'file-code' },
        { id: 'index-html', label: 'index.html', icon: 'file-text' },
        { id: 'styles-css', label: 'styles.css', icon: 'palette' },
      ],
    },
    {
      id: 'config',
      label: 'config',
      icon: 'folder',
      children: [
        { id: 'tsconfig', label: 'tsconfig.json', icon: 'file-json' },
        { id: 'angular-json', label: 'angular.json', icon: 'file-json' },
        { id: 'package-json', label: 'package.json', icon: 'file-json' },
      ],
    },
    { id: 'readme', label: 'README.md', icon: 'file-text', badge: '3' },
    { id: 'license', label: 'LICENSE', icon: 'file', disabled: true },
  ];

  protected readonly editableTreeData: TreeNode[] = [
    {
      id: 'pages',
      label: 'Pages',
      icon: 'layout',
      children: [
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'about', label: 'About', icon: 'info' },
        { id: 'contact', label: 'Contact', icon: 'mail' },
        { id: 'blog', label: 'Blog', icon: 'pen-tool' },
      ],
    },
    {
      id: 'media',
      label: 'Media Library',
      icon: 'image',
      children: [
        { id: 'photos', label: 'Photos', icon: 'camera', badge: '24' },
        { id: 'videos', label: 'Videos', icon: 'video', badge: '8' },
        { id: 'docs', label: 'Documents', icon: 'file-text', badge: '12' },
      ],
    },
  ];

  protected readonly draggableTreeData: TreeNode[] = [
    {
      id: 'playlist',
      label: 'My Playlist',
      icon: 'music',
      children: [
        { id: 'song-1', label: 'Blinding Lights', icon: 'disc' },
        { id: 'song-2', label: 'Levitating', icon: 'disc' },
        { id: 'song-3', label: 'Watermelon Sugar', icon: 'disc' },
        { id: 'song-4', label: 'Save Your Tears', icon: 'disc' },
        { id: 'song-5', label: 'Peaches', icon: 'disc' },
      ],
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: 'heart',
      children: [
        { id: 'fav-1', label: 'Bohemian Rhapsody', icon: 'star' },
        { id: 'fav-2', label: 'Hotel California', icon: 'star' },
        { id: 'fav-3', label: 'Stairway to Heaven', icon: 'star' },
      ],
    },
  ];

  protected onTreeNodeEdit(event: TreeNodeEditEvent): void {
    this.toastService.success(`Renamed to "${event.newLabel}"`);
  }

  protected onTreeContextAction(event: TreeContextMenuEvent): void {
    this.toastService.info(`${event.action}: ${event.node.label}`);
  }

  // --- Methods ---
  protected toggleChip(label: string): void {
    this.selectedChips.update((set) => {
      const next = new Set(set);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  protected async showActionSheet(): Promise<void> {
    const result = await this.actionSheetService.open({
      title: 'Share Photo',
      message: 'Choose how you want to share this photo',
      actions: [
        { id: 'airdrop', label: 'AirDrop', icon: 'wifi' },
        { id: 'message', label: 'Messages', icon: 'message-circle' },
        { id: 'email', label: 'Email', icon: 'mail' },
        { id: 'delete', label: 'Delete Photo', icon: 'trash', destructive: true },
      ],
    });
    if (result) {
      this.toastService.info(`Selected: ${result}`);
    }
  }

  protected showModal(): void {
    this.modalService.open(ModalComponent, {
      data: { title: 'Example Modal' },
    });
  }

  protected showConfirm(): void {
    this.confirmDialogService
      .confirm({
        title: 'Confirm Action',
        message: 'Are you sure you want to proceed with this action?',
        confirmLabel: 'Proceed',
        icon: 'info',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.toastService.success('Action confirmed!');
        }
      });
  }

  protected showDestructiveConfirm(): void {
    this.confirmDialogService
      .confirm({
        title: 'Delete Item',
        message: 'This action cannot be undone. Are you sure?',
        confirmLabel: 'Delete',
        destructive: true,
        icon: 'trash',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.toastService.error('Item deleted');
        }
      });
  }

  protected showBottomSheet(): void {
    this.bottomSheetService.open({
      title: 'Options',
      message: 'Select an option below',
      actions: [
        { id: 'share', label: 'Share', icon: 'share' },
        { id: 'copy', label: 'Copy Link', icon: 'copy' },
        { id: 'edit', label: 'Edit', icon: 'edit' },
        { id: 'delete', label: 'Delete', icon: 'trash', destructive: true },
      ],
    });
  }

  protected async onContextMenu(event: MouseEvent): Promise<void> {
    event.preventDefault();
    const items: ContextMenuItem[] = [
      { id: 'cut', label: 'Cut', icon: 'copy', shortcut: '⌘X' },
      { id: 'copy', label: 'Copy', icon: 'copy', shortcut: '⌘C' },
      { id: 'paste', label: 'Paste', icon: 'copy', shortcut: '⌘V' },
      { id: 'sep1', label: '', separator: true },
      { id: 'select-all', label: 'Select All', shortcut: '⌘A' },
      { id: 'sep2', label: '', separator: true },
      { id: 'delete', label: 'Delete', icon: 'trash', destructive: true },
    ];
    const result = await this.contextMenuService.open(items, {
      x: event.clientX,
      y: event.clientY,
    });
    if (result) {
      this.toastService.info(`Context menu: ${result}`);
    }
  }
}

