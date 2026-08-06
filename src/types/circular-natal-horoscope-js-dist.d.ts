// The package ships only its CommonJS bundle; its "module" field points at files
// that are not published, so we import the dist entry directly.
declare module "circular-natal-horoscope-js/dist/index.js" {
  const mod: typeof import("circular-natal-horoscope-js") & {
    default?: typeof import("circular-natal-horoscope-js");
  };
  export = mod;
}
