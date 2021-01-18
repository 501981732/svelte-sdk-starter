function Singleton(fn) {
    let result;
    return function() {
        return result || (result = fn.call(this, arguments));
    };
}

export default Singleton;
