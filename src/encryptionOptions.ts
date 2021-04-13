import { InvalidArgument } from '@tanker/errors';
import { extractSharingOptions } from './sharingOptions';

export type EncryptionOptions = {
  shareWithUsers?: Array<string>;
  shareWithGroups?: Array<string>;
  shareWithSelf?: boolean;
};

export const extractEncryptionOptions = (
  options?: EncryptionOptions
): EncryptionOptions | undefined => {
  if (!options) return options;

  const error = new InvalidArgument(
    'options',
    '{ shareWithUsers?: Array<b64string>, shareWithGroups?: Array<string>, shareWithSelf?: bool }',
    options
  );

  const encryptionOptions: EncryptionOptions = extractSharingOptions(
    options,
    error
  );

  if ('shareWithSelf' in options) {
    if (typeof options.shareWithSelf !== 'boolean') throw error;
    encryptionOptions.shareWithSelf = options.shareWithSelf;
  } else {
    encryptionOptions.shareWithSelf = true;
  }

  if (
    (!encryptionOptions.shareWithUsers ||
      !encryptionOptions.shareWithUsers.length) &&
    (!encryptionOptions.shareWithGroups ||
      !encryptionOptions.shareWithGroups.length) &&
    !encryptionOptions.shareWithSelf
  )
    throw new InvalidArgument('cannot encrypt and not share with anybody');

  return encryptionOptions;
};
