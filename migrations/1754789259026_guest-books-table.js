export const up = (pgm) => {
  pgm.sql(`
    CREATE TYPE guest_book_status AS ENUM ('sedang bertamu', 'selesai');
  `);

  pgm.createTable('guest_books', {
    id: { type: 'varchar(50)', primaryKey: true },
    address: { type: 'varchar(100)', notNull: true },
    contact_info: { type: 'varchar(100)', notNull: true },
    purpose: { type: 'text', notNull: true },
    institution: { type: 'varchar(50)', notNull: true },
    total_guest: { type: 'integer', notNull: true },
    status: { type: 'guest_book_status', notNull: true, default: 'sedang bertamu' },
    accepted_by: { type: 'varchar(50)', notNull: false },
    check_in: { type: 'timestamp', notNull: false },
    check_out: { type: 'timestamp', notNull: false },
    created_at: { type: 'timestamp', notNull: true },
    updated_at: { type: 'timestamp', notNull: true },
  });
};

export const down = (pgm) => {
  pgm.dropTable('guest_books');
  pgm.sql('DROP TYPE guest_book_status');
};
