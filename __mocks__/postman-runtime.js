import { vi } from 'vitest';

export const Runner = vi.fn(function() {
  return {
    run: vi.fn((collection, options, callback) => {
        // Default behavior: return immediately or throw?
        // Let's just do nothing or call callback with empty result to avoid timeouts if unmocked
        // But the test will override implementation.
        console.log('Mock Runner created');
    })
  };
});
