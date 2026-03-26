const mocktestService = require("../services/mocktestService");
const getDevice = require("../utils/getDevice");

exports.init = async (req, res) => {
    const device = getDevice(req);
    const prepareTestObj = await mocktestService.init(req, res);
    if (!prepareTestObj) {
        return res.status(404).send("Mocktest Initialization Failed !!!");
    }
    res.render(`pages/${device}/startquiz`, { prepareTestObj });
}

exports.createOrder = async (req, res) => {
    const device = getDevice(req);
    const examSession = await mocktestService.createOrder(req, res);
    if (!examSession) {
        return res.status(404).send("Create Mocktest Order Failed !!!");
    }
    return res.render(`pages/${getDevice(req)}/quiz`, { examSession });
}

exports.submit = async (req, res) => {
    const device = getDevice(req);
    const examSession = await mocktestService.submit(req, res);
    if (!examSession) {
        return res.status(404).send("Mocktest Submit Failed !!!");
    }
    // ✅ Render result page
    return res.render(`pages/${device}/quizresults`, { examSession });
}