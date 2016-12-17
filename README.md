# express-bifrost
Decouples the HTTP world (Express middleware) from the rest of your code so that HTTP concerns don't leak between them. Actually, express-bifrost doesn't do the decoupling itself, but provides a pattern to encourage you to do it.

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

Where you would typically pass the Request and Response objects of Express directly down to a controller, use express-bifrost as a bridge between the HTTP Request/Response objects and an HTTP-agnostic controller. express-bifrost acts as a factory for Express middleware.

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

_Actually, the implementation of express-bifrost is so tiny, you might be better off just reading [the entire source](index.js)._

### Options

express-bifrost takes a single argument which is either an Object or a Function. The Function flavour acts as a shorthand for the Object flavour with just the `req` property. The following two forms are functionally identical:

```js
bifrost(req => fetchMySword(req.params.urgency))

bifrost({
  req: req => fetchMySword(req.params.urgency)
})
```

The Object flavour expects the following properties:

#### req

_Function_, _optional_. The request handler. This should be a function that takes an [Express Request](http://expressjs.com/en/api.html#req) object instance. Its purpose should be to grab whatever is needed from the request object and pass it down to controller/service layers in your application. The function may return a Promise. It may also return a value to be returned in the response or throw an exception to trigger error handling.

Examples:

```js
bifrost({
  req: req => {
    return authenticate(req.body.username, req.body.password); // returns a Promise
  }
})

bifrost({
  req: req => {
    if (isAuthenticated(req.body.username, req.body.password)) { // returns a Boolean
      return 'Yay!';
    } else {
      throw new Error('Nay!');
    }
  }
})
```

#### res

_Function_, _optional_. The response handler. This should be a function that takes an [Express Response](http://expressjs.com/en/api.html#res) object and the data returned from the request handler (`undefined` if no response handler was provided). The function takes over express-bifrost's default response handling of sending whatever was returned by the request handler via the Response object's `.send()` method.

Example:

```js
bifrost({
  req: req => collateDashboardData(),
  res: (res, data) => res.render('dashboard', data)
})
```

#### err

_Function_, _optional_. The error handler. This should be a function that takes an Express Response object, the Express `next` callback handler, and an error value. The function takes over express-bifrost's default error handling of passing the error value down to the Express `next` callback. You can use this to apply custom error handling depending on the error value and respond with the appropriate HTTP response codes.

Example:

```js
bifrost({
  err: (res, next, error) => {
    if (error instanceof AuthorizationError) {
      res.status(403).end();
    } else if (error instanceof ResourceNotFoundError) {
      res.status(404).end();
    } else {
      next(error);
    }
  }
})
```

### Defaults

The `defaults` property of express-bifrost holds default values for the options above. All default options are set to `null` by default. Override any of these properties to have global handlers that are applied across all express-bifrost middleware instances.

## License

MIT

## Credits

Inspired by [fxrm-action](https://github.com/fxrm/fxrm-action), written by [Nick Matantsev](https://github.com/unframework).
