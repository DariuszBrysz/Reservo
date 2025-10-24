import "@testing-library/jest-dom/vitest";

// Mock Radix UI pointer capture methods to prevent jsdom errors
Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
  value: vi.fn(() => false),
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
  value: vi.fn(),
  writable: true,
});
