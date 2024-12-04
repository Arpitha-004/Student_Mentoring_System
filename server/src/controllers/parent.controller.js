const Parent = require("../models/parent");

module.exports = {
    createParent: async (req, res) => {
        try {
            const { children, ...parentData } = req.body;

            // Create parent
            const newParent = new Parent({
                ...parentData,
                children, // List of student IDs
            });
            await newParent.save();

            res.status(201).json({ success: true, data: newParent });
        } catch (error) {
            console.error("Error creating parent:", error);
            res.status(500).json({ success: false, message: "Error creating parent" });
        }
    },
};
