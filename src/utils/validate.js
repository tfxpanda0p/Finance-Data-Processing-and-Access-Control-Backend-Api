const Joi = require("joi");

const validateRegister = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().required().lowercase(),
        password: Joi.string().min(6).max(30).required(),
        key: Joi.string().optional().allow('', null)
    });

    return schema.validate(data);
};

const validateLogin = (data) => {
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    });
    return schema.validate(data);
}

const validateCreateRecord = (data) => {
    const schema = Joi.object({
        amount: Joi.number().positive().required(),
        type: Joi.string().valid('income', 'expense').required(),
        category: Joi.string().trim().required(),
        description: Joi.string().trim().allow('').optional(),
        date: Joi.date().max('now'),
    });
    return schema.validate(data);
}

const validateUpdateRecord = (data) => {
    const schema = Joi.object({
        amount: Joi.number().optional(),
        type: Joi.string().valid('income', 'expense').optional(),
        category: Joi.string().optional(),
        date: Joi.date().optional(),
        description: Joi.string().optional(),
    });
    return schema.validate(data);
}

module.exports = { validateRegister, validateLogin, validateCreateRecord, validateUpdateRecord };