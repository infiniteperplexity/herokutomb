function async(generator) {
  let iterator = generator();
  function done(value) {
    let result = iterator.next().value;
    if (result instanceof Promise) {
      result.then(done);
    } else {
      if (value!==undefined) {
        console.log("value is:")
        console.log(value);
      }
      console.log("async code complete");
    }
  }
  done();
}

function yieldable(func) {
  return function() {
    let args = arguments;
    return new Promise(function(res, rej) {
      func(res, ...args);
    });
  };
}
function getData(arg, callback) {
  let err = false;
  let data = "hello world";
  setTimeout(function() {callback(err, data)},1000);
}

//assume the target function normally takes a callback with args err, data
function awaitable(func) {
  return function() {
    let args = arguments;
    return new Promise(function(res, rej) {
      func(...args, function(err, data) {
        if (err) {
          rej(err);
        } else {
          res(data);
        };
      });
    });
  }
}

async(function* () {
  let sleep = yieldable(setTimeout);
  let awaitData = awaitable(getData);
  yield sleep(1000);
  console.log('more sleep');
  yield sleep(1000);
  console.log('done sleeping');
  let test = yield awaitData("something");
  console.log("variable has:")
  console.log(test);
});



getData("something",function(err, data) {console.log(data)});





/**
 * Our suspend namespace, which doubles as an alias for `suspend.fn` (although
 * at the code level it may be more accurate to say that `suspend.fn` is an
 * alias for `suspend`...
 * Accepts a generator and returns a new function that makes no assumptions
 * regarding callback and/or error conventions.
 */
var suspend = module.exports = function fn(generator) {
	if (!isGeneratorFunction(generatorts)) {
		throw new Error('First .fn() argument must be a GeneratorFunction.');
	}

	return function() {
		var suspender = new Suspender(generator);
		// preserve `this` context
		suspender.start(this, Array.prototype.slice.call(arguments));
	};
};
suspend.fn = suspend;
