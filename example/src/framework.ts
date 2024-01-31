import chai from 'chai';

chai.config.truncateThreshold = 0;

export { expect } from 'chai';

export type VoidAsyncFunction = () => Promise<void> | void;

export type TestDescription = {
  name: string;
  test: VoidAsyncFunction;
};

export type GroupDescription = {
  name: string;
  tests: Array<TestDescription>;
  onlyTests: Array<TestDescription>;
  beforeEach: VoidAsyncFunction | null;
  afterEach: VoidAsyncFunction | null;
};

export const testRegistry = {
  groups: <GroupDescription[]>[],
  onlyGroups: <GroupDescription[]>[],
};

export type TestResult = {
  success: boolean;
  errorMessage?: string;
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

export async function runTestByName(
  groupName: string,
  testName: string
): Promise<TestResult> {
  const allGgroupList = testRegistry.onlyGroups.concat(testRegistry.groups);

  const group = allGgroupList.find((g) => g.name === groupName);
  if (!group) throw new Error(`Test group "${groupName}" does not exist`);

  const allTestList = group.onlyTests.concat(group.tests);
  const test = allTestList.find((t) => t.name === testName);
  if (!test) throw new Error(`Test "${groupName}" does not exist`);

  try {
    if (group.beforeEach) await group.beforeEach();
    await test.test();
    if (group.afterEach) await group.afterEach();
    return {
      success: true,
    };
  } catch (e) {
    console.error(`Test "${testName}" failed: ${e}`);
    return {
      success: false,
      errorMessage: `${e}`,
    };
  }
}

export type TestList = {
  [group: string]: string[];
};

export function getTestList(): TestList {
  const testList: TestList = {};

  // If there is any .only anywhere, start filtering out all non-only tests
  let haveOnlyTestsAnywhere = false;
  if (testRegistry.onlyGroups.length > 0) haveOnlyTestsAnywhere = true;
  for (const group of testRegistry.groups)
    if (group.onlyTests.length > 0) haveOnlyTestsAnywhere = true;

  // Always add tests from a describe.only()
  for (const group of testRegistry.onlyGroups) {
    let activeTests =
      group.onlyTests.length > 0 ? group.onlyTests : group.tests;
    if (activeTests.length > 0)
      testList[group.name] = activeTests.map((t) => t.name);
  }

  // Always add any it.only() anywhere, otherwise add regular it()s
  for (const group of testRegistry.groups) {
    let activeTests = haveOnlyTestsAnywhere ? group.onlyTests : group.tests;
    if (activeTests.length > 0)
      testList[group.name] = activeTests.map((t) => t.name);
  }

  return testList;
}
