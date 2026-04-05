import { describe, it, expect, vi } from 'vitest';
import { cn } from '../lib/utils';
import { exportToExcel } from '../lib/exportExcel';

describe('cn utility', () => {
  it('combines class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('filters out falsy values', () => {
    expect(cn('foo', false, 'bar', null, 'baz')).toBe('foo bar baz');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
  });
});

describe('exportExcel', () => {
  it('warns when no data to export', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    exportToExcel([], 'test', [{ key: 'name', header: 'Name' }]);
    expect(consoleWarn).toHaveBeenCalledWith('No data to export');
    consoleWarn.mockRestore();
  });

  it('warns when data is null or undefined', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    exportToExcel(null, 'test', [{ key: 'name', header: 'Name' }]);
    expect(consoleWarn).toHaveBeenCalledWith('No data to export');
    consoleWarn.mockRestore();
  });
});
