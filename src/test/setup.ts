import '@testing-library/jest-dom';

// recharts' ResponsiveContainer calls `new ResizeObserver(...)` which doesn't
// exist in jsdom. Provide a constructable stub.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
