/** @type {import('ts-jest').JestConfigWithTsJest} **/
import { createDefaultPreset, type JestConfigWithTsJest } from 'ts-jest'

const tsPresetConfig = createDefaultPreset({})

const config: JestConfigWithTsJest = {
  moduleDirectories: ['node_modules', 'src'],
  ...tsPresetConfig,
  // moduleFileExtensions: ['js', 'ts'],
  transform: {
    ...tsPresetConfig.transform,
    "^.+.wgsl$": '<rootDir>/jestWgslTransformer.js',
  },

  testEnvironment: "jsdom",
  // '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
  // '<rootDir>/fileTransformer.js',
  // verbose: true,
  // moduleFileExtensions: ['ts'],
  // moduleDirectories: ['node_modules', 'src'],
  // testEnvironment: "jsdom",
  // transform: {
  //   "^.+.tsx?$": ["ts-jest"],
  // },
};

export default config;
