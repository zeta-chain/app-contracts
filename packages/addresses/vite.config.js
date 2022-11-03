// vite.config.js
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "./src/index.ts"),
      // the proper extensions will be added
      fileName: "zetachain-addresses",
      name: "ZetachainAddresses"
    }
  },
  plugins: [
    dts({
      insertTypesEntry: true
    })
  ]
});
