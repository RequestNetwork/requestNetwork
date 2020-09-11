import Config from '../../src/config';
import Version from '../../src/version';

/* tslint:disable:no-unused-expression */
describe('version', () => {
  it('can isSupported() on supported version', () => {
    const configVersionTest = { current: '1.2.3', exceptions: ['1.2.1'] };

    // 'current version must be supported'
    expect(Version.isSupported('1.2.3', configVersionTest)).toBe(true);
    // 'older version must be supported'
    expect(Version.isSupported('1.2.0', configVersionTest)).toBe(true);
    // 'older version must be supported'
    expect(Version.isSupported('1.0.1', configVersionTest)).toBe(true);
  });

  it('cannot isSupported() on not supported version', () => {
    const configVersionTest = { current: '1.2.3', exceptions: ['1.2.1'] };

    // 'major diff version must be not supported'
    expect(Version.isSupported('2.2.3', configVersionTest)).toBe(false);
    // 'major diff version must be not supported'
    expect(Version.isSupported('0.2.0', configVersionTest)).toBe(false);
    // 'newer version must be not supported'
    expect(Version.isSupported('1.2.4', configVersionTest)).toBe(false);
    // 'exception version must be not supported'
    expect(Version.isSupported('1.2.1', configVersionTest)).toBe(false);
  });

  it('can isSupported() with default version', () => {
    // 'current version must be supported'
    expect(Version.isSupported(Version.currentVersion)).toBe(true);
    // test if possible that a default expection is not supported
    if (Config.specificationVersion.exceptions[0]) {
      // 'exception version must be not supported'
      expect(Version.isSupported(Config.specificationVersion.exceptions[0])).toBe(false);
    }
  });
});
