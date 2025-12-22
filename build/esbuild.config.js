import { build, context } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWatch = process.argv.includes("--watch");
const sharedOptions = {
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node18",
  sourcemap: true,
  external: [
    "electron",
    "axios",
    "axios-cookiejar-support",
    "tough-cookie",
    "form-data",
    "combined-stream",
  ],
};

const runBuild = async () => {
  const buildTarget = async (entry, outdir, overrides = {}) => {
    const options = {
      ...sharedOptions,
      entryPoints: [entry],
      outdir,
      ...overrides,
    };

    if (isWatch) {
      const ctx = await context(options);
      await ctx.watch();
      return ctx;
    }

    return build(options);
  };

  await Promise.all([
    buildTarget(
      path.resolve(__dirname, "../src/main/index.js"),
      path.resolve(__dirname, "../dist/main")
    ),
    buildTarget(
      path.resolve(__dirname, "../src/preload/index.js"),
      path.resolve(__dirname, "../dist/preload"),
      {
        format: "cjs",
        outExtension: { ".js": ".cjs" },
      }
    ),
  ]);

  // eslint-disable-next-line no-console
  console.log(
    isWatch
      ? "Watching Electron main & preload…"
      : "Built Electron main & preload"
  );
};

runBuild().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
