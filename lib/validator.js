const validator = require('validator');




const validateBody = async (body, rules) => {
   if (!body) throw new Error('Request body is not given');

    if (!Object.keys(rules).every(key => Object.prototype.hasOwnProperty.call(body, key))) {
        throw new Error('Request body is missing required fields');
    }

    for (const [key, value] of Object.entries(body)) {
        const rule = rules[key]

        if (rule.includes("required")) {
            if (value == "" || !value) throw new Error(`${key} is required`)
        }

        if (rule.includes("string")) {
            if (!isAlpha(value)) throw new Error(`${key} is not valid string`)
        }

        if (rule.includes("number")) {
            if (!isNumeric(value)) throw new Error(`${key} is not numeric`);
        }

        if (rule.includes("email")) {
            if (!isEmail(value)) throw new Error(`${key} is not a valid email`);
        }

        if (rule.includes("url")) {
            if (!isURL(value)) throw new Error(`${key} is not a valid URL`);
        }
    }
}




modules.export = {
    validateBody
}