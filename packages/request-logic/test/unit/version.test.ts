import { expect } from 'chai';

import Config from '../../src/config';
import Version from '../../src/version';

/* tslint:disable:no-unused-expression */
describe('version', () => {
  it('can isSupported() on supported version', () => {
    const configVersionTest = { current: '1.2.3', exceptions: ['1.2.1'] };

    expect(Version.isSupported('1.2.3', configVersionTest), 'current version must be supported').to
      .be.true;
    expect(Version.isSupported('1.2.0', configVersionTest), 'older version must be supported').to.be
      .true;
    expect(Version.isSupported('1.0.1', configVersionTest), 'older version must be supported').to.be
      .true;
  });

  it('cannot isSupported() on not supported version', () => {
    const configVersionTest = { current: '1.2.3', exceptions: ['1.2.1'] };

    expect(
      Version.isSupported('2.2.3', configVersionTest),
      'major diff version must be not supported',
    ).to.be.false;
    expect(
      Version.isSupported('0.2.0', configVersionTest),
      'major diff version must be not supported',
    ).to.be.false;
    expect(Version.isSupported('1.2.4', configVersionTest), 'newer version must be not supported')
      .to.be.false;
    expect(
      Version.isSupported('1.2.1', configVersionTest),
      'exception version must be not supported',
    ).to.be.false;
  });

  it('can isSupported() with default version', () => {
    expect(Version.isSupported(Version.currentVersion), 'current version must be supported').to.be
      .true;
    // test if possible that a default expection is not supported
    if (Config.specificationVersion.exceptions[0]) {
      expect(
        Version.isSupported(Config.specificationVersion.exceptions[0]),
        'exception version must be not supported',
      ).to.be.false;
    }
  });
});
