# types of validation errors

mongoose validation errors have an errors property which points to an object which has the paths of the errors as properties which have the errors as there values.

like so

```js
function createMixedError() {
  const schema = new mongoose.Schema({
    name: {
      type: String,
      validate: {
        validator: function (v) {
          return v.length > 5;
        },
        message: "length should be greater than 3",
      },
    },
    height: {
      type: Number,
    },
  });

  const doc = new mongoose.Document(
    {
      name: "hel",
      height: "five",
    },
    schema
  );

  const error = doc.validateSync();

  return error;
}
```

produces the following error object

```js
{
  errors: {
    height: {
      stringValue: '"five"',
      valueType: 'string',
      kind: 'Number',
      value: 'five',
      path: 'height',
      reason: [Object],
      name: 'CastError',
      message: 'Cast to Number failed for value "five" (type string) at path "height"'
    },
    name: {
      name: 'ValidatorError',
      message: 'length should be greater than 3',
      properties: [Object],
      kind: 'user defined',
      path: 'name',
      value: 'hel'
    }
  },
  _message: 'Validation failed',
  name: 'ValidationError',
  message: 'Validation failed: height: Cast to Number failed for value "five" (type string) at path "height", name: length should be greater than 3'
}
```

note that we have 2 distinct types of error that cause validation to fail
if we look at the name property of the errors pointed to by the top level errors property we have the folowing:

1. "ValidatorError"
2. "CastError"

the top level also has a name property and it is a "ValidationErr**or**" not to be confused with "Validati**on**Error"

# Nested Objects vs Nested Schema

objects can be nested in schema in one of 2 ways

1. by putting a nested object in the schema
2. by putting a nested schema in the schema

## nested Object

```js
function createNestedSchemaError() {
  const nameSchema = new mongoose.Schema(
    {
      first: {
        type: String,
        enum: {
          values: ["jim", "tim"],
          message: "{VALUE} is not supported",
        },
      },
      last: {
        type: String,
        enum: {
          values: ["jones", "mcboatface"],
          message: "{VALUE} is not supported",
        },
      },
    },
  );
```

# nested schema

```js
function createNestedSchemaError() {
  const nameSchema = new mongoose.Schema({
    first: {
      type: String,
      enum: {
        values: ["jim", "tim"],
        message: "{VALUE} is not supported",
      },
    },
    last: {
      type: String,
      enum: {
        values: ["jones", "mcboatface"],
        message: "{VALUE} is not supported",
      },
    },
  });

  const schema = new mongoose.Schema({
    name: nameSchema,
  });

  const doc = new mongoose.Document(
    {
      name: {
        first: "gregor",
        last: "mcboatface",
      },
    },
    schema
  );

  return doc.validateSync();
}
```

# REPEATED ERRORS GOTCHA

acording to mongoose docs When we use a nested schema as opposed to object the error message is repeated.

i have found that sometimes i get the repeated erro but:

**I DONT ALLWAYS GET THIS REPEATED ERROR WITH NESTED SCHEMA DONT KNOW WHY**

Like so

```js

{
  "errors": {
    "charges.hourlyRate": {
      "stringValue": "\"g\"",
      "valueType": "string",
      "kind": "Number",
      "value": "g",
      "path": "hourlyRate",
      "reason": {
        "name": "AssertionError",
        "actual": false,
        "expected": true,
        "operator": "==",
        "message": "false == true",
        "generatedMessage": true
      },
      "name": "CastError",
      "message": "Cast to Number failed for value \"g\" (type string) at path \"hourlyRate\""
    },
    "charges": {
      "errors": {
        "hourlyRate": {
          "stringValue": "\"g\"",
          "valueType": "string",
          "kind": "Number",
          "value": "g",
          "path": "hourlyRate",
          "reason": {
            "name": "AssertionError",
            "actual": false,
            "expected": true,
            "operator": "==",
            "message": "false == true",
            "generatedMessage": true
          },
          "name": "CastError",
          "message": "Cast to Number failed for value \"g\" (type string) at path \"hourlyRate\""
        }
      },
      "_message": "Validation failed",
      "name": "ValidationError",
      "message": "Validation failed: hourlyRate: Cast to Number failed for value \"g\" (type string) at path \"hourlyRate\""
    }
  },
  "_message": "Validation failed",
  "name": "ValidationError",
  "message": "Validation failed: charges.hourlyRate: Cast to Number failed for value \"g\" (type string) at path \"hourlyRate\", charges: Validation failed: hourlyRate: Cast to Number failed for value \"g\" (type string) at path \"hourlyRate\""
}

```

it give the same error first pointed to

by full path "charges.hourlyRate" hereafter called full path error then as an errors object for on "charges property"
by specifying a nested errors object for charges propert hereafter called nested error path
however if we set the charges property to be an object as opposed to a schema

we only get the dot path error

acording to mongoose docs:
https://mongoosejs.com/docs/guide.html#storeSubdocValidationError

option: storeSubdocValidationError
For legacy reasons, when there is a validation error in subpath of a single nested schema, Mongoose will record that there was a validation error in the single nested schema path as well. For example:

```js
const childSchema = new Schema({ name: { type: String, required: true } });
const parentSchema = new Schema({ child: childSchema });

const Parent = mongoose.model("Parent", parentSchema);

// Will contain an error for both 'child.name' _and_ 'child'
new Parent({ child: {} }).validateSync().errors;
```

Set the storeSubdocValidationError to false on the child schema to make Mongoose only reports the parent error.

```js
const childSchema = new Schema(
  {
    name: { type: String, required: true },
  },
  { storeSubdocValidationError: false }
); // <-- set on the child schema
const parentSchema = new Schema({ child: childSchema });

const Parent = mongoose.model("Parent", parentSchema);

// Will only contain an error for 'child.name'
new Parent({ child: {} }).validateSync().errors;
```

## AVOID REPEATED ERRORS GOTCHA

either use nested object in schema or set `storeSubdocValidationError: false`
on schema options of child schema

```js
const childSchema = new Schema({}, { storeSubdocValidationError: false });
```

# Errors for values of type array

e.g:

```js
function createArrayError() {
  const nameSchema = new mongoose.Schema({
    first: {
      type: String,
      validate: {
        validator: function (v) {
          return v.length > 5;
        },
        message: "must be longer than 2",
      },
    },
    last: String,
  });

  const schema = new mongoose.Schema({
    aList: [nameSchema],
  });

  const doc = new mongoose.Document(
    {
      aList: [
        {
          first: "gr",
          last: "murray",
        },
      ],
    },
    schema
  );

  const error = doc.validateSync();

  return error;
}
```

gives us

```js
{
  errors: {
    'aList.0.first': {
      name: 'ValidatorError',
      message: 'must be longer than 2',
      properties: [Object],
      kind: 'user defined',
      path: 'first',
      value: 'gr'
    }
  },
  _message: 'Validation failed',
  name: 'ValidationError',
  message: 'Validation failed: aList.0.first: must be longer than 2'
}
```

it is simple to change 'aList.0.first' into a path that can be used by lodash get and set methods e.g. 'aList.[0].first'

# Array error path and browser import gotcha

i was recieving errors for

```js
const jobSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: cuid,
  },
  operatives: [operativeSchema],
  items: String,
  addresses: [addressObj],
});
```

like so

```js
{
  "errors": {
    "operatives": {
      "errors": {
        "value": {
          "name": "ValidatorError",
          "message": "operative must have more than 3 characters",
          "properties": {
            "message": "operative must have more than 3 characters",
            "type": "user defined",
            "path": "value",
            "value": "cb"
          },
          "kind": "user defined",
          "path": "value",
          "value": "cb"
        }
      },
      "_message": "Validation failed",
      "name": "ValidationError",
      "message": "Validation failed: value: operative must have more than 3 characters"
    },

  "_message": "Validation failed",
  "name": "ValidationError",
  "message": "Validation failed: operatives: Validation failed: value: operative must have more than 3 characters, addresses: Validation failed: value: name must have more than 4 characters"
}

```

this sent me down a long and winding road coding functions to proccess this, getting the error like this was a bug turned.

** i think i recieved the error like this because of the way i improted on the client side **

i did

```js
import mongoose from "mongoose/browser";
```

the docs actually says to import like above if importing to node js

should have done

```js
import mongoose from "mongoose";
```

# validation which depends on a secondary path

## problems

Valeri karpov book mastering mongoose, has a chapter on page 135 called, validation vs middleware.

Below is a sample profileSchema that demonstrates the issue. How do you make it so that
photos must have length 2 if status is PUBLISHED?

```js
const profileSchema = Schema({
  photos: [String],
  status: { type: String, enum: ["PENDING", "PUBLISHED"] },
});
```

using a custom validator

```js
const profileSchema = Schema({
  photos: {
    type: [String],
    validate: function (v) {
      return this.status !== "PUBLISHED" || (v && v.length > 1);
    },
  },
  status: { type: String, enum: ["PENDING", "PUBLISHED"] },
});
```

or a pre('save') hook

```js
profileSchema.pre("save", function () {
  if (this.status === "PUBLISHED" && this.photos.length < 2) {
    throw Error("Published profile must have at least 2 photos");
  }
});
```

he states that
When you call save(), 

"Mongoose only validates modified paths. There is one exception: the
required validator. For example, suppose your profileSchema also has a publishedAt
property that should be required if the profile is published.

In general, you should avoid custom validators that rely
on multiple paths. Usually, if you can do something with custom validators, it is also easy to do
with a pre hook. If you need complex validation that depends on multiple ¦elds, better to use
middleware than custom validators."

this is a problem as we cant use hooks on the browser

## possible solutions

### call validate directly on doc on both cliend and server

on client we generally validate by creating a new doc and then validating it directly rather than relying on save to call validate,

when modifying a db record we generally pull all fields from db into form then modify some of them. we then send this data to server and mongoose updates the forms that have changed. 

prior to saving we could create a new doc on server and validate it directly as it is a new doc all fields will have changed.

### problem

thinking about the api seperate from a client we can send data with just a couple of the fields, we may not be sending all the data. would need to get data from db merge with new data to create an object then valdiate this object. does not smell good.

## force validation on all paths Gotcha

I thought there was a way to set an option to force valdiation to use all fields, there is the following option.
on a document

[options.validateModifiedOnly=false] «Boolean» if true mongoose validates only modified paths.
https://mongoosejs.com/docs/api/document.html#document_Document-validate

it can also be found for document.save()

[options.validateModifiedOnly=false] «Boolean» If true, Mongoose will only validate modified paths, as opposed to modified paths and required paths.

note that it says **as opposed to modified paths and required paths.**

it is not saying that false will cause validation of all paths.


### simple validation on client complex on server

could just do simple validation on the client and if there is complex validation just rely on error message sent back from api to inform user.

we could still do some simple validation that depends on other fields by defining it on more than one field

e.g for start and end properties for an event we could do

```js

const eventSchema =({
  start: [(v)=>v < this.end, 'start must be before end']
  end: [(v)=>v > this.start, 'end must be after start']
})

```

maybe we dont want more than 2 error messages?

### more complex validation on server

in order to do this we need different types of error message on form

client validation messages

and server validation messages

there are a number of permutations of how to achieve this,
2 types of message for each field
server messages are at form leve rather than field.
etc etc etc .......

need to give this some thought to figure out best way

would be worth working through.

### run the function that is being used for complext server validation on the browser as well  

consider

```js
Schema.pre("validate", function (next) {
  if (this.startDate > this.endDate) {
    this.invalidate(
      "startDate",
      "Start date must be less than end date.",
      this.startDate
    );
  }

  next();
});
```

on a react app, if we are updating a record on db, we will generally have pulled the data on db into a form so say we have a form with fields

startDate\
endDate\
description

we pull the data

startDate: **mon**\
endDate: tues\
descripion: an event

we change the start data

startDate: **wed**\
endDate: tues\
descripion: an event

we can still **kind of** validate against the data on the server by using what we have pulled into the form and the data that we have changed

looking at is 

startDate < endDate

utlimately though an api is not allways used by a react app and someone could still just send a new start date to the api, 

so the valdiation still needs to run on the api for safety, but thats fine the hook will catch this


