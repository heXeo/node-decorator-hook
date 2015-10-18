'use strict';

import Hook from '../src/Hook';

describe('Hook', () => {
  it('shoud provide a create method', () => {
    return expect(Hook).itself.to.respondTo('create');
  });

  it('shoud provide an attach method', () => {
    return expect(Hook).itself.to.respondTo('attach');
  });

  let defaultContext = { foo: 'bar' };
  let decorator = Hook.create((context, self, trampoline, args) => {
    return trampoline.call(self, context, self, trampoline, args);
  }, defaultContext);

  let decoratorUuid = Hook.create((context, self, trampoline, args) => {
    return trampoline.call(self, context, self, trampoline, args);
  }, { uuid: 'some-custom-uuid' });

  class SomeTestClass {
    someFunction (...args) {
      return args;
    }
  }

  it('decorator is a function', () => {
    return expect(decorator).to.be.a('function');
  });

  it('decorator returns a descriptor on call member', () => {
    let descriptor = decorator(
      SomeTestClass,
      'someFunction',
      Object.getOwnPropertyDescriptor(SomeTestClass.prototype, 'someFunction')
    );

    return expect(descriptor).to.be.an('object')
    .and.to.have.all.keys('value', 'writable', 'enumerable', 'configurable');
  });

  it('decorator returns the target on class', () => {
    let target = decorator(SomeTestClass, null, null);
    return expect(target).to.be.equals(SomeTestClass);
  });

  describe('decorated function', () => {
    let instance = new SomeTestClass();
    let descriptor = decorator(
      SomeTestClass,
      'someFunction',
      Object.getOwnPropertyDescriptor(SomeTestClass.prototype, 'someFunction')
    );

    let argsOrg = [ 1, 2, 3, 4 ];
    let [ context, self, trampoline, args ] = descriptor.value.apply(
      instance, argsOrg
    );

    it('context should have uuid', () => {
      return expect(context).to.be.an('object')
      .and.to.contain.all.keys('uuid');
    });

    it('context should merge defaultContext', () => {
      return expect(context).to.contain.all.keys(defaultContext);
    });

    context.bar = 'baz';

    it('context should be persistent across calls', () => {
      let [ context ] = descriptor.value.apply(
        instance, argsOrg
      );

      return expect(context).to.contain.have.property('bar', 'baz');
    });

    it('defaultContext can override uuid', () => {
      let descriptor = decoratorUuid(
        SomeTestClass,
        'someFunction',
        Object.getOwnPropertyDescriptor(SomeTestClass.prototype, 'someFunction')
      );

      let [ context ] = descriptor.value.apply(
        instance, argsOrg
      );

      return expect(context.uuid).to.be.equals('some-custom-uuid');
    });

    it('self should be the class instance', () => {
      return expect(self).to.be.equals(instance);
    });

    it('trampoline should be the unbound class member', () => {
      return expect(trampoline).to.be.a('function')
      .and.to.be.equals(SomeTestClass.prototype.someFunction);
    });

    it('args should be the function arguments', () => {
      return expect(args).to.be.deep.equals(argsOrg);
    });
  });
});
