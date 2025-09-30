module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@react-native/babel-plugin-codegen', { jit: false }], // Disable JIT to avoid NodePath errors
      'react-native-paper/babel',
      ['module:react-native-dotenv', {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        allowUndefined: false,
        safe: false
      }],
      'react-native-reanimated/plugin' // Must be last
    ],
  };
};