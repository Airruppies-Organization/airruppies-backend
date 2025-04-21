
const verifyWebhook = async (res, req, next) => {
    if (!req.body.event || !req.body["event.type"]) {
        return res.status(400).json({ message: "Event is required" });
    }

    const event = req.body.event;
    const eventType = req.body["event.type"];

    if (event !== "charge.completed") return res.status(403).json({message: "you are not allowed to view this"});

    if (eventType !== "BANK_TRANSFER_TRANSACTION") return res.status(403).json({message: "you are not allowed to view this"});

    next();
}


module.exports = {
    verifyWebhook
}