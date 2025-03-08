import { Img, Layout, makeScene2D, View2D } from '@motion-canvas/2d';
import {
  all,
  createEaseInElastic,
  createEaseOutElastic,
  createRef,
  createSignal,
  delay,
  easeInOutBounce,
  easeOutBounce,
  linear,
  loop,
  ThreadGenerator,
  useRandom,
  Vector2,
  waitFor,
} from '@motion-canvas/core';

import gear from '../assets/icons/gear-solid.svg';
import studentImage from '../assets/images/student.png';
import teacherImage from '../assets/images/teacher.png';
import { FONT_FAMILY, Icon, Solarized } from '../utilities';
import { MyTxt } from '../utilities_text';

export function* solve(
  view: View2D,
  object: MyTxt,
  solveAttempts: number = 10,
  solveTime: number = 0.1,
  answer: string = undefined,
): ThreadGenerator {
  const random = useRandom();
  const [a, b] = object.text().split(' + ').map(Number);
  const result = answer === undefined ? a + b : answer;

  const icon = createRef<Icon>();

  const opacityScaleSignal = createSignal(0);

  view.add(
    <Icon
      ref={icon}
      path={gear}
      color={Solarized.base02}
      zIndex={-1}
      opacity={() => opacityScaleSignal() * object.opacity() * 0.25}
      scale={() => object.scale().mul(opacityScaleSignal())}
    />,
  );

  icon().absolutePosition(object.absolutePosition);

  yield loop(() => icon().rotation(0).rotation(360, 1, linear));

  const gearDuration = solveTime * solveAttempts;

  yield* all(
    opacityScaleSignal(1, gearDuration),
    delay(
      gearDuration / 2,
      all(
        ...Array.from({ length: solveAttempts }, (_, i) => {
          let number;
          if (i == solveAttempts - 1) number = result;
          else number = random.nextInt(10, 99);

          return delay(i * solveTime, object.text(`${number}`, (solveTime / 3) * 2));
        }),
        delay(gearDuration / 2, opacityScaleSignal(0, gearDuration)),
      ),
    ),
  );

  icon().remove();
}

function* addChallengeAndResponse(
  view,
  challengeLayout,
  responseLayout,
  challenge,
  teacher,
  student,
  responseObject,
  quick: boolean,
  gearColor,
  fake: boolean,
) {
  if (fake) quick = true;
  const random = useRandom();

  const num1 = random.nextInt(10, 99);
  const num2 = random.nextInt(10, 99);

  const newChallenge = createRef<MyTxt>();
  newChallenge(
    challenge().clone().top(teacher().top().addY(100)).text(`${num1} + ${num2}`),
  );

  challengeLayout().add(newChallenge().clone().opacity(0));
  view.add(newChallenge());

  const challengeIndex = challengeLayout().children().length - 1;

  const newResponse = createRef<MyTxt>();
  newResponse(newChallenge().clone());
  newResponse().top(student().top().addY(100));

  view.add(newResponse());

  responseLayout().add(
    responseObject()
      .clone()
      .text(`${num1 + num2}`)
      .opacity(0),
  );

  const responseIndex = responseLayout().children().length - 1;

  yield* all(
    all(
      newChallenge().absolutePosition(
        challengeLayout().children()[challengeIndex].absolutePosition(),
        fake ? 0 : 1,
      ),
      newChallenge()
        .opacity(0)
        .opacity(fake ? 0 : 1, fake ? 0 : 1),
      newChallenge()
        .scale(0)
        .scale(fake ? 0 : new Vector2(-1, 1), fake ? 0 : 1),
    ),
    delay(
      quick ? 0 : 1,
      all(
        solve(view, newResponse(), fake ? 0 : quick ? 7 : 10),
        delay(
          quick ? 0 : 0.25,
          all(
            newResponse()
              .opacity(0)
              .opacity(fake ? 0 : 1, fake ? 0 : 0.5),
            newResponse()
              .scale(0)
              .scale(fake ? 0 : new Vector2(-1, 1), fake ? 0 : 1),
            newResponse().fill(
              gearColor != null ? gearColor : newResponse().fill(),
              fake ? 0 : 1,
            ),
            newResponse().absolutePosition(
              responseLayout().children()[responseIndex].absolutePosition(),
              fake ? 0 : 1,
            ),
          ),
        ),
      ),
    ),
  );

  challengeLayout().children()[challengeIndex].remove();
  challengeLayout().add(newChallenge());

  responseLayout().children()[responseIndex].remove();
  responseLayout().add(newResponse());
}

function* animatePercentage(
  view: View2D,
  responseLayout: Reference<Layout>,
  i,
  percentageStr: string = undefined,
) {
  const p = createRef<MyTxt>();

  // Calculate percentage based on the current index
  const percentage = Math.pow(0.9, i) * 100;
  const text =
    percentageStr === undefined
      ? `[${percentage.toFixed(i >= 3 ? 1 : 0)}%]`
      : `[${percentageStr}%]`;

  view.add(
    <MyTxt
      fontSize={40}
      padding={20}
      ref={p}
      textAlign="left"
      text={text}
      fill={Solarized.gray}
      opacity={0.5}
      zIndex={-1}
      width={10}
    />,
  );

  p().absolutePosition(() => {
    const response = responseLayout().children()[i] as MyTxt;
    let responseCenter = response.absolutePosition();
    responseCenter.x =
      responseLayout().localToWorld().transformPoint(responseLayout().left()).x -
      80 * view.absoluteScale().x;
    return responseCenter;
    //return responseCenter
    //  .addX(-response.width() / 2)
    //  .addX(-p().width() / 2)
    //  .addX(responseLayout().width() * 1.2);
  });

  yield* all(
    p().opacity(0).opacity(1, 1),
    p().scale(0).scale(new Vector2(-1, 1), 1),
    responseLayout().children()[i].fill(Solarized.cyan, 1),
  );
}

export function* terriblehack(view: View2D, failing: boolean = false) {
  view.fill(Solarized.base2);
  view.scale(new Vector2(-view.scale().x, view.scale().y));

  const student = createRef<Img>();
  const teacher = createRef<Img>();

  yield view.add(
    <>
      <Img
        ref={student}
        x={450}
        scale={[-1, 1]}
        y={() => view.height() / 2 - student().height() / 2}
        layout={false}
        src={studentImage}
      />
      <Img
        ref={teacher}
        x={-450}
        scale={[-1, 1]}
        y={() => view.height() / 2 - teacher().height() / 2}
        layout={false}
        src={teacherImage}
      />
    </>,
  );

  // show teacher and student
  yield* all(
    student().opacity(0).opacity(1, 1),
    student().width(0).width(300, 1),
    teacher().opacity(0).opacity(1, 1),
    teacher().width(0).width(400, 1),
  );

  const left = createRef<MyTxt>();
  const right = createRef<MyTxt>();
  const plus = createRef<MyTxt>();
  view.add(
    <>
      <MyTxt
        fontSize={70}
        padding={20}
        top={teacher().top().addY(100)}
        ref={left}
        text={'11'}
        zIndex={-1}
      />
      <MyTxt
        fontSize={70}
        padding={20}
        top={teacher().top().addY(100)}
        ref={right}
        text={'22'}
        zIndex={-1}
      />
      <MyTxt
        fontSize={70}
        padding={20}
        top={teacher().top().addY(100)}
        ref={plus}
        text={'+'}
        zIndex={-1}
      />
    </>,
  );

  yield* all(
    left().bottom(teacher().top().addY(-40).addX(80), 1),
    left().opacity(0).opacity(1, 1),
    left().scale(0).scale(new Vector2(-1, 1), 1),

    delay(
      0.125,
      all(
        plus().bottom(teacher().top().addY(-40), 1),
        plus().opacity(0).opacity(1, 1),
        plus().scale(0).scale(new Vector2(-1, 1), 1),
      ),
    ),

    delay(
      0.25,
      all(
        right().bottom(teacher().top().addY(-40).addX(-80), 1),
        right().opacity(0).opacity(1, 1),
        right().scale(0).scale(new Vector2(-1, 1), 1),
      ),
    ),
  );

  let to = left().position().add(right().position()).div(2);

  const result = createRef<MyTxt>();
  view.add(
    <>
      <MyTxt
        fontSize={70}
        padding={20}
        position={to}
        ref={result}
        text={'33'}
        zIndex={-1}
        opacity={0}
      />
    </>,
  );

  yield* all(
    left().position(to, 0.75),
    left().opacity(0, 0.75),
    right().position(to, 0.75),
    right().opacity(0, 0.75),
    plus().opacity(0, 0.75),
    plus().scale(0, 0.75),
    result().opacity(1, 1),
    result().scale(new Vector2(-1.5, 1.5), 0.75, createEaseOutElastic(1.5)),
  );

  yield* waitFor(1);
}

export default makeScene2D(function* (view) {
  yield* terriblehack(view, false);
});
