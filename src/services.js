const tf = require("@tensorflow/tfjs-node");
const { Firestore } = require("@google-cloud/firestore");
const { InputError } = require("./utils");

async function predictClassification(model, image) {
  try {
    const tensor = tf.node.decodeJpeg(image).resizeNearestNeighbor([224, 224]).expandDims().toFloat();

    const prediction = model.predict(tensor);
    const scores = await prediction.data();
    const confidenceScore = Math.max(...scores) * 100;

    const label = confidenceScore <= 50 ? "Non-cancer" : "Cancer";
    const suggestion = label === "Cancer" ? "Segera periksa ke dokter!" : "Anda sehat!";
    return { label, suggestion };
  } catch (error) {
    throw new InputError("Terjadi kesalahan dalam melakukan prediksi");
  }
}

async function loadModel() {
  return tf.loadGraphModel(process.env.MODEL_URL);
}

async function storeData(id, data) {
  const db = new Firestore();
  const predictCollection = db.collection("predictions");
  return predictCollection.doc(id).set(data);
}

async function getAllData() {
  const db = new Firestore();
  const predictCollection = db.collection("predictions");
  const allData = await predictCollection.get();
  return allData.docs;
}

module.exports = { predictClassification, loadModel, storeData, getAllData };
