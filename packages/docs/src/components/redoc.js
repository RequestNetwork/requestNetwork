// This component is a hack for Redoc to work with Gatsby
// We import the missing dependencies for redoc directly on this file
import { RedocStandalone } from 'redoc';
import mobx from 'mobx';
import styled from 'styled-components';
import * as promise from 'core-js/es/promise';

export default RedocStandalone;
