# Shared Components Enhancement Audit

This document outlines an investigation into the current state of shared UI components within `src/app/shared/ui/` and identifies opportunities for integrating advanced features, modern Angular capabilities, and better performance optimizations.

## 1. Virtual Scrolling for Large Data Sets
Components that render lists or grids of data can suffer from performance degradation when handling large datasets. Implementing virtual scrolling will significantly improve DOM performance by only rendering items visible in the viewport.

**Target Components:**
- `data-table`: Essential for handling thousands of rows efficiently.
- `select`: Crucial when dropdowns contain extensive lists (e.g., country lists, large user directories).
- `list`, `tree`, `listbox`: Any generic list or nested structure that can grow indefinitely.

**Implementation:**
Integrate `@angular/cdk/scrolling` (`CdkVirtualScrollViewport`) into these components.

## 2. Migration to Signal Forms
Current components like `select`, `input`, `checkbox`, `radio`, and `slider` use `ControlValueAccessor` for reactive forms integration. As per Angular v22+ best practices, the project should leverage **Signal Forms** (`@angular/forms/signals`).

**Benefits:**
- Signal-based state management (eliminating the need for complex RxJS subscriptions for form state).
- Type-safe field access and schema-based validation.
- Cleaner integration with existing signal-based components.

**Target Components:**
All form control components (`select`, `input`, `textarea`, `radio`, `checkbox`, `slider`, `toggle`, `date-picker`, `time-picker`).

## 3. Advanced Animations & View Transitions API
While many components (like `select`, `modal`, `accordion`) currently utilize smooth CSS keyframe animations, we can enhance user experience by adopting the native **View Transitions API** or Angular's modern animation modules for layout shifts and complex state changes.

**Target Components:**
- `modal`, `bottom-sheet`, `action-sheet`: Smoother enter/leave transitions that coordinate with the rest of the page.
- `tabs`, `stepper`: Fluid transitions between different content views.
- `accordion`, `tree`: Seamless expand/collapse animations.

## 4. Modernizing State with \`model()\` Signals
Some components have already adopted the `model()` signal for two-way data binding (e.g., `toggle`, `checkbox`, `stepper`, `slider`, `sidenav`). However, an audit should be conducted across all 51 components to identify where separate `input()` and `output()` pairs can be consolidated into `model()`.

**Target Components:**
- `data-table` (e.g., for pagination state, sort state, selection state).
- `tabs` (for active tab index).
- `accordion` (for expanded state).

## 5. Lazy Loading with \`@defer\`
To optimize the initial bundle size and improve load times (Core Web Vitals), heavy components or components that are not immediately visible should be lazily loaded using Angular's `@defer` blocks.

**Target Components:**
- `modal`, `bottom-sheet`: Defer loading of complex inner content until the modal is triggered.
- `carousel`: Defer images or heavy content in off-screen slides.
- `data-table`: Defer loading of expanded row detail templates (`expandedRowTemplate`).
- `date-picker`, `time-picker`: Defer the calendar/time rendering logic until the picker is opened.

## 6. Accessibility (WCAG AA) Deep-Dive
Although components heavily utilize `@angular/cdk/a11y` (`LiveAnnouncer`) and ARIA roles, an extensive audit against WCAG AA standards should be continuously performed.

**Enhancement Areas:**
- **Focus Management:** Ensure focus is correctly trapped in `modal`, `action-sheet`, and `bottom-sheet` (using `@angular/cdk/a11y` `FocusTrap`).
- **Keyboard Navigation:** Enhance complex grids (`data-table`) with full roving tabindex support (arrow key navigation between cells, not just headers).
- **High Contrast:** Verify that all component variants (especially `tinted` and `ghost` buttons) meet the required color contrast ratios in both light and dark modes.

## Summary of Next Steps
1. **Prioritize Virtual Scrolling**: Begin integrating `@angular/cdk/scrolling` into `data-table` and `select` as these provide the most immediate performance benefits.
2. **Refactor to Signal Forms**: Initiate a phased migration of `ControlValueAccessor` implementations to `@angular/forms/signals`.
3. **Consolidate APIs**: Replace remaining `input`/`output` pairs for state sync with `model()` across the UI library.
