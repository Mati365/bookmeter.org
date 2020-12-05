import * as R from 'ramda';

type PromiseMapperFn = (val: any, key: string) => Promise<any>;

const valuesToPromisesList = (mapperFn: PromiseMapperFn) => R.compose(
  R.map(
    ([key, val]) => {
      let promise = mapperFn(val, key);
      if (!R.is(Promise, promise))
        promise = Promise.resolve(val || null);

      return promise.then((result) => ([key, result]));
    },
  ),
  R.toPairs,
);

const nonNullPairsToObj = R.compose(
  R.fromPairs,
  R.reject(
    (array) => R.isNil(array[1]),
  ), // remove nil values
);

/**
 * @param {Function}  mapperFn  Function that maps obj value to promise
 * @param {Object}    obj
 *
 * @example
 * {
 *  a: 'a',
 *  b: 'b',
 * }
 * transforms to:
 * {
 *  a: Promise() // with a
 *  b: Promise() // with b
 * }
 * and when object is returned when all promises are done
 */
export const mapObjValuesToPromise = R.curry(
  (mapperFn: PromiseMapperFn, obj: object): Promise<object> => {
    const promises = valuesToPromisesList(mapperFn)(obj);

    return Promise
      .all(promises)
      .then(nonNullPairsToObj);
  },
);
