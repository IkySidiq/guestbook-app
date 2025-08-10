export const up = (pgm) => {
  pgm.sql(`
    ALTER TABLE guest_books
    ADD CONSTRAINT guest_books_accepted_by_fkey
    FOREIGN KEY (accepted_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
  `);
};

export const down = (pgm) => {
  pgm.sql(`
    ALTER TABLE guest_books
    DROP CONSTRAINT IF EXISTS guest_books_accepted_by_fkey;
  `);
};
