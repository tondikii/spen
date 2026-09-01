// Deklarasi tipe untuk import file migrasi .sql (inline-import via babel).
declare module '*.sql' {
  const content: string;
  export default content;
}
