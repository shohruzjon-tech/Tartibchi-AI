const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the entire monorepo for changes (needed for shared packages)
config.watchFolders = [monorepoRoot];

// Resolve modules from queue-mobile's node_modules first, then the monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Use a custom resolveRequest to force react/react-dom to always resolve from
// queue-mobile's local node_modules (react@19.1.0), not the hoisted root (react@19.2.x).
// extraNodeModules alone doesn't work because react-native is hoisted to root and
// its internal require('react') finds root react@19.2.x before the fallback runs.
const localNodeModules = path.resolve(projectRoot, "node_modules");
const reactPackages = ["react", "react-dom"];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const matched = reactPackages.find(
    (pkg) => moduleName === pkg || moduleName.startsWith(pkg + "/"),
  );

  if (matched) {
    try {
      const resolvedPath = require.resolve(moduleName, {
        paths: [localNodeModules],
      });
      return { type: "sourceFile", filePath: resolvedPath };
    } catch {
      // Fall through to default resolution
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
