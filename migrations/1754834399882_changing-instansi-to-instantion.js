export const up = (pgm) => {
  pgm.renameColumn('reservations', 'instansi', 'institution');
};

export const down = (pgm) => {
  pgm.renameColumn('reservations', 'institution', 'instansi');
};
