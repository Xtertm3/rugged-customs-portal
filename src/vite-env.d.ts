/// <reference types="vite/client" />

// By converting this file to a module (adding `export {}`) and using `declare global`,
// we avoid redeclaring the `process` variable, which conflicts with Node.js types.
// This is done by augmenting the existing NodeJS.ProcessEnv interface instead of redeclaring `process`.
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }
}

export {};
