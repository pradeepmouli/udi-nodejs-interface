'use strict';

export function useCloud() {
  return process.env.MQTTENDPOINT && process.env.STAGE;

};
import Node from './Node.js';
import logger from './logger.js';

export { Interface } from './Interface.js';
// If we are connecting to Polyglot Cloud, use the PGC interface instead;
export  default {
  // Interface class for Polyglot
  Interface: await import('./Interface.js'),
  // Node class from which all nodes are extended from
  Node: await import('./Node.js'),

  // Logger utility for the NodeServer (Entries will be tagged with NS:)
  logger: (await import('./logger.js')).ns,
};
