import { Request, Response } from 'express';
import prisma from '../config/db';

/**
 * @openapi
 * /api/v1/states:
 *   get:
 *     summary: Retrieve all states
 *     responses:
 *       200:
 *         description: A list of states.
 */
export const getStates = async (req: Request, res: Response) => {
  try {
    const states = await prisma.state.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: states });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch states' });
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
    res.json({ success: true, data: districts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch districts' });
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
    res.json({ success: true, data: subDistricts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sub-districts' });
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
        success: true,
        data: villages,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
        }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch villages' });
  }
};

/**
 * @openapi
 * /api/v1/autocomplete:
 *   get:
 *     summary: Village search with autocomplete
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query
 */
export const autocomplete = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    let results: any[];
    
    try {
        // Attempt high-performance trigram search (requires pg_trgm extension)
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
    } catch (e: any) {
        console.error('Advanced search failed. Potential missing pg_trgm extension. Error:', e.message);
        
        // Fallback to standard Prisma search (slower but 100% reliable)
        const prismaResults = await prisma.village.findMany({
            where: { 
              name: { 
                contains: q,
                mode: 'insensitive' 
              } 
            },
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

    res.json({ success: true, data: formattedResults });
  } catch (error) {
    console.error('Autocomplete API Error:', error);
    res.status(500).json({ success: false, message: 'Autocomplete search failed' });
  }
};

/**
 * @openapi
 * /api/v1/villages:
 *   get:
 *     summary: Retrieve all villages with pagination
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
        success: true,
        data: villages,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
        }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch villages' });
  }
};
