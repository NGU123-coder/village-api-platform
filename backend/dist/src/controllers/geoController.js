"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVillages = exports.autocomplete = exports.getVillagesBySubDistrict = exports.getSubDistrictsByDistrict = exports.getDistrictsByState = exports.getStates = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * Fetch all states
 */
const getStates = async (req, res) => {
    try {
        const states = await prisma.state.findMany({
            orderBy: { name: 'asc' },
        });
        res.json(states);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch states' });
    }
};
exports.getStates = getStates;
/**
 * Fetch districts belonging to a specific state
 */
const getDistrictsByState = async (req, res) => {
    try {
        const { stateId } = req.params;
        const districts = await prisma.district.findMany({
            where: { stateId: parseInt(stateId) },
            orderBy: { name: 'asc' },
        });
        res.json(districts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch districts' });
    }
};
exports.getDistrictsByState = getDistrictsByState;
/**
 * Fetch sub-districts belonging to a specific district
 */
const getSubDistrictsByDistrict = async (req, res) => {
    try {
        const { districtId } = req.params;
        const subDistricts = await prisma.subDistrict.findMany({
            where: { districtId: parseInt(districtId) },
            orderBy: { name: 'asc' },
        });
        res.json(subDistricts);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch sub-districts' });
    }
};
exports.getSubDistrictsByDistrict = getSubDistrictsByDistrict;
/**
 * Fetch villages belonging to a specific sub-district with pagination
 */
const getVillagesBySubDistrict = async (req, res) => {
    try {
        const { subDistrictId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);
        const [villages, total] = await Promise.all([
            prisma.village.findMany({
                where: { subDistrictId: parseInt(subDistrictId) },
                orderBy: { name: 'asc' },
                skip,
                take
            }),
            prisma.village.count({
                where: { subDistrictId: parseInt(subDistrictId) }
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch villages' });
    }
};
exports.getVillagesBySubDistrict = getVillagesBySubDistrict;
/**
 * High-performance autocomplete for village search
 * Returns a standardized format for frontend select components:
 * { value, label, hierarchy }
 */
const autocomplete = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        if (!q || q.length < 2) {
            return res.json([]);
        }
        // 1. Optimized Query (Native SQL for pg_trgm support if available, fallback to Prisma)
        let results;
        try {
            // This only works on PostgreSQL with pg_trgm extension
            results = await prisma.$queryRaw `
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
        }
        catch (e) {
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
    }
    catch (error) {
        console.error('Autocomplete API Error:', error);
        res.status(500).json({ error: 'Autocomplete search failed' });
    }
};
exports.autocomplete = autocomplete;
/**
 * Generic village search/list (Global)
 */
const getVillages = async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch villages' });
    }
};
exports.getVillages = getVillages;
