const path = require("path");
const webpack = require("next/dist/compiled/webpack/webpack-lib");

/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: [
        "@shadergradient/react",
        "@react-three/fiber",
        "three",
        "three-stdlib",
    ],
    experimental: {
        serverComponentsExternalPackages: ["@composio/core"],
    },
    webpack: (config, { isServer }) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            "@shadergradient/react": path.resolve(
                __dirname,
                "node_modules/@shadergradient/react/dist/index.mjs"
            ),
        };

        // Fix: recharts imports es-toolkit/compat/<fn> which Next.js 14 can't resolve
        // via package exports subpaths. Redirect to the bundled compat module.
        if (!isServer) {
            config.plugins.push(
                new webpack.NormalModuleReplacementPlugin(
                    /^es-toolkit\/compat\/.+$/,
                    (resource) => {
                        // e.g. "es-toolkit/compat/get" → require the function from the compat bundle
                        const fnName = resource.request.split("/").pop();
                        resource.request = path.resolve(
                            __dirname,
                            "node_modules/es-toolkit/compat",
                            fnName + ".js"
                        );
                    }
                )
            );

            // Stub out fs for @vercel/oidc (pulled in by @ai-sdk/gateway via ai via @ai-sdk/react)
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
            };
        }

        return config;
    },
};

module.exports = nextConfig;
