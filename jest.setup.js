require("@testing-library/jest-dom");

if (typeof global.fetch !== "function") {
  global.fetch = jest.fn();
}
