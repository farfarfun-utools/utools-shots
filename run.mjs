const name = process.argv[2];
const mod = await import(`./apps/${name}.mjs`);
await mod.default();
