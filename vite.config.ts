import { defineConfig } from "vite";

export default defineConfig({
  test: {
    setupFiles: ["./setupTests"],
    include: ["./src/**/*.test.ts", "./functions/__test__/*.test.ts"],
  },
});
