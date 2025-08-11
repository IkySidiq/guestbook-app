export const up = (pgm) => {
  pgm.renameColumn('reservations', 'reservasi_id', 'id');
};

export const down = (pgm) => {
  pgm.renameColumn('reservations', 'id', 'reservasi_id');
};
