const { predictClassification, storeData, getAllData } = require("./services");
const crypto = require("crypto");

async function postPredictHandler(request, h) {
  const { image } = request.payload;
  const { model } = request.server.app;

  const { label, suggestion } = await predictClassification(model, image);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const data = { id, result: label, suggestion, createdAt };

  await storeData(id, data);

  return h
    .response({
      status: "success",
      message: "Model is predicted successfully",
      data,
    })
    .code(201);
}

async function postPredictHistoriesHandler(request, h) {
  const allData = await getAllData();
  const formattedData = allData.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      history: {
        result: data.result,
        createdAt: data.createdAt,
        suggestion: data.suggestion,
        id: doc.id,
      },
    };
  });

  return h
    .response({
      status: "success",
      data: formattedData,
    })
    .code(200);
}

module.exports = { postPredictHandler, postPredictHistoriesHandler };
