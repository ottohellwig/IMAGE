import { Environment } from '../environment';
import { ConnectorContext } from '../connectors/connector';
import { JSDoer } from './js-doer';
import FS from 'fs';
import Path from 'path';

process.env.SECRETS = '{}';

test('should register module', async () => {
  const [doer, env] = await setupEnvironment();
  const context = createEmptyContext(env);
  console.log(`\n\nDOER:\n${JSON.stringify(doer.main, null, 2)}`);
  const [test1, test2] = await doer.modules.Basic.main(env, context, {});

  expect(test1).toEqual('TEST');
  expect(test2).toEqual(`<div id="TEST"></div>`);
});

function getTestModulesConfig () {
  const testModulePath = Path.join(__dirname, '..', '..', 'js-doer-tests', 'basic.js');
  console.log(`\n\nLOADING TEST CODE FROM '${testModulePath}`);
  const module = { code: FS.readFileSync(testModulePath).toString() };
  console.log(`\n\nCODE:\n${module.code}`);
  return module;
}

async function setupEnvironment(): Promise<[JSDoer, Environment]> {
  const doer = new JSDoer();
  const modules = { doers: [doer] };
  const config = { modules: { JSDoer: getTestModulesConfig() } };
  console.log(`\n\nJSDOER TEST ENV CONFIG:\n${JSON.stringify(config)}`);
  const env = new Environment(modules, [], config);
  console.log(`\n\nJSDOER ENV MODULE:\n${JSON.stringify(env.config)}`)

  await env.init();
  return [doer, env];
}

function createEmptyContext(env: Environment): ConnectorContext<any> {
  return {
    data: {},
    errors: {},
    calls: {},
    connector: {
      input: {},
      config: {}
    },
    env: env
  };
}