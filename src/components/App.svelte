<script>
    import { createEventDispatcher, onMount } from 'svelte';
    import { validataPhone, isWeiXin } from './../utils/index.js';
    import { fade, fly } from 'svelte/transition';
    export let callback;
    export let show;
    export let title;
    export let content;

    onMount(init);

    function init() {
        show = true
    }
    function close() {
        show = false
    }

</script>

{#if show}
    <div class="container" transition:fade>
        <div class="main" in:fly={{ y: 50, duration: 1000 }} out:fly={{ y: 50, duration: 1000 }}>
            <p class="title">{title}</p>
            <p class="content">{content}</p>
            <div class="close" on:click={close} />
        </div>
    </div>
{/if}

<style lang="scss">
  
    .container {
        position: fixed;
        z-index: 1000;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.45);

        .main {
            position: absolute;
            top: 0;
            bottom: 0;
            right: 0;
            left: 0;
            margin: auto;
            width: 500px;
            height: 300px;
            background: #fff;
            padding: 20px 30px;
            border-radius: 30px;
            box-sizing: border-box;
            text-align: center;
            box-sizing: 0 4px 12px rgba(0,0,0,0.15);
        }
        .title {
            font-size: 36px;
            font-weight: 500;
        }
        .content {
            font-size: 24px;
        }
        .close {
            position: absolute;
            top: 10px;
            right: -10px;
            transform: translateX(-50%);
            width: 45px;
            height: 45px;
            border-radius: 50%;
            background-size: contain;
            &::before,&::after {
                position: absolute;
                display: inline-block;
                top: 50%;
                left: 0;
                background: rgba(0, 0, 0, 0.45);
                height: 2px;
                width: 100%;
                content: ' ';
            }
            &::before {
                transform: translateY(-50%) rotate(45deg);
            }
            &::after {
                transform: translateY(-50%) rotate(-45deg);
            }

        }
    }
</style>
