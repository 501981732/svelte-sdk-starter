import './polyfill/classList';
import Component from './components/App.svelte';
import Singleton from './utils/singleton';
import PromiseToken from './utils/promiseToken';

import './assets/css/reset.css';
let app = null;
let defaultProps = {
    callback: () => {},
    text: ''
};

const createComponent = function(props) {
    console.log('create component');
    app = new Component({
        target: document.body,
        props: {
            ...defaultProps,
            ...props[0]
        }
    });
    app.PromiseToken = PromiseToken;
    return app;
};
if (!window.customTaskSDK) {
    window.customTaskSDK = Singleton(createComponent);
    window.customTaskSDK.PromiseToken = PromiseToken;
}

export default app;
