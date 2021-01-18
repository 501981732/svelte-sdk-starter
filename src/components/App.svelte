<script>
    import { createEventDispatcher, onMount, onDestroy } from 'svelte';
    import { validataPhone, isWeiXin } from './../utils/index.js';
    import { fade, fly } from 'svelte/transition';
    import Toast from './Toast/index.svelte';
    const dispatch = createEventDispatcher();

    let show = false;
    let showToast = false;
    let toastInfo = null;
    let toastTimer = null;
    export let callback;
    export let text;
    export let insert;

    onMount(init);

    function init() {
        show = true;
        if (insert) {
            insert.promise.then(data => {
                if (data && data.text) {
                    text = data.text;
                }
                if (data && data.taskId) {
                    taskId = data.taskId;
                }
            });
        }
    }

    function handleToast(info) {
        if (!showToast) {
            showToast = true;
            toastInfo = info;
            toastTimer = setTimeout(() => {
                showToast = false;
            }, 2000);
        }
    }
    onDestroy(() => {
        clearTimeout(toastTimer);
    });
</script>

{#if show}
    <div class="login-alert" id="login-alert" transition:fade />
    {#if showToast}
        <Toast info={toastInfo} />
    {/if}
{/if}

<style lang="scss">

</style>
