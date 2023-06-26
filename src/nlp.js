const { NlpManager } = require('node-nlp');
const datasetPath = '../dataset/dataset.json';

const manager = new NlpManager({ languages: ['id'] });
manager.addNamedEntityText('SSID', 'id', ['ssid']);
function processMessage(message, callback) {
  (async () => {
    const response = await manager.process('id', message);
    const intent = response.intent;
    const entities = response.entities;
    callback(intent, entities);
  })();
}

const dataset = require(datasetPath);

dataset.intents.forEach(intent => {
  intent.patterns.forEach(pattern => {
    manager.addDocument('id', pattern, intent.tag);
  });
});

(async () => {
  // Train the NLP manager
  await manager.train();
  manager.save();
  console.log('Model trained and saved');
})();

module.exports = { processMessage };
module.exports.dataset = dataset;

