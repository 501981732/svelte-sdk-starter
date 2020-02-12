import './polyfill/classList';
import Component from './components/App.svelte';
import './assets/css/reset.css';
let app = null;
let defaultProps = {
    callback: () => {}
};
if (!window.XXSDK) {
    window.XXSDK = function(props) {
        // Creating a component
        app = new Component({
            target: document.body,
            props: {
                ...defaultProps,
                ...props
            }
        });
        return app;
    };
}

window.XXSDK({});

export default app;
