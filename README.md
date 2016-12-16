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

Where you would typically pass the Request and Response objects of Express directly down to a controller, use bifrost as a bridge between the HTTP Request/Response objects and an HTTP-agnostic controller.

Before:

```js
// Controller directly knows about Request/Response
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
  Horse
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
