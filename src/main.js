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

export default app;



// for test
// you should delete this code before you publish this sdk
window[namespace]({
    title: '你瞅啥',
    content: '瞅你咋地'
})
