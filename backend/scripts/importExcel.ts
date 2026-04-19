import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const DATA_DIR = path.join(__dirname, '../data');
const BATCH_SIZE = 100; // Reduced batch size to prevent connection drops

// Global Cache for performance to avoid redundant lookups
const cache = {
  states: new Map<string, number>(),
  districts: new Map<string, number>(),
  subDistricts: new Map<string, number>(),
};

/**
 * Clean and validate Excel values. 
 * Returns null for empty or missing values.
 */
const cleanValue = (val: any): string | null => {
  if (val === undefined || val === null) return null;
  const cleaned = String(val).trim();
  return cleaned === '' ? null : cleaned;
};

/**
 * Interface for tracking file processing stats
 */
interface FileStats {
  total: number;
  inserted: number;
  skipped: number;
  failed: number;
}

async function insertVillagesBatch(batch: any[]): Promise<number> {
  if (batch.length === 0) return 0;
  try {
    // createMany with skipDuplicates: true is highly efficient on PostgreSQL
    const result = await prisma.village.createMany({
      data: batch,
      skipDuplicates: true,
    });
    
    // Add a small delay between batches to prevent database connection drops
    await new Promise(res => setTimeout(res, 150));
    
    return result.count;
  } catch (error: any) {
    console.error(`\n❌ Error inserting village batch: ${error.message}`);
    return 0;
  }
}

async function processFile(filePath: string, countryId: number): Promise<FileStats> {
  const fileName = path.basename(filePath);
  const stats: FileStats = { total: 0, inserted: 0, skipped: 0, failed: 0 };

  console.log(`\n📄 Processing: ${fileName}`);

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.readFile(filePath);
  } catch (error: any) {
    console.error(`❌ Failed to read ${fileName}: ${error.message}`);
    return stats;
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(worksheet);

  stats.total = data.length;
  console.log(`📊 Found ${stats.total} rows.`);

  let villageQueue: any[] = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    try {
      const stateName = cleanValue(row['STATE NAME']);
      const stateCode = cleanValue(row['MDDS STC']);
      const districtName = cleanValue(row['DISTRICT NAME']);
      const districtCode = cleanValue(row['MDDS DTC']);
      const subDistrictName = cleanValue(row['SUB-DISTRICT NAME']);
      const subDistrictCode = cleanValue(row['MDDS Sub_DT']);
      const villageName = cleanValue(row['Area Name']);
      const villageCode = cleanValue(row['MDDS PLCN']);

      if (!stateName || !districtName || !subDistrictName || !villageName) {
        stats.skipped++;
        continue;
      }

      // 1. Upsert State
      let stateId = cache.states.get(stateCode || stateName);
      if (!stateId) {
        const state = await prisma.state.upsert({
          where: stateCode ? { code: stateCode } : { name_countryId: { name: stateName, countryId } },
          update: {},
          create: { name: stateName, code: stateCode || null, countryId }
        });
        stateId = state.id;
        cache.states.set(stateCode || stateName, stateId);
      }

      // 2. Upsert District
      const districtKey = `${stateId}-${districtCode || districtName}`;
      let districtId = cache.districts.get(districtKey);
      if (!districtId) {
        const district = await prisma.district.upsert({
          where: districtCode ? { code: districtCode } : { name_stateId: { name: districtName, stateId } },
          update: {},
          create: { name: districtName, code: districtCode || null, stateId }
        });
        districtId = district.id;
        cache.districts.set(districtKey, districtId);
      }

      // 3. Upsert Sub-District
      const subDistrictKey = `${districtId}-${subDistrictCode || subDistrictName}`;
      let subDistrictId = cache.subDistricts.get(subDistrictKey);
      if (!subDistrictId) {
        const subDistrict = await prisma.subDistrict.upsert({
          where: subDistrictCode ? { code: subDistrictCode } : { name_districtId: { name: subDistrictName, districtId } },
          update: {},
          create: { name: subDistrictName, code: subDistrictCode || null, districtId }
        });
        subDistrictId = subDistrict.id;
        cache.subDistricts.set(subDistrictKey, subDistrictId);
      }

      // 4. Add Village to batch queue
      villageQueue.push({
        name: villageName,
        code: villageCode || null,
        subDistrictId
      });

      // 5. Process batch
      if (villageQueue.length >= BATCH_SIZE) {
        const inserted = await insertVillagesBatch(villageQueue);
        stats.inserted += inserted;
        stats.skipped += (villageQueue.length - inserted);
        villageQueue = [];
        process.stdout.write(`⏳ Progress: ${i + 1}/${stats.total} rows evaluated...\r`);
      }

    } catch (error: any) {
      stats.failed++;
      if (stats.failed <= 5) {
        console.error(`\n⚠️ Row ${i + 2} error: ${error.message}`);
      }
    }
  }

  // Final remaining batch
  if (villageQueue.length > 0) {
    const inserted = await insertVillagesBatch(villageQueue);
    stats.inserted += inserted;
    stats.skipped += (villageQueue.length - inserted);
  }

  console.log(`\n✅ ${fileName} Results:`);
  console.log(`   - Total Evaluated: ${stats.total}`);
  console.log(`   - New Villages Inserted: ${stats.inserted}`);
  console.log(`   - Skipped (Existing/Invalid): ${stats.skipped}`);
  console.log(`   - Failed Rows: ${stats.failed}`);

  return stats;
}

async function main() {
  console.log('🚀 Starting Restricted Multi-File Excel Import...');
  const startTime = Date.now();

  // Ensure Country exists
  const country = await prisma.country.upsert({
    where: { code: 'IN' },
    update: {},
    create: { name: 'India', code: 'IN' }
  });

  if (!fs.existsSync(DATA_DIR)) {
    console.error(`❌ Data directory not found: ${DATA_DIR}`);
    return;
  }

  // Restricted to specific files
  const targetFiles = ["Uttar_Pradesh.xls", "West_Bengal.xls"];
  const files = fs.readdirSync(DATA_DIR).filter(file => targetFiles.includes(file));

  if (files.length === 0) {
    console.warn('⚠️ None of the target files (Uttar_Pradesh.xls, West_Bengal.xls) found in backend/data/');
    return;
  }

  console.log(`📂 Found ${files.length} target state files. Starting import...\n`);

  let globalTotal = 0;
  let globalInserted = 0;

  for (const file of files) {
    const stats = await processFile(path.join(DATA_DIR, file), country.id);
    globalTotal += stats.total;
    globalInserted += stats.inserted;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n=======================================');
  console.log('🏁 GLOBAL IMPORT SUMMARY');
  console.log(`⏱️  Total Time: ${duration}s`);
  console.log(`📦 Files Processed: ${files.length}`);
  console.log(`✔️  Total New Villages Inserted: ${globalInserted}`);
  console.log(`📊 Total Records Evaluated: ${globalTotal}`);
  console.log('=======================================');
}

main()
  .catch(e => {
    console.error('💥 FATAL ERROR DURING IMPORT:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
