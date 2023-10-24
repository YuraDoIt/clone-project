import ormconfig from './ormconfig';

const ormseedconfig = {
  ...ormconfig,
  migrations: [__dirname + '/seeds/**/*.ts'],
  cli: {
    migrationsDir: __dirname + '/seeds',
  },
};

export default ormseedconfig;
