// metro.config.js
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  serializer: {
    createModuleIdFactory: () => (path) => {
      // Your module ID logic
      return someHash(path);
    },
  },
};

// Set the environment variable
process.env.EXPO_ROUTER_APP_ROOT = 'app';