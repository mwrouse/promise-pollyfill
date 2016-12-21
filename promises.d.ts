interface IPromiseSubscriptions {
  fulfillments: Function[],
  rejections: Function[]
}

interface IThenCallback {
    promise: IPromise,
    onResolve: Function,
    onReject: Function,
    resolveFn: Function,
    rejectFn: Function
}


interface IPromise {
  state: PromiseStates,
  value: any,

  isFulfilled (): Boolean,
  isRejected (): Boolean,
  isPending (): Boolean,
  getState (): string,

  resolve (data?: any): IPromise,
  reject (reason?: any): IPromise,
  then (onResolve?: Function, onRejection?: Function): IPromise
}
