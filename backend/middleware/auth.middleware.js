const jwt = require('jsonwebtoken');
const Shop = require('../models/shop.model');

exports.verifyToken = async (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        // Проверка за Authorization хедър като резервен вариант
        const authHeader = req.headers['authorization'];
        const bearerToken = authHeader && authHeader.split(' ')[1];
        if(!bearerToken) {
            return res.status(403).send({ message: "No token provided!" });
        }
        token = bearerToken;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.shopDomain = decoded.shop;
        req.shopId = decoded.shopId;
        
        // Проверка дали магазинът все още съществува и е инсталиран
        const shop = await Shop.findById(req.shopId);
        if (!shop || !shop.is_installed) {
            return res.status(401).send({ message: "Unauthorized! App not installed or shop not found." });
        }

        next();
    } catch (err) {
        console.error("JWT Verification Error:", err);
        return res.status(401).send({ message: "Unauthorized!" });
    }
};