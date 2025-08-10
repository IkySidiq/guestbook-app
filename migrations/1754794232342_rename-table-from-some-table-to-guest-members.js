export const up = (pgm) => {
  pgm.renameTable('some_table', 'guest_members');
};

export const down = (pgm) => {
  pgm.renameTable('guest_members', 'some_table');
};
