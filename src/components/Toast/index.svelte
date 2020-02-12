<script>
    import { fly } from 'svelte/transition';
    import { beforeUpdate, onDestroy, onMount } from 'svelte';
    export let info;
    let show = true;
    let timer = null;
    onMount(() => {
        // show = true
        // timer = setTimeout(()=>{
        //     close()
        // },2000)
    });
    beforeUpdate(() => {
        console.log('show', show);
    });
    onDestroy(() => {
        clearTimeout(timer);
    });
</script>

<!-- {#if show} -->
<div
    class="toast"
    in:fly={{ y: 10, duration: 1000 }}
    out:fly={{ y: 10, duration: 1000 }}>
    {info}
</div>
<!-- {/if} -->

<style lang="scss">
    .toast {
        position: fixed;
        width: 500px;
        padding: 10px;
        background-color: rgba(0, 0, 0, 0.7);
        border-radius: 10px;
        text-align: center;
        color: #fff;
        z-index: 1010;
        top: 50%;
        left: 50%;
        font-size: 24px;
        transform: translate(-50%, -50%);
    }
</style>
