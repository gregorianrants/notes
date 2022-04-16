const mongoose = require("mongoose");

function printError(err) {
  const processed = JSON.parse(JSON.stringify(err));
  console.log(processed);
}

const schema = mongoose.Schema({
  first: {
    type: Number,
    validate: [(v) => v > 11, "must be greater than 11"],
  },
  second: Number,
});

schema.pre("validate", () => {
  console.log("hello");
});

const doc = new mongoose.Document(
  {
    first: 10,
    second: 1,
  },
  schema
);

function isBefore(doc) {
  //if (doc.first > doc.second) {
  doc.invalidate("first", "first must be before second");
  //}
}

const err = doc.validateSync();

isBefore(doc);

for (let [key, value] of Object.entries(err.errors)) {
  //console.log(key, value);
  doc.invalidate(key, value.message);
}

printError(doc.validateSync());
