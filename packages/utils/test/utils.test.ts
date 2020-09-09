/* eslint-disable spellcheck/spell-checker */
import Utils from '../src/utils';

/* tslint:disable:no-unused-expression */
describe('Utils', () => {
  it('can deepSort() nested objects', () => {
    const arbitraryObjectSorted = {
      attribut1: 'valeurC',
      attribut2: {
        attributa: {
          i: 'valeur',
          j: 'valeur',
          k: 'valeur',
        },
        attributb: 'valeurB',
      },
      attribut3: [
        { x: 10, y: 2, z: 3 },
        { a: 3, b: 2, c: 1 },
      ],
    };

    /* tslint:disable:object-literal-sort-keys */
    const arbitraryObjectNotSorted = {
      attribut1: 'valeurC',
      attribut3: [
        { z: 3, y: 2, x: 10 },
        { c: 1, a: 3, b: 2 },
      ],
      attribut2: {
        attributb: 'valeurB',
        attributa: {
          j: 'valeur',
          i: 'valeur',
          k: 'valeur',
        },
      },
    };
    /* tslint:enable:object-literal-sort-keys */
    // 'deepSort(arbitraryObject) error'
    expect(JSON.stringify(Utils.deepSort(arbitraryObjectNotSorted))).toBe(
      JSON.stringify(arbitraryObjectSorted),
    );
  });

  it('can deepCopy() nested objects', () => {
    const arbitraryObject = {
      attribut1: 'valeurC',
      attribut2: {
        attributa: {
          i: 'valeur',
          j: 'valeur',
          k: 'valeur',
        },
        attributb: 'valeurB',
      },
      attribut3: 'valeurA',
    };
    const arbitraryObjectDeepCopy = Utils.deepCopy(arbitraryObject);
    // 'deepCopy(arbitraryObject) error'
    expect(arbitraryObjectDeepCopy).toEqual(arbitraryObject);
    arbitraryObjectDeepCopy.attribut1 = 'new value';
    // 'deepCopy(arbitraryObject) error'
    expect(arbitraryObjectDeepCopy).not.toEqual(arbitraryObject);

    // witness reference copy
    const arbitraryObjectRefCopy = arbitraryObject;
    arbitraryObjectRefCopy.attribut1 = 'new value 2';
    // 'deepCopy(arbitraryObject) error'
    expect(arbitraryObjectRefCopy).toEqual(arbitraryObject);
  });

  it('can return true if variable is String or string', () => {
    // 'istring("") error'
    expect(Utils.isString('this is a string')).toBe(true);
    // 'istring("") error'
    expect(Utils.isString(String('this is a string'))).toBe(true);
  });

  it('cannot return true if variable is not a string', () => {
    /* tslint:disable:no-magic-numbers */
    // 'istring("") error'
    expect(Utils.isString(1234)).toBe(false);
    // 'istring("") error'
    expect(Utils.isString({ var: 'plop' })).toBe(false);
  });

  it('getCurrentTimestampInSecond()', () => {
    jest.useFakeTimers('modern');

    const time = Math.floor(Date.now() / 1000);
    // 'getCurrentTimestampInSecond() error'
    expect(Utils.getCurrentTimestampInSecond()).toBe(time);

    // Cleanup
    jest.useRealTimers();
  });

  describe('unique', () => {
    it('can unique with different case in the values', () => {
      const arbitraryArray = [
        { att1: 'value1', att2: 'value2' },
        { att1: 'value1', att2: 'Value2' },
        { att3: 'value3', att4: 'value4' },
        { att1: 'value1', att2: 'value2' },
      ];

      /* tslint:disable:object-literal-sort-keys */
      // 'unique(arbitraryArray) error'
      expect(Utils.unique(arbitraryArray)).toEqual({
        uniqueItems: [
          { att1: 'value1', att2: 'value2' },
          { att3: 'value3', att4: 'value4' },
        ],
        duplicates: [
          { att1: 'value1', att2: 'Value2' },
          { att1: 'value1', att2: 'value2' },
        ],
      });
    });

    it('can unique with different case in the key', () => {
      const arbitraryArray = [
        { att1: 'value1', att2: 'value2' },
        { att1: 'value1', Att2: 'Value2' },
        { att3: 'value3', att4: 'value4' },
        { att1: 'value1', att2: 'value2' },
      ];

      /* tslint:disable:object-literal-sort-keys */
      // 'unique(arbitraryArray) error'
      expect(Utils.unique(arbitraryArray)).toEqual({
        uniqueItems: [
          { att1: 'value1', att2: 'value2' },
          { att1: 'value1', Att2: 'Value2' },
          { att3: 'value3', att4: 'value4' },
        ],
        duplicates: [{ att1: 'value1', att2: 'value2' }],
      });
    });

    it('can unique without duplication', () => {
      const arbitraryArray = [
        { att1: 'value1', att2: 'value2' },
        { att1: 'value1', Att2: 'Value2' },
        { att3: 'value3', att4: 'value4' },
        { att5: 'value5', att6: 'value6' },
      ];

      /* tslint:disable:object-literal-sort-keys */
      // 'unique(arbitraryArray) error'
      expect(Utils.unique(arbitraryArray)).toEqual({
        uniqueItems: [
          { att1: 'value1', att2: 'value2' },
          { att1: 'value1', Att2: 'Value2' },
          { att3: 'value3', att4: 'value4' },
          { att5: 'value5', att6: 'value6' },
        ],
        duplicates: [],
      });
    });
  });

  describe('uniqueByProperty', () => {
    it('can uniqueByProperty with different case in the values', () => {
      const arbitraryArray = [
        { att1: 'value1', att2: 'value2' },
        { att1: 'Value1', att2: 'value2' },
        { att1: 'value3', att4: 'value4' },
        { att1: 'value1', att2: 'value2' },
      ];

      /* tslint:disable:object-literal-sort-keys */
      // 'uniqueByProperty(arbitraryArray) error'
      expect(Utils.uniqueByProperty(arbitraryArray, 'att1')).toEqual({
        uniqueItems: [
          { att1: 'value1', att2: 'value2' },
          { att1: 'value3', att4: 'value4' },
        ],
        duplicates: [
          { att1: 'Value1', att2: 'value2' },
          { att1: 'value1', att2: 'value2' },
        ],
      });
    });

    it('can unique without duplication', () => {
      const arbitraryArray = [
        { att1: 'value1', att2: 'value2' },
        { att1: 'value12', Att2: 'Value2' },
        { att1: 'value3', att4: 'value4' },
        { att1: 'value5', att6: 'value6' },
      ];

      /* tslint:disable:object-literal-sort-keys */
      // 'unique(arbitraryArray) error'
      expect(Utils.uniqueByProperty(arbitraryArray, 'att1')).toEqual({
        uniqueItems: [
          { att1: 'value1', att2: 'value2' },
          { att1: 'value12', Att2: 'Value2' },
          { att1: 'value3', att4: 'value4' },
          { att1: 'value5', att6: 'value6' },
        ],
        duplicates: [],
      });
    });
  });

  describe('flatten2DimensionsArray', () => {
    it('can flatten2DimensionsArray() 1 dimension array', () => {
      const arbitraryArray: any[] = [1, 2, 3, 4, 5];
      const flattenArray = Utils.flatten2DimensionsArray(arbitraryArray);
      // 'flatten2DimensionsArray(twoDimensionsArray) error'
      expect(flattenArray).toEqual([1, 2, 3, 4, 5]);
    });

    it('can flatten2DimensionsArray() 3 dimensions array', () => {
      const arbitraryArray: any[] = [[1, 2], [3], [4, [5, 6]]];
      const flattenArray = Utils.flatten2DimensionsArray(arbitraryArray);
      // 'flatten2DimensionsArray(twoDimensionsArray) error'
      expect(flattenArray).toEqual([1, 2, 3, 4, [5, 6]]);
    });

    it('can flatten2DimensionsArray() empty array', () => {
      const emptyArray: any[] = [];
      const flattenArray = Utils.flatten2DimensionsArray(emptyArray);
      // 'flatten2DimensionsArray(twoDimensionsArray) error'
      expect(flattenArray).toEqual([]);
    });

    it('can flatten2DimensionsArray() two dimensionals array', () => {
      const twoDimensionsArray = [[1, 2], [3], [4, 5]];
      const flattenArray = Utils.flatten2DimensionsArray(twoDimensionsArray);
      // 'flatten2DimensionsArray(twoDimensionsArray) error'
      expect(flattenArray).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('timeoutPromise', () => {
    beforeEach(async () => {
      jest.useFakeTimers('modern');
    });

    afterEach(async () => {
      jest.useRealTimers();
    });

    it('rejects with specified message if timeout is reached', (done) => {
      const errorMessage = 'An error occured !';
      let rejected = false;

      expect.assertions(3);

      Utils.timeoutPromise(1000, errorMessage)
        .then(() => {
          fail('timeoutPromise should not be fulfilled');
        })
        .catch((err) => {
          rejected = true;
          expect(err.message).toEqual(errorMessage);
          done();
        });

      expect(rejected).toBe(false);

      jest.advanceTimersByTime(999);

      expect(rejected).toBe(false);

      jest.advanceTimersByTime(1);
    });
  });
});
