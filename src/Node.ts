// Node class used to represent ISY nodes



import logger from './logger.js';
import type {Interface} from './Interface.js'

// This needs to be changed in the class module that inherits class Node
const nodeDefId = 'UNDEFINED';

// This is the class all nodes have to inherit from
export class Node<DefId extends string, Commands extends Record<string,(message? : any) => void | Promise<void>>, Drivers extends Record<string, {value: string, uom: number, changed? : boolean}>> {
  id: DefId;

  static nodeDefId = nodeDefId;
  polyInterface: Interface;
  primary: any;
  address: any;
  name: any;
  timeAdded: Date;
  enabled: boolean;
  added: boolean;
  commands: Commands;
  drivers: Drivers;
  hint: boolean;

 constructor(polyInterface: Interface, primary: any, address: any, name: any);
  constructor(polyInterface: Interface, primary: any, address: any, name: any, NodeDefId?: DefId) {

    // Set when node is created (added to polyglot, or re-created when we
    // receive a polyglot config message after startup)

    // NodeDefId for this node (must match the nodedefid in the nodedef)
    this.id = NodeDefId;
    this.polyInterface = polyInterface; // Handle to the polyglot interface
    this.primary = primary; // Primary node address
    this.address = address; // This node address
    this.name = name; // This node name

    // Set when we receive the polyglot config
    this.timeAdded = new Date(); // Date at which the node was created
    this.enabled = false; // Node enabled?
    this.added = false; // Flag that tells if the node was added to ISY

    // Must be overridden by the children class.
    // Mapping of command name to function.
    // Example: {
    //    DON: function(message) { ... },
    //    DOF: function(message) { ... } }
    this.commands = {} as Commands;
    // This node's drivers.
    // Must be overridden by the children class.
    // Driver values are set when we receive a polyglot config message
    // Example:  { ST: { value: 0, uom: 51 }}.
    this.drivers = {} as Drivers;
  }

  getDriver(driver: string | number) {
    return this.drivers[driver];
  }

  // Convert values to string
  convertValue(driver: string | number, value: { toString: () => any; }) {
    // Converts numbers & booleans
    switch (typeof value) {
      case 'number':
        return value.toString();

      case 'boolean':
        const uom = this.drivers[driver].uom;
        if (uom !== 2) {
          logger.warn(
            'Value for driver %s is a boolean, but the uom is %s (Should be 2)',
            driver, uom);
        }
        return value ? '1' : '0';

      default:
        return value;
    }
  }

  // Used to set a driver to a value (example set ST to 100)
  setDriver(driver: string, value: any, report = true, forceReport = false, uom = null) {
    // Is driver valid?
    if (driver in this.drivers &&
      'value' in this.drivers[driver] &&
      'uom' in this.drivers[driver]) {

      if (uom && this.drivers[driver].uom !== uom) {
        this.drivers[driver].uom = uom;
        this.drivers[driver].changed = true;
      }

      value = this.convertValue(driver, value);

      if (this.drivers[driver].value !== value) {
        logger.info('Setting node %s driver %s: %s',
          this.address, driver, value);

        this.drivers[driver].value = value;
        this.drivers[driver].changed = true;
      }

      if (report) {
        this.reportDriver(driver, forceReport);
      }
    } else {
      logger.error('Driver %s is not valid for node %s', driver, this.address);
    }
  }

  // Send existing driver value to ISY
  reportDriver(driver: string, forceReport = false) {
    // Is driver valid?
    if (driver in this.drivers) {
      if (this.drivers[driver].changed || forceReport) {
        const message = {
          set: [{
            address: this.address,
            driver: driver,
            value: this.drivers[driver].value,
            uom: this.drivers[driver].uom,
          }]
        };

        this.polyInterface.sendMessage(message, 'status');
        this.drivers[driver].changed = false;
      }
    } else {
      logger.error('Driver %s is not valid for node %s', driver, this.address);
    }
  }

  reportDrivers(forceReport = true) {
    const _this = this;
    Object.keys(_this.drivers).forEach(function(driver) {
      _this.reportDriver(driver, forceReport);
    });
  }

  reportCmd(command: any, value = null, uom = null) {
    const message = {
      command: [{
		  address: this.address,
		  cmd: command
	  }]
	};

	if (value != null)
		message['command'][0]['value'] = value.toString();

	if (uom != null)
		message['command'][0]['uom'] = uom;

    this.polyInterface.sendMessage(message, 'command');
  }

  query() {
    this.reportDrivers();
  }

  status() {
    this.reportDrivers();
  }

  delNode() {
    this.polyInterface.delNode(this);
  }

  // Runs one of the commands in this.commands based on cmdMessage.cmd
  // Example messageContent:
  // { address: 'node003', cmd: 'DON', value: '6', uom: '51' }
  async runCmd(cmdMessage: { cmd: string | number; }) {
    const nodeCommandFunction = this.commands[cmdMessage.cmd];

    if (!nodeCommandFunction) {
      logger.error('Node %s using nodeDefId %s does not have a command: %s',
        this.address, this.id, cmdMessage.cmd);
    }

    return this._asyncWrapper(nodeCommandFunction.call(this, cmdMessage));
  }

  // Makes sure result is a promise
  _asyncWrapper(result: unknown) {
    if (typeof result === 'object' && 'then' in result) {
      return result;
    } else {
      return new Promise(function(resolve) {
        resolve(result);
      });
    }
  }
};

// Required, so that the interface can find this Node class using the nodeDefId
module.exports.nodeDefId = nodeDefId;
