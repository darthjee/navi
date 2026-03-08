/**
 * LockedByOtherWorker is a custom error class thrown when a worker attempts
 * to lock a JobRegistry that is already locked by another worker.
 * @author darthjee
 */
class LockedByOtherWorker extends Error {
  constructor(message = 'Registry is locked by another worker') {
    super(message);
    this.name = 'LockedByOtherWorker';
  }
}

export { LockedByOtherWorker };
