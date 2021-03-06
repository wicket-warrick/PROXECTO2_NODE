const { getUserByActivationCode, activateUser } = require("../../db/users.js");
const { generateError } = require("../../helpers/generateError.js");

const validateUserController = async (req, res, next) => {
  try {
    const { registrationCode } = req.params;

    const user = await getUserByActivationCode(registrationCode);

    if (!user) {
      throw generateError(
        "No existe ningún usuario pendiente de activacion con ese código.",
        404
      );
    }
    await activateUser(user.id);
    res.send({
      status: "ok",
      message: "Registro finalizado.Cuenta activada.",
    });
  } catch (error) {
    next(error);
  }
};
module.exports = { validateUserController };
