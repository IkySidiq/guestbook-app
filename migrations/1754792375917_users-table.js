export const up = (pgm) => {
  pgm.sql(`
    CREATE TYPE user_role AS ENUM ('admin', 'user');
  `);

  pgm.createTable('users', {
    id: { type: 'varchar(50)', primaryKey: true },
    name: { type: 'varchar(100)', notNull: true },
    position: { type: 'varchar(100)', notNull: false },
    username: { type: 'varchar(50)', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('NOW()') },
    last_login: { type: 'timestamp', notNull: false },
    is_active: { type: 'boolean', notNull: true, default: true },
    role: { type: 'user_role', notNull: true },
  });
};

export const down = (pgm) => {
  pgm.dropTable('users');
  pgm.sql('DROP TYPE user_role');
};
