import { provideZonelessChangeDetection } from '@angular/core';

// Tests run without zone.js; use native async and Vitest fake timers instead.
export default [provideZonelessChangeDetection()];
