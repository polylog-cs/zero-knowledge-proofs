import { Img, Layout, makeScene2D, View2D } from '@motion-canvas/2d';
import {
  all,
  createRef,
  createSignal,
  delay,
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
): ThreadGenerator {
  const random = useRandom();
  const [a, b] = object.text().split(' + ').map(Number);
  const result = a + b;

  const icon = createRef<Icon>();

  let opacityScaleSignal = createSignal(0);

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

  let gearDuration = solveTime * solveAttempts;

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
) {
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
        1,
      ),
      newChallenge().opacity(0).opacity(1, 1),
      newChallenge().scale(0).scale(1, 1),
    ),
    delay(
      quick ? 0 : 1,
      all(
        solve(view, newResponse(), quick ? 7 : 10),
        delay(
          quick ? 0 : 0.25,
          all(
            newResponse().opacity(0).opacity(1, 0.5),
            newResponse().scale(0).scale(1, 1),
            newResponse().fill(gearColor != null ? gearColor : newResponse().fill(), 1),
            newResponse().absolutePosition(
              responseLayout().children()[responseIndex].absolutePosition(),
              1,
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

function* animatePercentage(view, responseLayout, i) {
  const p = createRef<MyTxt>();

  // Calculate percentage based on the current index
  const percentage = Math.pow(0.9, i) * 100;
  const text = `[${percentage.toFixed(i >= 3 ? 1 : 0)}%]`;

  view.add(
    <MyTxt
      fontSize={40}
      padding={20}
      ref={p}
      textAlign="center"
      text={text}
      fill={Solarized.gray}
      opacity={0.5}
      zIndex={-1}
    />,
  );

  p().absolutePosition(() => {
    let response = responseLayout().children()[i];
    let responseCenter = response.absolutePosition();

    return responseCenter
      .addX(-response.width() / 2)
      .addX(-p().width() / 2)
      .addX(responseLayout().width() * 0.9);
  });

  yield* all(
    p().opacity(0).opacity(1, 1),
    p().scale(0).scale(1, 1),
    responseLayout().children()[i].fill(Solarized.cyan, 1),
  );
}

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const student = createRef<Img>();
  const teacher = createRef<Img>();

  view.add(
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

  const challenge = createRef<MyTxt>();
  view.add(
    <MyTxt
      fontSize={70}
      padding={20}
      top={teacher().top().addY(100)}
      ref={challenge}
      text={'13 + 32'}
      zIndex={-1}
    />,
  );

  yield* all(
    challenge().bottom(teacher().top(), 1),
    challenge().opacity(0).opacity(1, 1),
    challenge().scale(0).scale(1, 1),
  );

  // Tom's note: this pattern makes it so that response is also a reference to txt
  //  just doing challenge().clone() would return a Txt, not Reference<Txt>
  let response = createRef<MyTxt>();
  response(challenge().clone());

  challenge().opacity(0.25);
  view.add(response());

  // send response to student + solve
  yield* all(response().bottom(student().top().addY(-15).addX(-30), 1));
  yield* solve(view, response());

  const eq = createRef<MyTxt>();
  eq(challenge().clone().text('=').padding(0).opacity(0));
  eq().position(eq().position().addX(60));

  view.add(eq());

  // get it back
  yield* all(
    challenge().right(eq().left(), 1),
    response().left(eq().right(), 1),
    delay(0.5, all(challenge().opacity(1, 1), eq().opacity(1, 1))),
  );

  const challengeLayout = createRef<Layout>();
  const responseLayout = createRef<Layout>();

  view.add(
    <Layout layout gap={80} direction={'row'} top={() => new Vector2(0, -350)}>
      <Layout ref={challengeLayout} direction={'column'} gap={10} alignItems={'end'}>
        <MyTxt
          fontSize={60}
          fontFamily={FONT_FAMILY}
          text={'Challenge'}
          padding={[0, 0, 20, 0]}
          opacity={0}
          fontWeight={700}
        />
        {challenge().clone().padding(0).fontSize(50).opacity(0)}
      </Layout>
      <Layout ref={responseLayout} direction={'column'} gap={10} alignItems={'start'}>
        <MyTxt
          fontSize={60}
          fontFamily={FONT_FAMILY}
          text={'Response'}
          padding={[0, 0, 20, 0]}
          opacity={0}
          fontWeight={700}
        />
        {response().clone().padding(0).fontSize(50).opacity(0)}
      </Layout>
    </Layout>,
  );

  yield* all(
    eq().opacity(0, 0.25),
    student().position(student().position().addX(100), 1),
    teacher().position(teacher().position().addX(-100), 1),
    delay(
      0.5,
      all(
        challengeLayout().children()[0].opacity(1, 1),
        responseLayout().children()[0].opacity(1, 1),
      ),
    ),
    challenge().absolutePosition(challengeLayout().children()[1].absolutePosition(), 1),
    challenge().fontSize(50, 1),
    response().absolutePosition(responseLayout().children()[1].absolutePosition(), 1),
    response().fontSize(50, 1),
  );

  challenge().remove();
  response().remove();
  challenge(challengeLayout().children()[1]);
  response(responseLayout().children()[1]);
  challenge().opacity(1);
  response().opacity(1);

  yield* addChallengeAndResponse(
    view,
    challengeLayout,
    responseLayout,
    challenge,
    teacher,
    student,
    response,
    false,
    null,
  );

  const onlyThisMuch = createRef<MyTxt>();
  view.add(
    <MyTxt
      fontSize={40}
      padding={20}
      top={student().top().addY(100)}
      ref={onlyThisMuch}
      textAlign="center"
      text={'I hope the first\nnumber is below 90...'}
      fontStyle="italic"
      zIndex={-1}
    />,
  );

  yield* all(
    onlyThisMuch().bottom(student().top(), 1),
    onlyThisMuch().opacity(0).opacity(1, 1),
    onlyThisMuch().scale(0).scale(1, 1),
  );

  // show probabilities
  for (let i = 1; i <= 2; i++) {
    yield* animatePercentage(view, responseLayout, i);
  }

  for (let i = 3; i < 5; i++) {
    yield* all(
      addChallengeAndResponse(
        view,
        challengeLayout,
        responseLayout,
        challenge,
        teacher,
        student,
        response,
        true,
        Solarized.cyan,
      ),
      delay(0.25, animatePercentage(view, responseLayout, i)),
    );
  }
});
