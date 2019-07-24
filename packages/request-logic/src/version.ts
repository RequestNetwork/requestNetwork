import { RequestLogicTypes } from '@requestnetwork/types';
import * as Semver from 'semver';
import Config from './config';

/**
 * Function to manage Request versions specification supported by this implementation
 */
export default {
  currentVersion: Config.specificationVersion.current,
  isSupported,
};

/**
 * Function to check if a version of request is supported by this library
 *
 * version is not supported if higher than the current one
 * version is not supported if the major is different
 * version is not supported if the version is in the exceptions array defined in config.json
 *
 * @param string version the version to check
 * @param IVersionSupportConfig versionConfiguration override the default configuration only for this check
 *
 * @returns boolean true, if version is supported false otherwise
 */
function isSupported(version: string, versionConfiguration?: RequestLogicTypes.IVersionSupportConfig): boolean {
  versionConfiguration = versionConfiguration || Config.specificationVersion;

  return (
    !!Semver.valid(version) &&
    Semver.diff(version, versionConfiguration.current) !== 'major' &&
    Semver.lte(version, versionConfiguration.current) &&
    versionConfiguration.exceptions.indexOf(version) === -1
  );
}
