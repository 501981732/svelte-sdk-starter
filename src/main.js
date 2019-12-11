import Component from './components/App.svelte';

let app = null;

const namespace = 'SDK'

let defaultProps = {
    title: '',
    content: '',
    callback: () => {}
};

if (!window[namespace]) {
    window[namespace] = function(props) {
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

// FOR TEST
window[namespace]({
    title: '你愁啥',
    content: '瞅你咋地'
})
export default app;
