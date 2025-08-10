import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      // Spasi di dalam kurawal object / import / export braces
      "object-curly-spacing": ["error", "always"],

      // Wajib pakai titik koma
      "semi": ["error", "always"],

      // Indentasi 2 spasi
      "indent": ["error", 2, { "SwitchCase": 1 }],

      // Spasi setelah koma
      "comma-spacing": ["error", { "before": false, "after": true }],

      // Spasi sebelum dan sesudah keyword seperti if, for, while
      "keyword-spacing": ["error", { "before": true, "after": true }],

      // Spasi setelah keyword function dan sebelum kurung buka
      "space-before-function-paren": ["error", "always"],

      // Wajib ada spasi di dalam array brackets [ 1, 2, 3 ]
      "array-bracket-spacing": ["error", "never"],

      // Tidak boleh ada trailing spaces di akhir baris
      "no-trailing-spaces": ["error"],

      // Baris maksimal 80 karakter (optional, bisa disesuaikan)
      "max-len": ["warn", { "code": 80 }],

      // Konsisten penggunaan single quotes
      "quotes": ["error", "single", { "avoidEscape": true, "allowTemplateLiterals": true }],

      // Jangan ada spasi ekstra sebelum kurung buka fungsi
      "space-before-function-paren": ["error", "never"],

      // Aturan tambahan agar import/export diurutkan bisa ditambah jika mau
    },
  },
]);
