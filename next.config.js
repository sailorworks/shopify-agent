const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [
        "@shadergradient/react",
        "@react-three/fiber",
        "three",
        "three-stdlib",
    ],
    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            "@shadergradient/react": path.resolve(
                __dirname,
                "node_modules/@shadergradient/react/dist/index.mjs"
            ),
        };
        return config;
    },
};

module.exports = nextConfig;
