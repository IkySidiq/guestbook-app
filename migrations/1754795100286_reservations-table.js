export const up = (pgm) => {
  pgm.sql(`
    CREATE TYPE reservation_status AS ENUM ('reserved', 'canceled', 'accepted');
  `);

  pgm.createTable('reservations', {
    reservasi_id: {
      type: 'varchar(50)',
      primaryKey: true,
      notNull: true,
    },
    name: {
      type: 'varchar(50)',
      notNull: true,
    },
    contact_info: {
      type: 'varchar(50)',
      notNull: true,
    },
    purpose: {
      type: 'text',
      notNull: true,
    },
    status: {
      type: 'reservation_status',
      notNull: true,
      default: 'reserved',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('NOW()'),
    },
    instansi: {
      type: 'varchar(50)',
      notNull: true,
    },
    reservation_date: {
      type: 'timestamp',
      notNull: true,
    },
    created_by: {
      type: 'varchar(50)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    address: {
      type: 'text',
      notNull: false,
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable('reservations');
  pgm.sql('DROP TYPE reservation_status');
};
