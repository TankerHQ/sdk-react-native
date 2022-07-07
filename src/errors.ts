import {
  InvalidArgument,
  InternalError,
  NetworkError,
  PreconditionFailed,
  OperationCanceled,
  DecryptionFailed,
  GroupTooBig,
  InvalidVerification,
  TooManyAttempts,
  ExpiredVerification,
  DeviceRevoked,
  Conflict,
  UpgradeRequired,
  IdentityAlreadyAttached,
  TankerError,
} from '@tanker/errors';

export type Err = { err: Object };
export type Ok<T> = { ok: T };
export type Result<T> = Ok<T> | Err;

export const errors = {
  DecryptionFailed,
  DeviceRevoked,
  ExpiredVerification,
  GroupTooBig,
  InternalError,
  InvalidArgument,
  InvalidVerification,
  NetworkError,
  OperationCanceled,
  PreconditionFailed,
  TankerError,
  TooManyAttempts,
  UpgradeRequired,
  IdentityAlreadyAttached,
};

function translateException(e: any): never {
  if (typeof e !== 'object') throw e;

  switch (e.code) {
    case 'INVALID_ARGUMENT':
      throw new InvalidArgument(e.message);
    case 'INTERNAL_ERROR':
      throw new InternalError(e.message);
    case 'NETWORK_ERROR':
      throw new NetworkError(e.message);
    case 'PRECONDITION_FAILED':
      throw new PreconditionFailed(e.message);
    case 'OPERATION_CANCELED':
      throw new OperationCanceled(e.message);
    case 'DECRYPTION_FAILED':
      throw new DecryptionFailed(e.message);
    case 'GROUP_TOO_BIG':
      throw new GroupTooBig(e.message);
    case 'INVALID_VERIFICATION':
      throw new InvalidVerification(e.message);
    case 'TOO_MANY_ATTEMPTS':
      throw new TooManyAttempts(e.message);
    case 'EXPIRED_VERIFICATION':
      throw new ExpiredVerification(e.message);
    case 'IO_ERROR':
      throw new InternalError(`IoError: ${e.message}`); // IoError does not exist in pure Javascript!
    case 'DEVICE_REVOKED':
      throw new DeviceRevoked(e.message);
    case 'CONFLICT':
      throw new Conflict(e.message);
    case 'UPGRADE_REQUIRED':
      throw new UpgradeRequired(e.message);
    case 'IDENTITY_ALREADY_ATTACHED':
      throw new IdentityAlreadyAttached(e.message);
    default:
      // This could be something else than a TankerException, do not wrap or convert to avoid losing information
      throw e;
  }
}

export function bridgeSyncResult<T>(f: () => Result<T>): T {
  const result: Result<T> = f();
  if ('ok' in result) return result.ok;
  else if ('err' in result) translateException(result.err);
  else
    throw new InternalError(
      `bridgeSyncResult: Invalid Tanker Result returned from native function: ${JSON.stringify(
        result
      )}`
    );
}

export function bridgeAsyncExceptions<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((e) => {
    translateException(e);
  });
}
