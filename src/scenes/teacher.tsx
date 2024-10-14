import {Layout, Img, makeScene2D, Node, Rect, Txt, View2D} from '@motion-canvas/2d';
import {all, createRef, delay, linear, loop, ThreadGenerator, useRandom, Vector2, waitFor} from "@motion-canvas/core";
import {Solarized, Icon} from "../utilities";

import gear from '../assets/icons/gear-solid.svg';
import checkmark from '../assets/icons/check-solid.svg';

import student from '../assets/images/student.png';
import teacher from '../assets/images/teacher.png';


export function* solve(view: View2D, object: Txt, solveAttempts: number = 10, solveTime: number = 0.1): ThreadGenerator {
    const random = useRandom();
    const [a, b] = object.text().split(' + ').map(Number);
    const result = a + b;

    const icon = createRef<Icon>();

    view.add(
        <Icon ref={icon} path={gear} color={Solarized.base02} position={object.position}/>
    )

    yield loop(() => icon().rotation(0).rotation(360, 1, linear))

    let gearDuration = solveTime * solveAttempts;

    yield* all(
        icon().opacity(0).opacity(0.25, gearDuration),
        icon().scale(0).scale(1, gearDuration),
        delay(
            gearDuration / 2,
            all(
                ...Array.from({length: solveAttempts}, (_, i) => {
                    let number;
                    if (i == solveAttempts - 1)
                        number = result;
                    else
                        number = random.nextInt(10, 99);

                    return delay(i * solveTime, object.text(`${number}`, solveTime / 3 * 2));
                }),
                delay(
                    gearDuration / 2,
                    all(
                        icon().opacity(0, gearDuration),
                        icon().scale(0, gearDuration),
                    )
                )
            )
        ),
    )

    icon().remove()
}


export default makeScene2D(function* (view) {
    view.fill(Solarized.base2);

    const studentImg = createRef<Img>();
    const teacherImg = createRef<Img>();

    view.add(
        <>
            <Img ref={studentImg} x={450} scale={[-1, 1]} y={() => view.height() / 2 - studentImg().height() / 2} layout={false} src={student}/>
            <Img ref={teacherImg} x={-450} scale={[-1, 1]} y={() => view.height() / 2 - teacherImg().height() / 2} layout={false} src={teacher}/>
        </>
    )

    yield* all(
        studentImg().opacity(0).opacity(1, 1),
        studentImg().width(0).width(300, 1),
        teacherImg().opacity(0).opacity(1, 1),
        teacherImg().width(0).width(400, 1),
    )

    const text = createRef<Txt>();

    view.add(
        <Txt fontSize={70} padding={20} top={teacherImg().top().addY(100)} ref={text} fontFamily={'Fira Sans'} text={'13 + 32'} zIndex={-1}/>
    )

    yield* all(
        text().bottom(teacherImg().top(), 1),
        text().opacity(0).opacity(1, 1),
        text().scale(0).scale(1, 1),
    )

    const newText = text().clone()
    text().opacity(0.25);
    view.add(newText);

    yield* all(
        newText.bottom(studentImg().top(), 1),
    )

    yield* solve(view, newText);

    const eq = text().clone().text("=").padding(0).opacity(0);
    eq.position(eq.position().addX(60))  // random value
    view.add(eq);

    yield* all(
        text().right(eq.left(), 1),
        newText.left(eq.right(), 1),
        delay(
            0.5,
            all(
                text().opacity(1, 1),
                eq.opacity(1, 1),
            )
        )
    );

    const layout = createRef<Layout>();
    const l1 = createRef<Layout>();
    const l2 = createRef<Layout>();

    view.add(<Layout ref={layout} layout gap={50} direction={'row'}>
        <Layout direction={'column'} gap={10} alignItems={'end'}>
            <Txt fontWeight={500} fontFamily={'Fira Sans'} text={'Challenge'} padding={[0, 0, 20, 0]}/>
            {text().clone().padding(0).fontSize(50)}
        </Layout>
        <Layout direction={'column'} gap={10} alignItems={'start'}>
            <Txt fontWeight={500} fontFamily={'Fira Sans'} text={'Response'} padding={[0, 0, 20, 0]}/>
            {newText.clone().padding(0).fontSize(50)}
        </Layout>
    </Layout>);

    text().save()
    newText.save()

    yield* all(
        eq.opacity(0, 0.25),
        studentImg().position(studentImg().position().addX(100), 1),
        teacherImg().position(teacherImg().position().addX(-100), 1),
        text().absolutePosition(layout().children()[0].children()[1].absolutePosition(), 1),
        text().fontSize(50, 1),
        newText.absolutePosition(layout().children()[1].children()[1].absolutePosition(), 1),
        newText.fontSize(50, 1),
    )

    yield* waitFor(1);

});

