type ChalkColor = (text: string) => string;

interface ChalkFn extends ChalkColor {
  green: ChalkColor;
  yellow: ChalkColor;
  red: ChalkColor;
}

const createChalk = () => {
  const fn = ((text: string) => text) as ChalkFn;
  Object.defineProperties(fn, {
    green: { value: (text: string) => text },
    yellow: { value: (text: string) => text },
    red: { value: (text: string) => text }
  });
  return fn;
};

const chalk = createChalk();
export default chalk;
