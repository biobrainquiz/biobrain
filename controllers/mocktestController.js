const mocktestService = require("../services/mocktestService");
const getDevice = require("../utils/getDevice");


exports.init = async (req, res) => {
    const device = getDevice(req);
    const prepareTestObj = await mocktestService.init(req, res);
    if (!prepareTestObj) {
        return res.status(404).send("Test session not found");
    }
    res.render(`pages/${device}/startquiz`, { prepareTestObj });
}
