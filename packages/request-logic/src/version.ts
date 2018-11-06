import * as Semver from 'semver';
import { specificationVersion as specificationVersionDefault } from './config.json';
import * as RequestEnum from './enum';
import Identity from './identity';
import * as Types from './types';

/**
 * Function to manage Request versions specification supported by this implementation
 */
export default {
  currentVersion: specificationVersionDefault.current,
  isSupported,
};

/*
 * Function to check if a version of request is supported by this library
 *
 * version is not supported if higher than the current one
 * version is not supported if the major is different
 * version is not supported if the version is in the expections array define in config.json
 *
 * @param string version the version to check
 * @param IRequestLogicVersionSupportConfig versionConfiguration override the default configuration only for this check
 *
 * @returns boolean true, if version is supported false otherwise
 */
function isSupported(
  version: string,
  versionConfiguration?: Types.IRequestLogicVersionSupportConfig,
): boolean {
  versionConfiguration = versionConfiguration || specificationVersionDefault;

  return (
    !!Semver.valid(version) &&
    Semver.diff(version, versionConfiguration.current) !== 'major' &&
    Semver.lte(version, versionConfiguration.current) &&
    versionConfiguration.exceptions.indexOf(version) === -1
  );
}
