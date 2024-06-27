
export function useCloud() {
  return process.env.MQTTENDPOINT && process.env.STAGE;

};

import {ns} from './logger.js';
import { Interface } from './Interface.js';
import {Node} from './Node.js';

// If we are connecting to Polyglot Cloud, use the PGC interface instead;
export default {
  // Interface class for Polyglot
  Interface: Interface,
  // Node class from which all nodes are extended from
  Node: Node,

  // Logger utility for the NodeServer (Entries will be tagged with NS:)
  logger: ns
};
