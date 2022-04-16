# Validation

## saving documents

consider

```js
const schema = new mongoose.Schema({
    name: String,
    age: Number,
    occupation:String, enum: ['man','man with van'],
  });

  const Person = mongoose.model("Person", schema);

  let gregor = new Person({
    name: "gregor",
    age: 44,
    occupation: "man",
  });

  gregor.save();

  gregor = await Person.findOne({ name: "gregor" });

  console.log(gregor);

  gregor['age']=45

  gregor.save()
```

## tracking changes  

mongoose tracks changes save will only update the field that has changed on the doc

validators will only run for the field that was changed. (we will look bellow at ways to overcome this)

## save vs queries

from the docs  https://mongoosejs.com/docs/documents.html#updating-using-queries

 The save() function is generally the right way to update a document with Mongoose. With save(), you get full validation and middleware.
 
 For cases when save() isn't flexible enough, Mongoose lets you create your own MongoDB updates with casting, middleware, and limited validation.

 ```js

// Update all documents in the `mymodels` collection
await MyModel.updateMany({}, { $set: { name: 'foo' } });
```
Note that update(), updateMany(), findOneAndUpdate(), etc. do not execute save() middleware. If you need save middleware and full validation, first query for the document and then save() it.
 
  





