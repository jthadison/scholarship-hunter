import '@testing-library/jest-dom'

// Mock ResizeObserver for component tests
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
