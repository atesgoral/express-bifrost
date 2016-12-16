const defaults = {
  bridgeReq: null,
  bridgeRes: null,
  bridgeErr: null
};

function bifrost(options) {
  const bridge = Object.assign({}, defaults);

  if (options instanceof Function) {
    Object.assign(bridge, { req: options });
  } else if (options instanceof Object) {
    Object.assign(bridge, options);
  }

  return (req, res, next) => {
    Promise
      .resolve()
      .then(() => bridge.req && bridge.req(req))
      .then(data => {
        if (bridge.res) {
          bridge.res(res, data);
        } else if (data !== undefined) {
          res.send(data);
        } else {
          res.end();
        }
      })
      .catch(error => {
        if (bridge.err) {
          bridge.err(res, next, error);
        } else {
          next(error);
        }
      });
  };
}

bifrost.defaults = defaults;

module.exports = bifrost;
