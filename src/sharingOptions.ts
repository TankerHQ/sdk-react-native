import { InvalidArgument } from '@tanker/errors';
import { isObject, assertNotEmptyString } from './types';

export type SharingOptions = {
  shareWithUsers?: Array<string>;
  shareWithGroups?: Array<string>;
};

export const extractSharingOptions = (
  options: SharingOptions,
  error: any = new InvalidArgument(
    'options',
    '{ shareWithUsers?: Array<b64string>, shareWithGroups?: Array<string> }',
    options
  )
): SharingOptions => {
  if (!isObject(options)) throw error;

  const sharingOptions = {};

  ['shareWithUsers', 'shareWithGroups'].forEach((key) => {
    if (key in options) {
      // @ts-ignore we explicitely iterate with known keys
      const value = options[key];
      if (!(value instanceof Array)) throw error;
      value.forEach((el) => assertNotEmptyString(el, `options.${key}`));
      // @ts-ignore known keys
      sharingOptions[key] = value;
    }
  });

  return sharingOptions;
};
