import { InvalidArgument } from '@tanker/errors';
import { assertInteger } from '@tanker/types';
import { extractSharingOptions } from './sharingOptions';

export enum Padding {
  AUTO = 'AUTO',
  OFF = 'OFF',
}

export type EncryptionOptions = {
  shareWithUsers?: Array<string>;
  shareWithGroups?: Array<string>;
  shareWithSelf?: boolean;
  paddingStep?: number | Padding;
};

export const extractEncryptionOptions = (
  options?: EncryptionOptions
): EncryptionOptions | undefined => {
  if (!options) return options;

  const error = new InvalidArgument(
    'options',
    '{ shareWithUsers?: Array<b64string>, shareWithGroups?: Array<string>, shareWithSelf?: bool, paddingStep?: number | Padding }',
    options
  );

  const encryptionOptions: EncryptionOptions = extractSharingOptions(
    options,
    error
  );

  if ('shareWithSelf' in options) {
    if (typeof options.shareWithSelf !== 'boolean') throw error;
    encryptionOptions.shareWithSelf = options.shareWithSelf;
  }

  if (
    !('paddingStep' in options) ||
    options.paddingStep === undefined ||
    options.paddingStep === Padding.AUTO
  ) {
    encryptionOptions.paddingStep = 0;
  } else if ('paddingStep' in options) {
    if (options.paddingStep === Padding.OFF) {
      encryptionOptions.paddingStep = 1;
    } else if (options.paddingStep >= 2) {
      assertInteger(options.paddingStep, 'options.paddingStep', true);
      encryptionOptions.paddingStep = options.paddingStep;
    } else {
      throw new InvalidArgument(
        'options.paddingStep',
        'integer >= 2 | Padding.AUTO | Padding.OFF',
        encryptionOptions.paddingStep
      );
    }
  }

  return encryptionOptions;
};
