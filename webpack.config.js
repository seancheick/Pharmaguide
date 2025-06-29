// webpack.config.js
// Bundle optimization configuration for reduced bundle size

const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      // Enable production optimizations
      mode: env.mode || 'production',
    },
    argv
  );

  // Enable tree shaking and optimization
  config.optimization = {
    ...config.optimization,
    usedExports: true,
    sideEffects: false,
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Split vendor libraries into separate chunks
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // Split icons into separate chunk for better caching
        icons: {
          test: /[\\/]node_modules[\\/](@expo\/vector-icons|ionicons)[\\/]/,
          name: 'icons',
          chunks: 'all',
          priority: 20,
        },
        // Split React/React Native into separate chunk
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-native)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 30,
        },
      },
    },
    // Minimize bundle size
    minimize: true,
  };

  // Add bundle analyzer in development
  if (env.mode === 'development' && process.env.ANALYZE_BUNDLE) {
    const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'server',
        openAnalyzer: true,
      })
    );
  }

  // Optimize module resolution
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      // Optimize icon imports
      '@expo/vector-icons': '@expo/vector-icons/build',
    },
  };

  // Add terser optimization for better minification
  if (config.optimization.minimizer) {
    config.optimization.minimizer = config.optimization.minimizer.map(plugin => {
      if (plugin.constructor.name === 'TerserPlugin') {
        return new (require('terser-webpack-plugin'))({
          terserOptions: {
            compress: {
              drop_console: true, // Remove console.log in production
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info'], // Remove specific console methods
            },
            mangle: true,
            format: {
              comments: false, // Remove comments
            },
          },
          extractComments: false,
        });
      }
      return plugin;
    });
  }

  return config;
};