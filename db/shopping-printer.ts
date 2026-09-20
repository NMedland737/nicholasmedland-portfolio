import {
  shoppingPrintRequestsIndexSql,
  shoppingPrintRequestsTableSql,
} from './schema';

let schemaReady: Promise<void> | null = null;

export function ensureShoppingPrinterSchema(db: D1Database): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.prepare(shoppingPrintRequestsTableSql).run();
      await db.batch(shoppingPrintRequestsIndexSql.map((sql) => db.prepare(sql)));
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
