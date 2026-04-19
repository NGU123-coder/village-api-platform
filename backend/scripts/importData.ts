import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const CSV_FILE_PATH = path.join(__dirname, '../../data-pipeline/data/sample.csv');
const BATCH_SIZE = 2000;

// In-memory cache to avoid redundant DB lookups for parents
const cache = {
  countryId: null as number | null,
  states: new Map<string, number>(), // name -> id
  districts: new Map<string, number>(), // stateId_name -> id
  subDistricts: new Map<string, number>(), // districtId_name -> id
};

async function main() {
  console.log('🚀 Starting Data Import...');
  const startTime = Date.now();

  let totalRows = 0;
  let successCount = 0;
  let failedCount = 0;
  let villageBatch: any[] = [];

  // 1. Ensure Country exists (India)
  const country = await prisma.country.upsert({
    where: { code: 'IN' },
    update: {},
    create: { name: 'India', code: 'IN' }
  });
  cache.countryId = country.id;

  const stream = fs.createReadStream(CSV_FILE_PATH).pipe(csv());

  for await (const row of stream) {
    totalRows++;
    
    try {
      const { 
        state_name, state_code,
        district_name,
        sub_district_name,
        village_name, pin_code, population
      } = row;

      if (!state_name || !district_name || !sub_district_name || !village_name) {
        throw new Error('Missing required fields');
      }

      // 2. Handle State
      let stateId = cache.states.get(state_name);
      if (!stateId) {
        const state = await prisma.state.upsert({
          where: { name_countryId: { name: state_name, countryId: country.id } },
          update: {},
          create: { name: state_name, code: state_code || state_name.substring(0, 2).toUpperCase(), countryId: country.id }
        });
        stateId = state.id;
        cache.states.set(state_name, stateId);
      }

      // 3. Handle District
      const districtKey = `${stateId}_${district_name}`;
      let districtId = cache.districts.get(districtKey);
      if (!districtId) {
        const district = await prisma.district.upsert({
          where: { name_stateId: { name: district_name, stateId } },
          update: {},
          create: { name: district_name, stateId }
        });
        districtId = district.id;
        cache.districts.set(districtKey, districtId);
      }

      // 4. Handle SubDistrict
      const subDistrictKey = `${districtId}_${sub_district_name}`;
      let subDistrictId = cache.subDistricts.get(subDistrictKey);
      if (!subDistrictId) {
        const subDistrict = await prisma.subDistrict.upsert({
          where: { name_districtId: { name: sub_district_name, districtId } },
          update: {},
          create: { name: sub_district_name, districtId }
        });
        subDistrictId = subDistrict.id;
        cache.subDistricts.set(subDistrictKey, subDistrictId);
      }

      // 5. Add Village to Batch
      villageBatch.push({
        name: village_name,
        subDistrictId,
        pinCode: pin_code || null,
        population: population ? parseInt(population) : null
      });

      // 6. Process Batch
      if (villageBatch.length >= BATCH_SIZE) {
        await processVillageBatch(villageBatch);
        successCount += villageBatch.length;
        villageBatch = [];
        console.log(`⏳ Progress: ${totalRows} rows processed...`);
      }

    } catch (error) {
      failedCount++;
      // console.error(`❌ Failed at row ${totalRows}:`, error.message);
    }
  }

  // Final batch
  if (villageBatch.length > 0) {
    await processVillageBatch(villageBatch);
    successCount += villageBatch.length;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n--- Import Summary ---');
  console.log(`✅ Total Time: ${duration}s`);
  console.log(`📊 Rows Processed: ${totalRows}`);
  console.log(`✔️ Successfully Inserted: ${successCount}`);
  console.log(`❌ Failed: ${failedCount}`);
}

async function processVillageBatch(batch: any[]) {
    // Note: SQLite doesn't support createMany with skipDuplicates efficiently in some versions,
    // so we handle unique constraint manually or ensure CSV is clean.
    // For production-grade PostgreSQL/MySQL, prisma.village.createMany is ideal.
    
    // We use a transaction to ensure atomicity for the batch
    await prisma.$transaction(
        batch.map(v => prisma.village.upsert({
            where: { name_subDistrictId: { name: v.name, subDistrictId: v.subDistrictId } },
            update: { pinCode: v.pinCode, population: v.population },
            create: v
        }))
    );
}

main()
  .catch(e => {
    console.error('💥 Import Script Crashed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
