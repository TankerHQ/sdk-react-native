import { basicTests } from './test_basic';
import { tankerTests } from './test_tanker';

export const generateTests = () => {
  basicTests();
  tankerTests();
};
