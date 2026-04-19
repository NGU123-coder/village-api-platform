import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Fetch all states
 */
export const getStates = async (req: Request, res: Response) => {
  try {
    const states = await prisma.state.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(states);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch states' });
  }
};

/**
 * Fetch districts belonging to a specific state
 */
export const getDistrictsByState = async (req: Request, res: Response) => {
  try {
    const { stateId } = req.params;
    const districts = await prisma.district.findMany({
      where: { stateId: parseInt(stateId as string) },
      orderBy: { name: 'asc' },
    });
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch districts' });
  }
};

/**
 * Fetch sub-districts belonging to a specific district
 */
export const getSubDistrictsByDistrict = async (req: Request, res: Response) => {
  try {
    const { districtId } = req.params;
    const subDistricts = await prisma.subDistrict.findMany({
      where: { districtId: parseInt(districtId as string) },
      orderBy: { name: 'asc' },
    });
    res.json(subDistricts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sub-districts' });
  }
};

/**
 * Fetch villages belonging to a specific sub-district with pagination
 */
export const getVillagesBySubDistrict = async (req: Request, res: Response) => {
  try {
    const { subDistrictId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [villages, total] = await Promise.all([
        prisma.village.findMany({
            where: { subDistrictId: parseInt(subDistrictId as string) },
            orderBy: { name: 'asc' },
            skip,
            take
        }),
        prisma.village.count({
            where: { subDistrictId: parseInt(subDistrictId as string) }
        })
    ]);

    res.json({
        data: villages,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
        }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch villages' });
  }
};

/**
 * High-performance autocomplete for village search
 * Returns a standardized format for frontend select components:
 * { value, label, hierarchy }
 */
export const autocomplete = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();

    if (!q || q.length < 2) {
      return res.json([]);
    }

    // 1. Optimized Query (Native SQL for pg_trgm support if available, fallback to Prisma)
    let results: any[];
    
    try {
        // This only works on PostgreSQL with pg_trgm extension
        results = await prisma.$queryRaw`
          SELECT 
            v.id AS value,
            v.name AS village,
            sd.name AS "subDistrict",
            d.name AS district,
            s.name AS state
          FROM "Village" v
          JOIN "SubDistrict" sd ON v."subDistrictId" = sd.id
          JOIN "District" d ON sd."districtId" = d.id
          JOIN "State" s ON d."stateId" = s.id
          WHERE 
            v.name ILIKE ${q + '%'} OR 
            v.name % ${q}
          ORDER BY 
            (v.name = ${q}) DESC,
            (v.name ILIKE ${q + '%'}) DESC,
            similarity(v.name, ${q}) DESC
          LIMIT 10;
        `;
    } catch (e) {
        // Fallback for Development/SQLite
        const prismaResults = await prisma.village.findMany({
            where: { name: { contains: q } },
            select: {
                id: true,
                name: true,
                subDistrict: {
                    select: {
                        name: true,
                        district: {
                            select: {
                                name: true,
                                state: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            take: 10,
            orderBy: { name: 'asc' }
        });
        
        results = prismaResults.map(v => ({
            value: v.id,
            village: v.name,
            subDistrict: v.subDistrict.name,
            district: v.subDistrict.district.name,
            state: v.subDistrict.district.state.name
        }));
    }

    // 2. Transform to standard format
    const formattedResults = results.map((r) => ({
      value: r.value,
      label: `${r.village} (${r.subDistrict}, ${r.district}, ${r.state})`,
      hierarchy: {
        village: r.village,
        subDistrict: r.subDistrict,
        district: r.district,
        state: r.state,
      },
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Autocomplete API Error:', error);
    res.status(500).json({ error: 'Autocomplete search failed' });
  }
};

/**
 * Generic village search/list (Global)
 */
export const getVillages = async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const where = search ? {
        name: { contains: String(search) }
    } : {};

    const [villages, total] = await Promise.all([
        prisma.village.findMany({
            where,
            include: { subDistrict: { include: { district: { include: { state: true } } } } },
            orderBy: { name: 'asc' },
            skip,
            take
        }),
        prisma.village.count({ where })
    ]);

    res.json({
        data: villages,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
        }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch villages' });
  }
};
