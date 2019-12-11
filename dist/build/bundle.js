
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    let running = false;
    function run_tasks() {
        tasks.forEach(task => {
            if (!task[0](now())) {
                tasks.delete(task);
                task[1]();
            }
        });
        running = tasks.size > 0;
        if (running)
            raf(run_tasks);
    }
    function loop(fn) {
        let task;
        if (!running) {
            running = true;
            raf(run_tasks);
        }
        return {
            promise: new Promise(fulfil => {
                tasks.add(task = [fn, fulfil]);
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, props) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : prop_values;
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    const inBrowser = typeof window !== 'undefined';

    const UA = inBrowser && window.navigator.userAgent.toLowerCase();

    const isInAPP = UA && /wuba/.test(UA);

    const isWeiXin = UA && /micromessenger/.test(UA);

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/components/App.svelte generated by Svelte v3.15.0 */
    const file = "src/components/App.svelte";

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-59rrs8-style";
    	style.textContent = ".container.svelte-59rrs8{position:fixed;z-index:1000;width:100%;height:100%;background:rgba(0, 0, 0, 0.45)}.container.svelte-59rrs8 .main.svelte-59rrs8{position:absolute;top:0;bottom:0;right:0;left:0;margin:auto;width:66.667vw;height:40vw;background:#fff;padding:2.667vw 4vw;border-radius:4vw;box-sizing:border-box;text-align:center;box-sizing:0 0.533vw 1.6vw rgba(0, 0, 0, 0.15)}.container.svelte-59rrs8 .title.svelte-59rrs8{font-size:4.8vw;font-weight:500}.container.svelte-59rrs8 .content.svelte-59rrs8{font-size:3.2vw}.container.svelte-59rrs8 .close.svelte-59rrs8{position:absolute;top:1.333vw;right:-1.333vw;-webkit-transform:translateX(-50%);transform:translateX(-50%);width:6vw;height:6vw;border-radius:50%;background-size:contain}.container.svelte-59rrs8 .close.svelte-59rrs8::before,.container.svelte-59rrs8 .close.svelte-59rrs8::after{position:absolute;display:inline-block;top:50%;left:0;background:rgba(0, 0, 0, 0.45);height:0.267vw;width:100%;content:' '}.container.svelte-59rrs8 .close.svelte-59rrs8::before{-webkit-transform:translateY(-50%) rotate(45deg);transform:translateY(-50%) rotate(45deg)}.container.svelte-59rrs8 .close.svelte-59rrs8::after{-webkit-transform:translateY(-50%) rotate(-45deg);transform:translateY(-50%) rotate(-45deg)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXBwLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQXBwLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICAgIGltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciwgb25Nb3VudCB9IGZyb20gJ3N2ZWx0ZSc7XG4gICAgaW1wb3J0IHsgdmFsaWRhdGFQaG9uZSwgaXNXZWlYaW4gfSBmcm9tICcuLy4uL3V0aWxzL2luZGV4LmpzJztcbiAgICBpbXBvcnQgeyBmYWRlLCBmbHkgfSBmcm9tICdzdmVsdGUvdHJhbnNpdGlvbic7XG4gICAgZXhwb3J0IGxldCBjYWxsYmFjaztcbiAgICBleHBvcnQgbGV0IHNob3c7XG4gICAgZXhwb3J0IGxldCB0aXRsZTtcbiAgICBleHBvcnQgbGV0IGNvbnRlbnQ7XG5cbiAgICBvbk1vdW50KGluaXQpO1xuXG4gICAgZnVuY3Rpb24gaW5pdCgpIHtcbiAgICAgICAgc2hvdyA9IHRydWVcbiAgICB9XG4gICAgZnVuY3Rpb24gY2xvc2UoKSB7XG4gICAgICAgIHNob3cgPSBmYWxzZVxuICAgIH1cblxuPC9zY3JpcHQ+XG5cbnsjaWYgc2hvd31cbiAgICA8ZGl2IGNsYXNzPVwiY29udGFpbmVyXCIgdHJhbnNpdGlvbjpmYWRlPlxuICAgICAgICA8ZGl2IGNsYXNzPVwibWFpblwiIGluOmZseT17eyB5OiA1MCwgZHVyYXRpb246IDEwMDAgfX0gb3V0OmZseT17eyB5OiA1MCwgZHVyYXRpb246IDEwMDAgfX0+XG4gICAgICAgICAgICA8cCBjbGFzcz1cInRpdGxlXCI+e3RpdGxlfTwvcD5cbiAgICAgICAgICAgIDxwIGNsYXNzPVwiY29udGVudFwiPntjb250ZW50fTwvcD5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjbG9zZVwiIG9uOmNsaWNrPXtjbG9zZX0gLz5cbiAgICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG57L2lmfVxuXG48c3R5bGUgbGFuZz1cInNjc3NcIj4uY29udGFpbmVyIHtcbiAgcG9zaXRpb246IGZpeGVkO1xuICB6LWluZGV4OiAxMDAwO1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiAxMDAlO1xuICBiYWNrZ3JvdW5kOiByZ2JhKDAsIDAsIDAsIDAuNDUpOyB9XG4gIC5jb250YWluZXIgLm1haW4ge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB0b3A6IDA7XG4gICAgYm90dG9tOiAwO1xuICAgIHJpZ2h0OiAwO1xuICAgIGxlZnQ6IDA7XG4gICAgbWFyZ2luOiBhdXRvO1xuICAgIHdpZHRoOiA2Ni42Njd2dztcbiAgICBoZWlnaHQ6IDQwdnc7XG4gICAgYmFja2dyb3VuZDogI2ZmZjtcbiAgICBwYWRkaW5nOiAyLjY2N3Z3IDR2dztcbiAgICBib3JkZXItcmFkaXVzOiA0dnc7XG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgYm94LXNpemluZzogMCAwLjUzM3Z3IDEuNnZ3IHJnYmEoMCwgMCwgMCwgMC4xNSk7IH1cbiAgLmNvbnRhaW5lciAudGl0bGUge1xuICAgIGZvbnQtc2l6ZTogNC44dnc7XG4gICAgZm9udC13ZWlnaHQ6IDUwMDsgfVxuICAuY29udGFpbmVyIC5jb250ZW50IHtcbiAgICBmb250LXNpemU6IDMuMnZ3OyB9XG4gIC5jb250YWluZXIgLmNsb3NlIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgdG9wOiAxLjMzM3Z3O1xuICAgIHJpZ2h0OiAtMS4zMzN2dztcbiAgICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKTtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSk7XG4gICAgd2lkdGg6IDZ2dztcbiAgICBoZWlnaHQ6IDZ2dztcbiAgICBib3JkZXItcmFkaXVzOiA1MCU7XG4gICAgYmFja2dyb3VuZC1zaXplOiBjb250YWluOyB9XG4gICAgLmNvbnRhaW5lciAuY2xvc2U6OmJlZm9yZSwgLmNvbnRhaW5lciAuY2xvc2U6OmFmdGVyIHtcbiAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICAgIHRvcDogNTAlO1xuICAgICAgbGVmdDogMDtcbiAgICAgIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC40NSk7XG4gICAgICBoZWlnaHQ6IDAuMjY3dnc7XG4gICAgICB3aWR0aDogMTAwJTtcbiAgICAgIGNvbnRlbnQ6ICcgJzsgfVxuICAgIC5jb250YWluZXIgLmNsb3NlOjpiZWZvcmUge1xuICAgICAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSkgcm90YXRlKDQ1ZGVnKTtcbiAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKSByb3RhdGUoNDVkZWcpOyB9XG4gICAgLmNvbnRhaW5lciAuY2xvc2U6OmFmdGVyIHtcbiAgICAgIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpIHJvdGF0ZSgtNDVkZWcpO1xuICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpIHJvdGF0ZSgtNDVkZWcpOyB9XG5cbi8qIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGE6YXBwbGljYXRpb24vanNvbjtiYXNlNjQsZXlKMlpYSnphVzl1SWpvekxDSnpiM1Z5WTJWeklqcGJJbk55WXk5amIyMXdiMjVsYm5SekwwRndjQzV6ZG1Wc2RHVWlYU3dpYm1GdFpYTWlPbHRkTENKdFlYQndhVzVuY3lJNklqczdTVUZGU1R0UlFVTkpMR1ZCUVdVN1VVRkRaaXhoUVVGaE8xRkJRMklzVjBGQlZ6dFJRVU5ZTEZsQlFWazdVVUZEV2l3clFrRkJLMEk3TzFGQlJTOUNPMWxCUTBrc2EwSkJRV3RDTzFsQlEyeENMRTFCUVUwN1dVRkRUaXhUUVVGVE8xbEJRMVFzVVVGQlVUdFpRVU5TTEU5QlFVODdXVUZEVUN4WlFVRlpPMWxCUTFvc1pVRkJXVHRaUVVOYUxGbEJRV0U3V1VGRFlpeG5Ra0ZCWjBJN1dVRkRhRUlzYjBKQlFXdENPMWxCUTJ4Q0xHdENRVUZ0UWp0WlFVTnVRaXh6UWtGQmMwSTdXVUZEZEVJc2EwSkJRV3RDTzFsQlEyeENMRFJEUVVGMVF6dFJRVU16UXp0UlFVTkJPMWxCUTBrc1owSkJRV1U3V1VGRFppeG5Ra0ZCWjBJN1VVRkRjRUk3VVVGRFFUdFpRVU5KTEdkQ1FVRmxPMUZCUTI1Q08xRkJRMEU3V1VGRFNTeHJRa0ZCYTBJN1dVRkRiRUlzV1VGQlV6dFpRVU5VTEdWQlFWazdXVUZEV2l4dFEwRkJNa0k3YjBKQlFUTkNMREpDUVVFeVFqdFpRVU16UWl4VlFVRlhPMWxCUTFnc1YwRkJXVHRaUVVOYUxHdENRVUZyUWp0WlFVTnNRaXgzUWtGQmQwSTdXVUZEZUVJN1owSkJRMGtzYTBKQlFXdENPMmRDUVVOc1FpeHhRa0ZCY1VJN1owSkJRM0pDTEZGQlFWRTdaMEpCUTFJc1QwRkJUenRuUWtGRFVDd3JRa0ZCSzBJN1owSkJReTlDTEdWQlFWYzdaMEpCUTFnc1YwRkJWenRuUWtGRFdDeFpRVUZaTzFsQlEyaENPMWxCUTBFN1owSkJRMGtzYVVSQlFYbERPM2RDUVVGNlF5eDVRMEZCZVVNN1dVRkROME03V1VGRFFUdG5Ra0ZEU1N4clJFRkJNRU03ZDBKQlFURkRMREJEUVVFd1F6dFpRVU01UXpzN1VVRkZTanRKUVVOS0lpd2labWxzWlNJNkluTnlZeTlqYjIxd2IyNWxiblJ6TDBGd2NDNXpkbVZzZEdVaUxDSnpiM1Z5WTJWelEyOXVkR1Z1ZENJNld5SmNiaUFnWEc0Z0lDQWdMbU52Ym5SaGFXNWxjaUI3WEc0Z0lDQWdJQ0FnSUhCdmMybDBhVzl1T2lCbWFYaGxaRHRjYmlBZ0lDQWdJQ0FnZWkxcGJtUmxlRG9nTVRBd01EdGNiaUFnSUNBZ0lDQWdkMmxrZEdnNklERXdNQ1U3WEc0Z0lDQWdJQ0FnSUdobGFXZG9kRG9nTVRBd0pUdGNiaUFnSUNBZ0lDQWdZbUZqYTJkeWIzVnVaRG9nY21kaVlTZ3dMQ0F3TENBd0xDQXdMalExS1R0Y2JseHVJQ0FnSUNBZ0lDQXViV0ZwYmlCN1hHNGdJQ0FnSUNBZ0lDQWdJQ0J3YjNOcGRHbHZiam9nWVdKemIyeDFkR1U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjBiM0E2SURBN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpYjNSMGIyMDZJREE3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnlhV2RvZERvZ01EdGNiaUFnSUNBZ0lDQWdJQ0FnSUd4bFpuUTZJREE3WEc0Z0lDQWdJQ0FnSUNBZ0lDQnRZWEpuYVc0NklHRjFkRzg3WEc0Z0lDQWdJQ0FnSUNBZ0lDQjNhV1IwYURvZ05UQXdjSGc3WEc0Z0lDQWdJQ0FnSUNBZ0lDQm9aV2xuYUhRNklETXdNSEI0TzF4dUlDQWdJQ0FnSUNBZ0lDQWdZbUZqYTJkeWIzVnVaRG9nSTJabVpqdGNiaUFnSUNBZ0lDQWdJQ0FnSUhCaFpHUnBibWM2SURJd2NIZ2dNekJ3ZUR0Y2JpQWdJQ0FnSUNBZ0lDQWdJR0p2Y21SbGNpMXlZV1JwZFhNNklETXdjSGc3WEc0Z0lDQWdJQ0FnSUNBZ0lDQmliM2d0YzJsNmFXNW5PaUJpYjNKa1pYSXRZbTk0TzF4dUlDQWdJQ0FnSUNBZ0lDQWdkR1Y0ZEMxaGJHbG5iam9nWTJWdWRHVnlPMXh1SUNBZ0lDQWdJQ0FnSUNBZ1ltOTRMWE5wZW1sdVp6b2dNQ0EwY0hnZ01USndlQ0J5WjJKaEtEQXNNQ3d3TERBdU1UVXBPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUM1MGFYUnNaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQm1iMjUwTFhOcGVtVTZJRE0yY0hnN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JtYjI1MExYZGxhV2RvZERvZ05UQXdPMXh1SUNBZ0lDQWdJQ0I5WEc0Z0lDQWdJQ0FnSUM1amIyNTBaVzUwSUh0Y2JpQWdJQ0FnSUNBZ0lDQWdJR1p2Ym5RdGMybDZaVG9nTWpSd2VEdGNiaUFnSUNBZ0lDQWdmVnh1SUNBZ0lDQWdJQ0F1WTJ4dmMyVWdlMXh1SUNBZ0lDQWdJQ0FnSUNBZ2NHOXphWFJwYjI0NklHRmljMjlzZFhSbE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnZEc5d09pQXhNSEI0TzF4dUlDQWdJQ0FnSUNBZ0lDQWdjbWxuYUhRNklDMHhNSEI0TzF4dUlDQWdJQ0FnSUNBZ0lDQWdkSEpoYm5ObWIzSnRPaUIwY21GdWMyeGhkR1ZZS0MwMU1DVXBPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2QybGtkR2c2SURRMWNIZzdYRzRnSUNBZ0lDQWdJQ0FnSUNCb1pXbG5hSFE2SURRMWNIZzdYRzRnSUNBZ0lDQWdJQ0FnSUNCaWIzSmtaWEl0Y21Ga2FYVnpPaUExTUNVN1hHNGdJQ0FnSUNBZ0lDQWdJQ0JpWVdOclozSnZkVzVrTFhOcGVtVTZJR052Ym5SaGFXNDdYRzRnSUNBZ0lDQWdJQ0FnSUNBbU9qcGlaV1p2Y21Vc0pqbzZZV1owWlhJZ2UxeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lIQnZjMmwwYVc5dU9pQmhZbk52YkhWMFpUdGNiaUFnSUNBZ0lDQWdJQ0FnSUNBZ0lDQmthWE53YkdGNU9pQnBibXhwYm1VdFlteHZZMnM3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZEc5d09pQTFNQ1U3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnYkdWbWREb2dNRHRjYmlBZ0lDQWdJQ0FnSUNBZ0lDQWdJQ0JpWVdOclozSnZkVzVrT2lCeVoySmhLREFzSURBc0lEQXNJREF1TkRVcE8xeHVJQ0FnSUNBZ0lDQWdJQ0FnSUNBZ0lHaGxhV2RvZERvZ01uQjRPMXh1SUNBZ0lDQWdJQ0FnSUNBZ0lDQWdJSGRwWkhSb09pQXhNREFsTzF4dUlDQWdJQ0FnSUNBZ0lDQWdJQ0FnSUdOdmJuUmxiblE2SUNjZ0p6dGNiaUFnSUNBZ0lDQWdJQ0FnSUgxY2JpQWdJQ0FnSUNBZ0lDQWdJQ1k2T21KbFptOXlaU0I3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZEhKaGJuTm1iM0p0T2lCMGNtRnVjMnhoZEdWWktDMDFNQ1VwSUhKdmRHRjBaU2cwTldSbFp5azdYRzRnSUNBZ0lDQWdJQ0FnSUNCOVhHNGdJQ0FnSUNBZ0lDQWdJQ0FtT2pwaFpuUmxjaUI3WEc0Z0lDQWdJQ0FnSUNBZ0lDQWdJQ0FnZEhKaGJuTm1iM0p0T2lCMGNtRnVjMnhoZEdWWktDMDFNQ1VwSUhKdmRHRjBaU2d0TkRWa1pXY3BPMXh1SUNBZ0lDQWdJQ0FnSUNBZ2ZWeHVYRzRnSUNBZ0lDQWdJSDFjYmlBZ0lDQjlYRzRpWFgwPSAqL1xuXG4vKiMgc291cmNlTWFwcGluZ1VSTD1BcHAuc3ZlbHRlLmNzcy5tYXAgKi88L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQThCbUIsVUFBVSxjQUFDLENBQUMsQUFDN0IsUUFBUSxDQUFFLEtBQUssQ0FDZixPQUFPLENBQUUsSUFBSSxDQUNiLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixVQUFVLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQUFBRSxDQUFDLEFBQ2xDLHdCQUFVLENBQUMsS0FBSyxjQUFDLENBQUMsQUFDaEIsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsR0FBRyxDQUFFLENBQUMsQ0FDTixNQUFNLENBQUUsQ0FBQyxDQUNULEtBQUssQ0FBRSxDQUFDLENBQ1IsSUFBSSxDQUFFLENBQUMsQ0FDUCxNQUFNLENBQUUsSUFBSSxDQUNaLEtBQUssQ0FBRSxRQUFRLENBQ2YsTUFBTSxDQUFFLElBQUksQ0FDWixVQUFVLENBQUUsSUFBSSxDQUNoQixPQUFPLENBQUUsT0FBTyxDQUFDLEdBQUcsQ0FDcEIsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsVUFBVSxDQUFFLFVBQVUsQ0FDdEIsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsVUFBVSxDQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEFBQUUsQ0FBQyxBQUNwRCx3QkFBVSxDQUFDLE1BQU0sY0FBQyxDQUFDLEFBQ2pCLFNBQVMsQ0FBRSxLQUFLLENBQ2hCLFdBQVcsQ0FBRSxHQUFHLEFBQUUsQ0FBQyxBQUNyQix3QkFBVSxDQUFDLFFBQVEsY0FBQyxDQUFDLEFBQ25CLFNBQVMsQ0FBRSxLQUFLLEFBQUUsQ0FBQyxBQUNyQix3QkFBVSxDQUFDLE1BQU0sY0FBQyxDQUFDLEFBQ2pCLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEdBQUcsQ0FBRSxPQUFPLENBQ1osS0FBSyxDQUFFLFFBQVEsQ0FDZixpQkFBaUIsQ0FBRSxXQUFXLElBQUksQ0FBQyxDQUNuQyxTQUFTLENBQUUsV0FBVyxJQUFJLENBQUMsQ0FDM0IsS0FBSyxDQUFFLEdBQUcsQ0FDVixNQUFNLENBQUUsR0FBRyxDQUNYLGFBQWEsQ0FBRSxHQUFHLENBQ2xCLGVBQWUsQ0FBRSxPQUFPLEFBQUUsQ0FBQyxBQUMzQix3QkFBVSxDQUFDLG9CQUFNLFFBQVEsQ0FBRSx3QkFBVSxDQUFDLG9CQUFNLE9BQU8sQUFBQyxDQUFDLEFBQ25ELFFBQVEsQ0FBRSxRQUFRLENBQ2xCLE9BQU8sQ0FBRSxZQUFZLENBQ3JCLEdBQUcsQ0FBRSxHQUFHLENBQ1IsSUFBSSxDQUFFLENBQUMsQ0FDUCxVQUFVLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDL0IsTUFBTSxDQUFFLE9BQU8sQ0FDZixLQUFLLENBQUUsSUFBSSxDQUNYLE9BQU8sQ0FBRSxHQUFHLEFBQUUsQ0FBQyxBQUNqQix3QkFBVSxDQUFDLG9CQUFNLFFBQVEsQUFBQyxDQUFDLEFBQ3pCLGlCQUFpQixDQUFFLFdBQVcsSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FDakQsU0FBUyxDQUFFLFdBQVcsSUFBSSxDQUFDLENBQUMsT0FBTyxLQUFLLENBQUMsQUFBRSxDQUFDLEFBQzlDLHdCQUFVLENBQUMsb0JBQU0sT0FBTyxBQUFDLENBQUMsQUFDeEIsaUJBQWlCLENBQUUsV0FBVyxJQUFJLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQyxDQUNsRCxTQUFTLENBQUUsV0FBVyxJQUFJLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQyxBQUFFLENBQUMifQ== */";
    	append_dev(document.head, style);
    }

    // (21:0) {#if show}
    function create_if_block(ctx) {
    	let div2;
    	let div1;
    	let p0;
    	let t0;
    	let t1;
    	let p1;
    	let t2;
    	let t3;
    	let div0;
    	let div1_intro;
    	let div1_outro;
    	let div2_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			p0 = element("p");
    			t0 = text(ctx.title);
    			t1 = space();
    			p1 = element("p");
    			t2 = text(ctx.content);
    			t3 = space();
    			div0 = element("div");
    			attr_dev(p0, "class", "title svelte-59rrs8");
    			add_location(p0, file, 23, 12, 576);
    			attr_dev(p1, "class", "content svelte-59rrs8");
    			add_location(p1, file, 24, 12, 617);
    			attr_dev(div0, "class", "close svelte-59rrs8");
    			add_location(div0, file, 25, 12, 662);
    			attr_dev(div1, "class", "main svelte-59rrs8");
    			add_location(div1, file, 22, 8, 474);
    			attr_dev(div2, "class", "container svelte-59rrs8");
    			add_location(div2, file, 21, 4, 426);
    			dispose = listen_dev(div0, "click", ctx.close, false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, p1);
    			append_dev(p1, t2);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (!current || changed.title) set_data_dev(t0, ctx.title);
    			if (!current || changed.content) set_data_dev(t2, ctx.content);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				if (!div1_intro) div1_intro = create_in_transition(div1, fly, { y: 50, duration: 1000 });
    				div1_intro.start();
    			});

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fly, { y: 50, duration: 1000 });
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div1_outro) div1_outro.end();
    			if (detaching && div2_transition) div2_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(21:0) {#if show}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = ctx.show && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(changed, ctx) {
    			if (ctx.show) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { callback } = $$props;
    	let { show } = $$props;
    	let { title } = $$props;
    	let { content } = $$props;
    	onMount(init);

    	function init() {
    		$$invalidate("show", show = true);
    	}

    	function close() {
    		$$invalidate("show", show = false);
    	}

    	const writable_props = ["callback", "show", "title", "content"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("callback" in $$props) $$invalidate("callback", callback = $$props.callback);
    		if ("show" in $$props) $$invalidate("show", show = $$props.show);
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    		if ("content" in $$props) $$invalidate("content", content = $$props.content);
    	};

    	$$self.$capture_state = () => {
    		return { callback, show, title, content };
    	};

    	$$self.$inject_state = $$props => {
    		if ("callback" in $$props) $$invalidate("callback", callback = $$props.callback);
    		if ("show" in $$props) $$invalidate("show", show = $$props.show);
    		if ("title" in $$props) $$invalidate("title", title = $$props.title);
    		if ("content" in $$props) $$invalidate("content", content = $$props.content);
    	};

    	return { callback, show, title, content, close };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-59rrs8-style")) add_css();

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			callback: 0,
    			show: 0,
    			title: 0,
    			content: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (ctx.callback === undefined && !("callback" in props)) {
    			console.warn("<App> was created without expected prop 'callback'");
    		}

    		if (ctx.show === undefined && !("show" in props)) {
    			console.warn("<App> was created without expected prop 'show'");
    		}

    		if (ctx.title === undefined && !("title" in props)) {
    			console.warn("<App> was created without expected prop 'title'");
    		}

    		if (ctx.content === undefined && !("content" in props)) {
    			console.warn("<App> was created without expected prop 'content'");
    		}
    	}

    	get callback() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get show() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set show(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get content() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set content(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    let app = null;

    const namespace = 'SDK';

    let defaultProps = {
        title: '',
        content: '',
        callback: () => {}
    };

    if (!window[namespace]) {
        window[namespace] = function(props) {
            // Creating a component
            app = new App({
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
    });
    var app$1 = app;

    return app$1;

}());
//# sourceMappingURL=bundle.js.map
