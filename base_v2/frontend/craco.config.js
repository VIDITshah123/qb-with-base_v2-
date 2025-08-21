/**
 * CRACO Configuration
 * Extends Create React App webpack config without ejecting
 * Updated: 2025-08-10 - Fixed source map warnings for node_modules
 */

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Modify the source-map-loader configuration
      const rules = webpackConfig.module.rules;
      
      // Find and update the source-map-loader rule
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        if (rule.enforce === 'pre') {
          for (const loader of [].concat(rule.use || [])) {
            if (loader.loader && loader.loader.includes('source-map-loader')) {
              // Completely exclude node_modules from source-map-loader processing
              rule.exclude = /node_modules/;
              break;
            }
          }
        }
      }
      
      return webpackConfig;
    },
  },
};
