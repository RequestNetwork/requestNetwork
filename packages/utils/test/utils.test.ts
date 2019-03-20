import { expect } from 'chai';
import 'mocha';

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
      attribut3: [{ x: 10, y: 2, z: 3 }, { a: 3, b: 2, c: 1 }],
    };

    /* tslint:disable:object-literal-sort-keys */
    const arbitraryObjectNotSorted = {
      attribut1: 'valeurC',
      attribut3: [{ z: 3, y: 2, x: 10 }, { c: 1, a: 3, b: 2 }],
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
    expect(
      JSON.stringify(Utils.deepSort(arbitraryObjectNotSorted)),
      'deepSort(arbitraryObject) error',
    ).to.be.equal(JSON.stringify(arbitraryObjectSorted));
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
    expect(arbitraryObjectDeepCopy, 'deepCopy(arbitraryObject) error').to.be.deep.equal(
      arbitraryObject,
    );
    arbitraryObjectDeepCopy.attribut1 = 'new value';
    expect(arbitraryObjectDeepCopy, 'deepCopy(arbitraryObject) error').to.not.be.deep.equal(
      arbitraryObject,
    );

    // witness reference copy
    const arbitraryObjectRefCopy = arbitraryObject;
    arbitraryObjectRefCopy.attribut1 = 'new value 2';
    expect(arbitraryObjectRefCopy, 'deepCopy(arbitraryObject) error').to.be.deep.equal(
      arbitraryObject,
    );
  });

  it('can return true if variable is String or string', () => {
    expect(Utils.isString('this is a string'), 'istring("") error').to.be.true;
    expect(Utils.isString(String('this is a string')), 'istring("") error').to.be.true;
  });

  it('cannot return true if variable is not a string', () => {
    /* tslint:disable:no-magic-numbers */
    expect(Utils.isString(1234), 'istring("") error').to.be.false;
    expect(Utils.isString({ var: 'plop' }), 'istring("") error').to.be.false;
  });

  it('getCurrentTimestampInSecond()', () => {
    const time = Math.floor(Date.now() / 1000);
    expect(Utils.getCurrentTimestampInSecond(), 'getCurrentTimestampInSecond() error').to.be.equal(
      time,
    );
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
      expect(Utils.unique(arbitraryArray), 'unique(arbitraryArray) error').to.deep.equal({
        uniqueItems: [{ att1: 'value1', att2: 'value2' }, { att3: 'value3', att4: 'value4' }],
        duplicates: [{ att1: 'value1', att2: 'Value2' }, { att1: 'value1', att2: 'value2' }],
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
      expect(Utils.unique(arbitraryArray), 'unique(arbitraryArray) error').to.deep.equal({
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
      expect(Utils.unique(arbitraryArray), 'unique(arbitraryArray) error').to.deep.equal({
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
      expect(
        Utils.uniqueByProperty(arbitraryArray, 'att1'),
        'uniqueByProperty(arbitraryArray) error',
      ).to.deep.equal({
        uniqueItems: [{ att1: 'value1', att2: 'value2' }, { att1: 'value3', att4: 'value4' }],
        duplicates: [{ att1: 'Value1', att2: 'value2' }, { att1: 'value1', att2: 'value2' }],
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
      expect(
        Utils.uniqueByProperty(arbitraryArray, 'att1'),
        'unique(arbitraryArray) error',
      ).to.deep.equal({
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
      expect(flattenArray, 'flatten2DimensionsArray(twoDimensionsArray) error').to.be.deep.equal([
        1,
        2,
        3,
        4,
        5,
      ]);
    });

    it('can flatten2DimensionsArray() 3 dimensions array', () => {
      const arbitraryArray: any[] = [[1, 2], [3], [4, [5, 6]]];
      const flattenArray = Utils.flatten2DimensionsArray(arbitraryArray);
      expect(flattenArray, 'flatten2DimensionsArray(twoDimensionsArray) error').to.be.deep.equal([
        1,
        2,
        3,
        4,
        [5, 6],
      ]);
    });

    it('can flatten2DimensionsArray() empty array', () => {
      const emptyArray: any[] = [];
      const flattenArray = Utils.flatten2DimensionsArray(emptyArray);
      expect(flattenArray, 'flatten2DimensionsArray(twoDimensionsArray) error').to.be.deep.equal(
        [],
      );
    });

    it('can flatten2DimensionsArray() two dimensionals array', () => {
      const twoDimensionsArray = [[1, 2], [3], [4, 5]];
      const flattenArray = Utils.flatten2DimensionsArray(twoDimensionsArray);
      expect(flattenArray, 'flatten2DimensionsArray(twoDimensionsArray) error').to.be.deep.equal([
        1,
        2,
        3,
        4,
        5,
      ]);
    });
  });
});
