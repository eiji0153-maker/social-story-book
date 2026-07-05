import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages はサブパス配信のため相対パスにする（リポジトリ名に依存しない）
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
  },
});
