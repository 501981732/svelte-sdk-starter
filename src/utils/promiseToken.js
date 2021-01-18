export default class PromiseToken {
    // promise: Promise<string>
    // reason?: string
    constructor(executor) {
        let resolvePromise;
        this.promise = new Promise(resolve => {
            resolvePromise = resolve;
        });
        //   调用的时候 传入PromiseToken类里面的c 就是这 里面的function ,执行会
        executor(message => {
            if (this.reason) {
                return;
            }
            this.reason = message;
            resolvePromise(this.reason);
        });
    }
}
