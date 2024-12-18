import {Circle, Layout, makeScene2D, Node, NodeProps, Rect} from '@motion-canvas/2d';
import {
    all,
    createRef,
    createSignal,
    delay,
    easeInOutExpo,
    SignalValue,
    SimpleSignal,
    waitFor
} from '@motion-canvas/core';
import {Solarized} from "../utilities";
import {Lock} from "../utilities_lock";
import chroma from 'chroma-js'

import gradientShader from '../shaders/gradient.glsl';



export default makeScene2D(function* (view) {
    view.fill(Solarized.base2);

    const circle = createRef<Circle>();
    const lock = createRef<Lock>();

    view.add(
        <>
            <Circle ref={circle} size={300} fill={'red'} zIndex={0}/>
            <Lock ref={lock} object={circle()}/>
        </>
    );

    yield* waitFor(1);

    yield* lock().lock();

    yield* waitFor(1);

    yield* lock().unlock();
});

