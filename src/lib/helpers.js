const bcrypt = require('bcryptjs');
const helpers = {};

helpers.encryptPassword = async (password) =>{
    const salt = await bcrypt.genSalt(10);
    const passEncryp = await bcrypt.hash(password, salt);
    return passEncryp;
};

helpers.matchPassword = async (password, savePass) =>{
    try {
        return await bcrypt.compare(password, savePass);
    } catch (error) {
        console.error("Error=>", error);
    }
};


module.exports = helpers;