import fs from 'fs/promises';
import path from 'path';
import { apiKeyRepository } from '../database/repositories/apiKeyRepository';
import { dashboardRepository } from '../database/repositories/dashboardRepository';
import { datasourceRepository } from '../database/repositories/datasourceRepository';

async function migrateApiKeys() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'api-keys.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const apiKeys = JSON.parse(data);

    console.log(`\n📁 Found ${apiKeys.length} API keys to migrate`);

    for (const key of apiKeys) {
      try {
        await apiKeyRepository.create({
          id: key.id,
          user: key.name || 'admin',
          api_key: key.key,
          role: key.role
        });
        console.log(`✅ Migrated API key: ${key.name || key.id}`);
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`⚠️  API key already exists: ${key.name || key.id}`);
        } else {
          console.error(`❌ Failed to migrate API key ${key.name}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('📝 No API keys file found, skipping...');
    } else {
      console.error('❌ Error migrating API keys:', error);
    }
  }
}

async function migrateDashboards() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'dashboards.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const dashboards = JSON.parse(data);

    console.log(`\n📁 Found ${dashboards.length} dashboards to migrate`);

    for (const dashboard of dashboards) {
      try {
        let dashboardId = dashboard.id;
        
        if (typeof dashboardId === 'string') {
          const numericMatch = dashboardId.match(/\d+/);
          dashboardId = numericMatch ? parseInt(numericMatch[0]) : Date.now();
          console.log(`🔄 Converting string ID "${dashboard.id}" to numeric: ${dashboardId}`);
        }

        await dashboardRepository.create({
          id: dashboardId,
          uid: dashboard.uid,
          title: dashboard.title,
          tags: dashboard.tags || [],
          timezone: dashboard.timezone,
          schema_version: dashboard.schemaVersion,
          version: dashboard.version || 1,
          refresh: dashboard.refresh,
          time: dashboard.time,
          panels: dashboard.panels || []
        });
        console.log(`✅ Migrated dashboard: ${dashboard.title}`);
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`⚠️  Dashboard already exists: ${dashboard.title}`);
        } else {
          console.error(`❌ Failed to migrate dashboard ${dashboard.title}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('📝 No dashboards file found, skipping...');
    } else {
      console.error('❌ Error migrating dashboards:', error);
    }
  }
}

async function migrateDatasources() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'datasources.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const datasources = JSON.parse(data);

    console.log(`\n📁 Found ${datasources.length} datasources to migrate`);

    for (const ds of datasources) {
      try {
        await datasourceRepository.create({
          uid: ds.id,
          datasource_name: ds.name,
          type: ds.type,
          url: ds.url,
          database: ds.database
        });
        console.log(`✅ Migrated datasource: ${ds.name}`);
      } catch (error: any) {
        if (error.code === '23505') {
          console.log(`⚠️  Datasource already exists: ${ds.name}`);
        } else {
          console.error(`❌ Failed to migrate datasource ${ds.name}:`, error.message);
        }
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('📝 No datasources file found, skipping...');
    } else {
      console.error('❌ Error migrating datasources:', error);
    }
  }
}

async function main() {
  console.log('🚀 Starting migration from JSON to PostgreSQL...\n');
  console.log('='.repeat(50));

  await migrateApiKeys();
  await migrateDashboards();
  await migrateDatasources();

  console.log('\n' + '='.repeat(50));
  console.log('✅ Migration completed!\n');
  console.log('💡 Tip: You can now delete the JSON files if migration was successful:');
  console.log('   - data/api-keys.json');
  console.log('   - data/dashboards.json');
  console.log('   - data/datasources.json\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
