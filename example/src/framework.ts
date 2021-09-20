import { serverCleanup } from './admin';

type VoidAsyncFunction = () => Promise<void> | void;

type TestDescription = {
  name: string;
  test: VoidAsyncFunction;
};

type GroupDescription = {
  name: string;
  tests: Array<TestDescription>;
  onlyTests: Array<TestDescription>;
  beforeEach: VoidAsyncFunction | null;
  afterEach: VoidAsyncFunction | null;
};

const testRegistry = {
  groups: <GroupDescription[]>[],
  onlyGroups: <GroupDescription[]>[],
  started: false,
};

let currentGroup: GroupDescription | null = null;

function assertInDescribe(
  group: GroupDescription | null
): asserts group is GroupDescription {
  if (!group)
    throw new Error('this function must be used in a describe() block');
}

export function beforeEach(func: VoidAsyncFunction) {
  assertInDescribe(currentGroup);
  currentGroup.beforeEach = func;
}

export function afterEach(func: VoidAsyncFunction) {
  assertInDescribe(currentGroup);
  currentGroup.afterEach = func;
}

export function it(name: string, test: VoidAsyncFunction) {
  assertInDescribe(currentGroup);
  currentGroup.tests.push({ name, test });
}

it.only = (name: string, test: VoidAsyncFunction) => {
  assertInDescribe(currentGroup);
  currentGroup.onlyTests.push({ name, test });
};

function makeNewGroup(name: string): GroupDescription {
  return {
    name,
    tests: [],
    onlyTests: [],
    beforeEach: null,
    afterEach: null,
  };
}

export function describe(name: string, registerer: () => void) {
  if (currentGroup)
    throw new Error('nesting describe() blocks is not supported');

  currentGroup = makeNewGroup(name);
  registerer();
  testRegistry.groups.push(currentGroup);
  currentGroup = null;
}

describe.only = (name: string, registerer: () => void) => {
  if (currentGroup)
    throw new Error('nesting describe() blocks is not supported');

  currentGroup = makeNewGroup(name);
  registerer();
  testRegistry.onlyGroups.push(currentGroup);
  currentGroup = null;
};

export async function runTests(): Promise<string> {
  if (testRegistry.groups.length === 0)
    throw new Error('There are no tests to run');

  if (testRegistry.started)
    throw new Error(
      'Tests are already running/finished, reload the app to start over'
    );
  testRegistry.started = true;

  let partialRun = false;
  let success = true;

  if (testRegistry.onlyGroups.length > 0) partialRun = true;
  const groupList =
    testRegistry.onlyGroups.length > 0
      ? testRegistry.onlyGroups
      : testRegistry.groups;
  for (const group of groupList) {
    console.log(group.name);

    if (group.onlyTests.length > 0) partialRun = true;
    const testList = group.onlyTests.length > 0 ? group.onlyTests : group.tests;
    for (const test of testList) {
      console.log('  ', test.name);

      try {
        if (group.beforeEach) await group.beforeEach();
        await test.test();
        if (group.afterEach) await group.afterEach();
      } catch (e) {
        console.error('Test failed:', e);
        success = false;
      }
    }
  }

  let result;
  if (!success) result = 'FAILURE';
  else if (partialRun) result = 'SUCCESSFUL PARTIAL RUN';
  else result = 'SUCCESS';

  console.log('Tests result:', result);
  await serverCleanup();

  return result;
}
