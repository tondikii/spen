/** Pesan error domain per locale (ADR-0006: diterjemahkan di boundary UI). */
export const errorsId = {
  unknown: 'Unknown application error',
  validation: 'Periksa kembali data yang dimasukkan.',
  storage: 'Data belum bisa disimpan.',
  notFound: 'Data tidak ditemukan.',
  backupInvalid: 'File backup tidak valid.',
};

export const errorsEn: typeof errorsId = {
  unknown: 'Unknown application error',
  validation: 'Check the data you entered.',
  storage: 'The data could not be saved.',
  notFound: 'Data not found.',
  backupInvalid: 'The backup file is invalid.',
};
