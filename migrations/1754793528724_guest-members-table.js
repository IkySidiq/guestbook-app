export const up = (pgm) => {
  pgm.createTable('some_table', {
    id: {
      type: 'varchar(50)',
      primaryKey: true,
      notNull: true,
    },
    guest_id: {
      type: 'varchar(50)',
      notNull: true,
      references: 'guest_books(id)',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    name: {
      type: 'varchar(100)',
      notNull: true,
    },
  });
};

export const down = (pgm) => {
  pgm.dropTable('some_table');
};
