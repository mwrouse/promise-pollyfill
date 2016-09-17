interface IPromiseSubscriptions {
  fulfillment: Function[],
  rejection: Function[]
}

interface IPromise {
  state: PromiseStates,
  reason: any,

  isFulfilled (): Boolean,
  isRejected (): Boolean,
  isPending (): Boolean,
  getState (): string,

  resolve (data?: any): IPromise,
  reject (reason?: any): IPromise,
  then (onResolve: Function, onRejection?: Function): IPromise,
  catch (onRejection: Function): IPromise
}
