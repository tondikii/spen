const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..');
const database = new DatabaseSync(':memory:');
database.exec('PRAGMA foreign_keys = ON;');

const migrationFiles = fs
  .readdirSync(path.join(root, 'drizzle'))
  .map((entry) => path.join(root, 'drizzle', entry, 'migration.sql'))
  .filter((entry) => fs.existsSync(entry))
  .sort();

for (const migrationFile of migrationFiles) {
  const sql = fs.readFileSync(migrationFile, 'utf8');
  for (const statement of sql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim();
    if (trimmed) database.exec(trimmed);
  }
}

const insertWallet = database.prepare(
  'INSERT INTO wallets (name, initial_balance, is_savings, archived) VALUES (?, ?, ?, ?)',
);
const insertCategory = database.prepare(
  'INSERT INTO categories (name, type, is_adjustment, icon, archived) VALUES (?, ?, ?, ?, ?)',
);
const insertGoal = database.prepare(
  'INSERT INTO goals (name, target_amount, target_date, wallet_id, monthly_contribution, archived) VALUES (?, ?, ?, ?, ?, ?)',
);
const insertTransaction = database.prepare(
  'INSERT INTO transactions (type, wallet_id, to_wallet_id, category_id, amount, date, time, note, is_initial, admin_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
);

for (let index = 1; index <= 10; index += 1) {
  insertWallet.run(`Wallet ${index}`, 1000000, index % 4 === 0 ? 1 : 0, 0);
}
for (let index = 1; index <= 50; index += 1) {
  insertCategory.run(`Kategori ${index}`, index % 3 === 0 ? 'income' : 'expense', 0, '*', 0);
}
for (let index = 1; index <= 20; index += 1) {
  insertGoal.run(`Goal ${index}`, 5000000, '2027-12-31', ((index - 1) % 10) + 1, 250000, 0);
}
for (let index = 1; index <= 10000; index += 1) {
  const walletId = ((index - 1) % 10) + 1;
  const categoryId = ((index - 1) % 50) + 1;
  const type = index % 3 === 0 ? 'income' : 'expense';
  insertTransaction.run(
    type,
    walletId,
    null,
    categoryId,
    10000 + (index % 100) * 1000,
    `2026-${String(((index - 1) % 12) + 1).padStart(2, '0')}-${String(((index - 1) % 28) + 1).padStart(2, '0')}`,
    '12:00',
    `Benchmark ${index}`,
    0,
    0,
  );
}

const queries = {
  walletOverview: `SELECT w.id, w.name, w.initial_balance + COALESCE(SUM(CASE WHEN t.type = 'income' AND t.wallet_id = w.id THEN t.amount WHEN t.type = 'expense' AND t.wallet_id = w.id THEN -t.amount ELSE 0 END), 0) AS balance FROM wallets w LEFT JOIN transactions t ON t.wallet_id = w.id OR t.to_wallet_id = w.id WHERE w.archived = 0 GROUP BY w.id ORDER BY w.id`,
  transactions: `SELECT t.id, t.type, t.wallet_id, t.category_id, t.amount, t.date, t.time, c.is_adjustment FROM transactions t LEFT JOIN categories c ON c.id = t.category_id ORDER BY t.date DESC, t.time DESC, t.id DESC`,
  goals:
    'SELECT id, name, target_amount, target_date, wallet_id, monthly_contribution FROM goals WHERE archived = 0 ORDER BY id',
  transactionById:
    'SELECT id, type, wallet_id, category_id, amount, date FROM transactions WHERE id = ?',
};

function measure(name, statement, parameter) {
  const run = () => (parameter === undefined ? statement.all() : statement.all(parameter));
  run();
  const samples = [];
  for (let index = 0; index < 5; index += 1) {
    const started = performance.now();
    run();
    samples.push(performance.now() - started);
  }
  return {
    name,
    iterations: samples.length,
    minMs: Math.min(...samples),
    avgMs: samples.reduce((a, b) => a + b, 0) / samples.length,
  };
}

const statements = Object.fromEntries(
  Object.entries(queries).map(([name, sql]) => [name, database.prepare(sql)]),
);
const timings = Object.entries(statements).map(([name, statement]) =>
  measure(name, statement, name === 'transactionById' ? 5000 : undefined),
);
const plans = Object.entries(queries).map(([name, sql]) => ({
  name,
  plan:
    name === 'transactionById'
      ? database.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(5000)
      : database.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(),
}));

const result = {
  generatedAt: new Date().toISOString(),
  runtime: process.version,
  dataset: { wallets: 10, categories: 50, goals: 20, transactions: 10000 },
  counts: Object.fromEntries(
    ['wallets', 'categories', 'goals', 'transactions'].map((table) => [
      table,
      database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count,
    ]),
  ),
  timings,
  explainQueryPlan: plans,
};
console.log(JSON.stringify(result, null, 2));
database.close();
