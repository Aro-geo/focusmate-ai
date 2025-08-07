const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Configure webpack for browser compatibility
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "process": require.resolve("process/browser.js"),
        "buffer": require.resolve("buffer"),
        "util": require.resolve("util"),
        "stream": require.resolve("stream-browserify"),
        "path": require.resolve("path-browserify"),
        "os": require.resolve("os-browserify/browser.js"),
        // Exclude server-side dependencies
        "pg": false,
        "fs": false,
        "net": false,
        "tls": false,
      };

      // Configure module resolution
      webpackConfig.resolve.extensionAlias = {
        ...webpackConfig.resolve.extensionAlias,
        ".js": [".js", ".ts", ".tsx"]
      };

      // Add plugins
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser.js',
        })
      );

      // Exclude database files from bundle
      webpackConfig.module.rules.push({
        test: /src\/utils\/db(-real)?\.ts$/,
        use: 'null-loader'
      });

      // Exclude migration and seed files
      webpackConfig.module.rules.push({
        test: /src\/db\/(migrate|seed)\.ts$/,
        use: 'null-loader'
      });

      return webpackConfig;
    },
  },
};
