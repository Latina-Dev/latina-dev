export default defineNitroConfig({
  srcDir: "server",
  compatibilityDate: "2025-07-27",
  // Local dev keeps Madrina's saved state on disk. Production mounts Redis in plugins/storage.ts.
  devStorage: {
    madrina: { driver: "fs", base: "./.data/madrina" },
  },
});
