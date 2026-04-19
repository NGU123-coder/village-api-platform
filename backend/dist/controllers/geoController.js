"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVillagesBySubDistrict = exports.getSubDistrictsByDistrict = exports.getDistrictsByState = exports.getStates = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
const getVillagesBySubDistrict = async (req, res) => {
    try {
        const { subDistrictId } = req.params;
        const villages = await prisma.village.findMany({
            where: { subDistrictId: parseInt(subDistrictId) },
            orderBy: { name: 'asc' },
        });
        res.json(villages);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch villages' });
    }
};
exports.getVillagesBySubDistrict = getVillagesBySubDistrict;
