export const up = (pgm) => {
  // Set default value 'user' ke kolom role
  pgm.alterColumn('users', 'role', {
    type: 'user_role',
    notNull: true,
    default: 'user',
  });

  // Tambahan: pastikan constraint enum sudah ada (karena kamu minta buat add constraint)
  // Biasanya enum sudah ada, jadi tidak perlu buat ulang enum type di sini
};

export const down = (pgm) => {
  // Rollback default value ke null (atau hapus default)
  pgm.alterColumn('users', 'role', {
    type: 'user_role',
    notNull: true,
    default: null,
  });
};
