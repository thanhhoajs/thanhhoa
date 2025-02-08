import { EventEmitter as Events } from 'events';

/**
 * A singleton implementation of Node's EventEmitter
 * @class EventEmitter
 * @extends {Events}
 */
export class EventEmitter extends Events {
  /** @private */
  private static instance: EventEmitter;

  /**
   * Gets the singleton instance of EventEmitter
   * @returns {EventEmitter} The singleton instance
   * @static
   */
  static getInstance() {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }
    return EventEmitter.instance;
  }
}
