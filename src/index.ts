
export function useCloud() {
  return process.env.MQTTENDPOINT && process.env.STAGE;

};


// If we are connecting to Polyglot Cloud, use the PGC interface instead;
export  default {
  // Interface class for Polyglot
  Interface: (await import('./Interface.js')).Interface,
  // Node class from which all nodes are extended from
  Node: (await import('./Node.js')).Node,

  // Logger utility for the NodeServer (Entries will be tagged with NS:)
  logger: (await import('./logger.js')).ns,
};
