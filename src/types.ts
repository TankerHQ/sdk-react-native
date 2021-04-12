export type NativeTanker = number;

export type TankerOptions = {
  appId: string;
  writablePath?: string;
  url?: string;
};

const statusDefs = [
  /* 0 */ { name: 'STOPPED' },
  /* 1 */ { name: 'READY' },
  /* 2 */ { name: 'IDENTITY_REGISTRATION_NEEDED' },
  /* 3 */ { name: 'IDENTITY_VERIFICATION_NEEDED' },
];

export const statuses: { [name: string]: number } = (() => {
  const h: typeof statuses = {};
  statusDefs.forEach((def, index) => {
    h[def.name] = index;
  });
  return h;
})();

export type Status = number;
