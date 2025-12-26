import { query } from '../connection';

export interface Dashboard {
  id: number;
  uid: string;
  title: string;
  tags?: string[];
  timezone?: string;
  schema_version?: number;
  version: number;
  refresh?: string;
  time?: any;
  panels: any[];
  dashboard_link?: string;
  created_at: Date;
  updated_at: Date;
}

export const dashboardRepository = {
  async findAll(): Promise<Dashboard[]> {
    const result = await query('SELECT * FROM dashboards ORDER BY updated_at DESC');
    return result.rows;
  },

  async findById(id: number): Promise<Dashboard | null> {
    const result = await query('SELECT * FROM dashboards WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByUid(uid: string): Promise<Dashboard | null> {
    const result = await query('SELECT * FROM dashboards WHERE uid = $1', [uid]);
    return result.rows[0] || null;
  },

  async create(dashboard: Omit<Dashboard, 'created_at' | 'updated_at'>): Promise<Dashboard> {
    const result = await query(
      `INSERT INTO dashboards (
        id, uid, title, tags, timezone, schema_version, version, 
        refresh, time, panels, dashboard_link
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        dashboard.id,
        dashboard.uid,
        dashboard.title,
        dashboard.tags || [],
        dashboard.timezone,
        dashboard.schema_version,
        dashboard.version || 1,
        dashboard.refresh,
        JSON.stringify(dashboard.time || {}),
        JSON.stringify(dashboard.panels || []),
        dashboard.dashboard_link
      ]
    );
    return result.rows[0];
  },

  async update(id: number, dashboard: Partial<Dashboard>): Promise<Dashboard | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (dashboard.title !== undefined) {
      fields.push(`title = $${paramCounter++}`);
      values.push(dashboard.title);
    }
    if (dashboard.tags !== undefined) {
      fields.push(`tags = $${paramCounter++}`);
      values.push(dashboard.tags);
    }
    if (dashboard.timezone !== undefined) {
      fields.push(`timezone = $${paramCounter++}`);
      values.push(dashboard.timezone);
    }
    if (dashboard.version !== undefined) {
      fields.push(`version = $${paramCounter++}`);
      values.push(dashboard.version);
    }
    if (dashboard.refresh !== undefined) {
      fields.push(`refresh = $${paramCounter++}`);
      values.push(dashboard.refresh);
    }
    if (dashboard.time !== undefined) {
      fields.push(`time = $${paramCounter++}`);
      values.push(JSON.stringify(dashboard.time));
    }
    if (dashboard.panels !== undefined) {
      fields.push(`panels = $${paramCounter++}`);
      values.push(JSON.stringify(dashboard.panels));
    }
    if (dashboard.dashboard_link !== undefined) {
      fields.push(`dashboard_link = $${paramCounter++}`);
      values.push(dashboard.dashboard_link);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await query(
      `UPDATE dashboards SET ${fields.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  },

  async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM dashboards WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  },

  async deleteByUid(uid: string): Promise<boolean> {
    const result = await query('DELETE FROM dashboards WHERE uid = $1', [uid]);
    return (result.rowCount || 0) > 0;
  },

  async searchByTitle(searchTerm: string): Promise<Dashboard[]> {
    const result = await query(
      'SELECT * FROM dashboards WHERE title ILIKE $1 ORDER BY updated_at DESC',
      [`%${searchTerm}%`]
    );
    return result.rows;
  },

  async findByTags(tags: string[]): Promise<Dashboard[]> {
    const result = await query(
      'SELECT * FROM dashboards WHERE tags && $1 ORDER BY updated_at DESC',
      [tags]
    );
    return result.rows;
  }
};
