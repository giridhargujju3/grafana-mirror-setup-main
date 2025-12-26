import { query } from '../connection';

export interface Datasource {
  uid: string;
  datasource_name: string;
  type: string;
  url: string;
  database?: string;
  dashboard_link?: string;
  created_at: Date;
  updated_at: Date;
}

export const datasourceRepository = {
  async findAll(): Promise<Datasource[]> {
    const result = await query('SELECT * FROM datasources ORDER BY created_at DESC');
    return result.rows;
  },

  async findByUid(uid: string): Promise<Datasource | null> {
    const result = await query('SELECT * FROM datasources WHERE uid = $1', [uid]);
    return result.rows[0] || null;
  },

  async findByName(name: string): Promise<Datasource | null> {
    const result = await query('SELECT * FROM datasources WHERE datasource_name = $1', [name]);
    return result.rows[0] || null;
  },

  async create(datasource: Omit<Datasource, 'created_at' | 'updated_at'>): Promise<Datasource> {
    const result = await query(
      `INSERT INTO datasources (uid, datasource_name, type, url, database, dashboard_link)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        datasource.uid,
        datasource.datasource_name,
        datasource.type,
        datasource.url,
        datasource.database,
        datasource.dashboard_link
      ]
    );
    return result.rows[0];
  },

  async update(uid: string, datasource: Partial<Datasource>): Promise<Datasource | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (datasource.datasource_name !== undefined) {
      fields.push(`datasource_name = $${paramCounter++}`);
      values.push(datasource.datasource_name);
    }
    if (datasource.type !== undefined) {
      fields.push(`type = $${paramCounter++}`);
      values.push(datasource.type);
    }
    if (datasource.url !== undefined) {
      fields.push(`url = $${paramCounter++}`);
      values.push(datasource.url);
    }
    if (datasource.database !== undefined) {
      fields.push(`database = $${paramCounter++}`);
      values.push(datasource.database);
    }
    if (datasource.dashboard_link !== undefined) {
      fields.push(`dashboard_link = $${paramCounter++}`);
      values.push(datasource.dashboard_link);
    }

    if (fields.length === 0) {
      return this.findByUid(uid);
    }

    values.push(uid);
    const result = await query(
      `UPDATE datasources SET ${fields.join(', ')} WHERE uid = $${paramCounter} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(uid: string): Promise<boolean> {
    const result = await query('DELETE FROM datasources WHERE uid = $1', [uid]);
    return (result.rowCount || 0) > 0;
  },

  async findByType(type: string): Promise<Datasource[]> {
    const result = await query('SELECT * FROM datasources WHERE type = $1', [type]);
    return result.rows;
  }
};
