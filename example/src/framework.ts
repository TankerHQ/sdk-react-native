type TestDescription = {
  name: string,
  test: Function,
};

type GroupDescription = {
  name: string,
  tests: Array<TestDescription>,
  onlyTests: Array<TestDescription>,
  beforeEach: Function | null,
  afterEach: Function | null,
};

const testRegistry = {
  groups: <GroupDescription[]>[],
  onlyGroups: <GroupDescription[]>[],
  started: false,
};

let currentGroup: GroupDescription | null = null;

export function beforeEach(func: Function) {
  if (!currentGroup)
    throw new Error("it() must be used in a describe");

  currentGroup.beforeEach = func;
}

export function afterEach(func: Function) {
  if (!currentGroup)
    throw new Error("it() must be used in a describe");

  currentGroup.afterEach = func;
}

export function it(name: string, test: Function) {
  if (!currentGroup)
    throw new Error("it() must be used in a describe");

  currentGroup.tests.push({ name, test });
}

it.only = (name: string, test: Function) => {
  if (!currentGroup)
    throw new Error("it() must be used in a describe");

  currentGroup.onlyTests.push({ name, test });
};

export function describe(name: string, registrer: Function) {
  if (currentGroup)
    throw new Error("nesting describe() blocks is not supported");

  currentGroup = {
    name,
    tests: [],
    onlyTests: [],
    beforeEach: null,
    afterEach: null,
  };
  registrer();
  testRegistry.groups.push(currentGroup);
  currentGroup = null;
}

describe.only = (name: string, registrer: Function) => {
  currentGroup = {
    name,
    tests: [],
    onlyTests: [],
    beforeEach: null,
    afterEach: null,
  };
  registrer();
  testRegistry.onlyGroups.push(currentGroup);
  currentGroup = null;
}

export async function runTests(): Promise<string> {
  if (testRegistry.groups.length === 0)
    throw new Error("There are no tests to run");

  if (testRegistry.started)
    throw new Error("Tests are already running/finished, reload the app to start over");
  testRegistry.started = true;

  let partialRun = false;
  let success = true;

  if (testRegistry.onlyGroups.length > 0)
    partialRun = true;
  const groupList = testRegistry.onlyGroups.length > 0 ? testRegistry.onlyGroups : testRegistry.groups;
  for (const group of groupList) {
    console.log(group.name);

    if (group.onlyTests.length > 0)
      partialRun = true;
    const testList = group.onlyTests.length > 0 ? group.onlyTests : group.tests;
    for (const test of testList) {
      console.log("  ", test.name);

      try {
        if (group.beforeEach)
          await group.beforeEach();
        await test.test();
        if (group.afterEach)
          await group.afterEach();
      } catch (e) {
        console.error("Test failed:", e);
        success = false;
      }
    }
  }

  let result;
  if (!success)
    result = 'FAILURE';
  else if (partialRun)
    result = 'SUCCESSFUL PARTIAL RUN';
  else
    result = 'SUCCESS';

  console.log('Tests result:', result);

  return result;
}
