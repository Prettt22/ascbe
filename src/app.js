require("dotenv").config();
const Hapi = require("@hapi/hapi");
const { postPredictHandler, postPredictHistoriesHandler } = require("./handlers");
const { loadModel } = require("./services");
const { InputError } = require("./utils");

(async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: "0.0.0.0",
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  const model = await loadModel();
  server.app.model = model;

  server.route([
    {
      method: "POST",
      path: "/predict",
      handler: postPredictHandler,
      options: {
        payload: {
          allow: "multipart/form-data",
          multipart: true,
          maxBytes: 1000000,
        },
      },
    },
    {
      method: "GET",
      path: "/predict/histories",
      handler: postPredictHistoriesHandler,
    },
  ]);

  server.ext("onPreResponse", (request, h) => {
    const response = request.response;

    if (response instanceof InputError) {
      return h
        .response({
          status: "fail",
          message: response.message,
        })
        .code(response.statusCode);
    }

    if (response.isBoom) {
      return h
        .response({
          status: "fail",
          message: response.message,
        })
        .code(response.output.statusCode);
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server started at: ${server.info.uri}`);
})();
