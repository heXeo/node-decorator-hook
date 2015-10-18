'use strict';

import uuid from 'uuid';
import _ from 'lodash';

export default class Hook {
  static create (func, defaultContext) {
    return (target, key, descriptor) => {
      if (!descriptor) {
        return target;
      }

      descriptor.value = (trampoline) => {
        let context = _.merge({
          uuid: uuid.v1()
        }, defaultContext);

        return function (...args) {
          return func(context, this, trampoline, args);
        };
      }(descriptor.value);
      return descriptor;
    };
  }

  static attach (target, key, func, defaultContext) {
    let descriptor = Object.getOwnPropertyDescriptor(target.prototype, key);
    let decorator = this.create(func, defaultContext);
    let decoratedDescriptor = decorator(target, key, descriptor);
    if (decoratedDescriptor !== target) {
      Object.defineProperty(target.prototype, key, decoratedDescriptor);
    }
  }
}
