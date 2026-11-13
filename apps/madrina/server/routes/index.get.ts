import { html } from "./html";

export default defineEventHandler(async () => {
  try {
    return html;
  } catch {
    return "Error loading README.md";
  }
});
