# express-bifrost
Decouples the HTTP world (Express middleware) from the rest of your code so that HTTP concerns don't leak between them. 

![Thor wades while the æsir ride by Frølich](https://cloud.githubusercontent.com/assets/50832/21269637/76d0ce1c-c381-11e6-901b-3ea18580322c.jpg)

As analogies that are pushed too far for the sake of a catchy name go:

> [Bifröst](https://en.wikipedia.org/wiki/Bifr%C3%B6st) is a burning rainbow bridge that reaches between Midgard (Earth) and Asgard, the realm of the gods.

## Usage

Install from npm: `npm install express-bifrost` or `yarn add express-bifrost`

Include in your code:

```js
const bifrost = require('express-bifrost');
```

or

```js
import bifrost from 'express-bifrost';
```

Where you would typically pass the Request and Response objects of Express directly down to a controller, use express-bifrost as a bridge between the HTTP Request/Response objects and an HTTP-agnostic controller.

Before:

```js
// Controller directly knows about HTTP Request/Response
function readHorse(req, res, next) {
  const horseId = req.params.horseId;
  
  Horse
    .findById(horseId)
    .then(horse => {
      if (horse) {
        res.json(horse)
      } else {
        res.status(404).send('Horse not found');
      }
    })
    .catch(next);
}

app.get('/horses/:horseId', readHorse);
```

After:

```js
// Controller is HTTP-agnostic -- just returns a Promise
function readHorse(horseId) {  
  return Horse
    .findById(horseId)
    .then(horse => {
      if (horse) {
        return horse;
      } else {
        throw new Error('Horse not found');
      }
    });
}

app.get('/horses/:horseId', bifrost(req => {
  // Collect everything we need from the Request
  const horseId = req.params.horseId;
  
  // Pass on to non-HTTP land
  return readHorse(horseId);
});

// Or, super-compact version:
app.get('/horses/:horseId', bifrost(req => readHorse(req.params.horseId));
```

By default, express-bifrost sends the promise resolution value as the response using `.send()`, which will automatically send objects as JSON. Also, promise rejection values (errors) are passed down to other middleware through `next()`. When you need finer-grain control over how responses are sent, and how errors are handled, you can use the extended syntax and pass express-bifrost an object with `req`, `res` and `err` properties, which are all optional:

```js
app.get('/horses/:horseId', bifrost({
  req: req => readHorse(req.params.horseId),
  res: (res, data) => {
    // Wrap the response returned from the request handler inside an envelope
    res.json({
      meta: { horseId },
      data
    });
  },
  err: (res, next, error) => {
    if (/not found/i.test(error.message)) { // Note: Hacky! Just OK for the sake of this example.
      // Be nice and return a 404
      res.status(404).send(error.message);
    } else {
      // Pass down to other middleware / default error handling
      next(error);
    }
  }
});
```

## API

Actually, the entire implementation of express-bifrost is so tiny, you might be better of just reading [the source](index.js).


## Credits

Inspired by [fxrm-action](https://github.com/fxrm/fxrm-action), written by [Nick Matantsev](https://github.com/unframework).
