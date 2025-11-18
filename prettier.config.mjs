export default {
  singleQuote: true,
  overrides: [
    {
      files: '**/*.md',
      options: {
        proseWrap: 'always',
      },
    },
  ],
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindFunctions: ['twMerge', 'twJoin'],
};
