import {
  Circle,
  Img,
  Layout,
  Line,
  makeScene2D,
  Node,
  NodeProps,
  Rect,
  Txt,
} from '@motion-canvas/2d';
import {
  all,
  chain,
  createRef,
  delay,
  easeInExpo,
  easeInOutExpo,
  linear,
  loop,
  Reference,
  Vector2,
  waitFor,
} from '@motion-canvas/core';
import { FONT_FAMILY, Solarized } from '../utilities';

import user_tie from '../assets/icons/user-tie-solid.svg';
import thumbs_up from '../assets/icons/thumbs-up-solid.svg';

import gradientShader from '../shaders/gradient2.glsl';

import chroma from 'chroma-js';

export interface MobileProps extends NodeProps {
  pinLength: number;
  blurStrength?: number; // TODO: this!!!

  width?: number;
  height?: number;
}

export class Mobile extends Layout {
  private readonly background = createRef<Rect>();
  private readonly notchTop = createRef<Rect>();
  private readonly notchAround = createRef<Rect>();
  private readonly lockscreen = createRef<Rect>();

  private readonly screenNode = createRef<Node>();

  private readonly passwordField = createRef<Rect>();
  private readonly passwordTextPins: Array<Reference<Txt>> = [];
  private readonly passwordPINText = createRef<Txt>();

  private readonly passwordSection = createRef<Layout>();
  private readonly passwordCircles = Array.from({ length: 10 }, () =>
    createRef<Circle>(),
  );

  public constructor(props?: MobileProps) {
    super({ ...props });

    this.width(props.width ?? 400);
    this.height(props.height ?? 700);

    for (let i = 0; i < props.pinLength; i++) {
      this.passwordTextPins.push(createRef<Txt>());
    }

    this.add(
      <>
        <Rect
          ref={this.background}
          width={this.width}
          height={this.height}
          fill={Solarized.base01}
          radius={60}
          zIndex={-2}
        />
        <Rect
          ref={this.notchAround}
          width={this.background().width}
          height={this.background().height}
          radius={this.background().radius}
          lineWidth={20}
          stroke={Solarized.base03}
          scale={this.background().scale}
          zIndex={0}
        />
        <Rect
          ref={this.notchTop}
          width={() => this.background().width() / 2}
          height={this.notchAround().lineWidth}
          fill={Solarized.base03}
          scale={this.background().scale}
          top={this.background().top}
          opacity={this.background().opacity}
          radius={this.background().radius}
          zIndex={1}
        />
        <Node ref={this.screenNode} cache zIndex={-1}>
          <Rect
            position={this.background().position}
            scale={this.background().scale}
            width={this.background().width}
            height={this.background().height}
            radius={this.background().radius}
            fill={this.background().fill}
          />
          <Layout
            ref={this.passwordSection}
            layout
            scale={this.background().scale}
            direction={'column'}
            gap={80}
            alignItems={'center'}
            compositeOperation={'source-in'}
          >
            <Layout layout direction={'column-reverse'} gap={10} alignItems={'center'}>
              <Rect
                padding={8}
                ref={this.passwordField}
                lineDash={[71, 10, 10, 10]}
                radius={20}
                width={() => this.width() * (0.1 * props.pinLength)}
                height={60}
                lineWidth={10}
                gap={10}
                stroke={Solarized.cyan}
                justifyContent={'center'}
              >
                {Array.from({ length: props.pinLength }).map((_, i) => (
                  <Txt
                    ref={this.passwordTextPins[i]}
                    text={`*`}
                    fill={chroma(Solarized.base1).alpha(0.4)}
                    fontWeight={700}
                  />
                ))}
              </Rect>
              <Txt
                fontFamily={FONT_FAMILY}
                ref={this.passwordPINText}
                text={'PIN'}
                fill={Solarized.cyan}
                fontWeight={700}
              />
            </Layout>
            <Layout
              wrap={'wrap'}
              width={() => this.background().width() * 0.8}
              justifyContent={'center'}
              gap={() => (this.background().width() * 0.7) / 16}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((i) => {
                return (
                  <Circle
                    ref={this.passwordCircles[i]}
                    size={() => (this.background().width() * 0.7) / 4}
                    fill={chroma(Solarized.base1).alpha(0.7)}
                    alignItems={'center'}
                    justifyContent={'center'}
                  >
                    <Txt
                      fontFamily={FONT_FAMILY}
                      text={`${i}`}
                      fill={Solarized.base3}
                      fontWeight={700}
                    ></Txt>
                  </Circle>
                );
              })}
            </Layout>
          </Layout>
        </Node>
        <Rect
          ref={this.lockscreen}
          position={this.background().position}
          scale={this.background().scale}
          width={this.background().width}
          height={this.background().height}
          radius={this.background().radius}
          fill={this.background().fill}
          stroke={this.notchAround().stroke}
          lineWidth={this.notchAround().lineWidth}
        />
      </>,
    );
  }

  public *spinPin() {
    yield* loop(() =>
      this.passwordField()
        .lineDashOffset(0)
        .lineDashOffset(
          this.passwordField()
            .lineDash()
            .reduce((a, c) => a + c, 0),
          3,
          linear,
        ),
    );
  }

  public *showScreen(duration: number = 1) {
    this.passwordSection().filters.blur(10);

    yield* all(
      this.background().fill('white', duration, easeInOutExpo),
      this.lockscreen().opacity(0, duration, easeInOutExpo),
      this.passwordSection().filters.blur(0, duration, easeInOutExpo),
    );
  }

  public *inputPin(
    pin: Array<number>,
    click_duration: number = 0.5,
    success_delay: number = 0,
  ) {
    this.passwordTextPins.forEach((ref) => ref().save());

    let origColor = this.passwordCircles[0]().fill();

    yield* all(
      ...pin.map((i, idx) => {
        return delay(
          idx * click_duration,
          all(
            all(
              this.passwordTextPins[idx]().opacity(1, 0.5),
              this.passwordTextPins[idx]().fill(Solarized.cyan, 0.5),
            ),
            chain(
              all(
                this.passwordCircles[i]().scale(1.1, 0.25, easeInExpo),
                this.passwordCircles[i]().fill(Solarized.cyan, 0.25, easeInExpo),
              ),
              all(
                this.passwordCircles[i]().scale(1, 0.25, easeInExpo),
                this.passwordCircles[i]().fill(origColor, 0.25, easeInExpo),
              ),
            ),
          ),
        );
      }),
      delay(1.85 + success_delay, this.passwordPINText().text('Success!', 0.5)),
    );
  }

  public *resetPin() {
    yield* all(
      ...this.passwordTextPins.map((ref) => ref().restore(0.5)),
      this.passwordPINText().text('PIN', 0.5),
    );
  }

  public *swipeLeft() {
    yield* all(
      this.passwordSection().right(this.background().left(), 1),
      this.passwordSection().opacity(0, 1),
      this.passwordSection().filters.blur(10, 1),
    );
  }

  public *swipeRight() {
    yield* all(
      this.passwordSection().position(this.background().position, 1),
      this.passwordSection().opacity(1, 1),
      this.passwordSection().filters.blur(0, 1),
    );
  }
}

export default makeScene2D(function* (view) {
  view.fill(Solarized.base2);

  const PIN = [3, 1, 9, 2];

  const mobile = createRef<Mobile>();

  const image = createRef<Txt>();
  const ta = createRef<Node>();
  const taCircle = createRef<Circle>();
  const taText = createRef<Txt>();

  view.add(
    <>
      <Mobile ref={mobile} pinLength={4} />
    </>,
  );

  yield* all(mobile().scale(0).scale(1, 1), mobile().opacity(0).opacity(1, 1));

  yield mobile().spinPin();

  yield* mobile().showScreen();
  yield* mobile().inputPin(PIN);

  const line = createRef<Line>();

  view.add(
    <>
      <Layout ref={ta} layout gap={50} alignItems={'center'} direction={'column'}>
        <Circle ref={taCircle} stroke={Solarized.base02} lineWidth={20} size={300}>
          <Circle
            layout={false}
            size={() => taCircle().width() - 20}
            fill={Solarized.base1}
            shaders={{
              fragment: gradientShader,
              uniforms: {
                mixColor: chroma('white')
                  .rgba()
                  .map((i) => i / 256),
                mixStrength: 8,
                distFactor: 1,
                position: () => image().position(),
              },
            }}
          ></Circle>
          <Node cache>
            <Img
              ref={image}
              layout={false}
              width={() => taCircle().width() / 2}
              src={user_tie}
            />
            <Rect
              layout={false}
              size={() => Math.max(image().width(), image().height()) * 5}
              rotation={image().rotation}
              fill={Solarized.base02}
              compositeOperation={'source-in'}
            />
          </Node>
        </Circle>
        <Txt fontFamily={FONT_FAMILY} ref={taText} textAlign={'center'} fontSize={50} />
      </Layout>
      <Line
        ref={line}
        points={() => {
          let b = ta().position().add(taCircle().left());
          let a = new Vector2(mobile().right().x, b.y);

          return [b, a];
        }}
        lineWidth={20}
        stroke={Solarized.cyan}
        lineDash={[50, 30]}
      />
    </>,
  );

  ta().moveToBottom();
  line().moveToBottom();

  // TODO: this to utility
  yield loop(() =>
    line()
      .lineDashOffset(0)
      .lineDashOffset(
        line()
          .lineDash()
          .reduce((a, c) => a + c, 0),
        0.5,
        linear,
      ),
  );

  yield* waitFor(1);

  yield* all(
    mobile().x(-350, 1),
    ta().x(350, 1),
    all(
      taCircle().width(0).width(300, 1),
      taCircle().height(0).height(300, 1),
      taCircle().opacity(0).opacity(1, 1),
      taText().text('').text('Trusted Authority', 1),
      taText().opacity(0).opacity(1, 1),
    ),
    delay(0.25, mobile().resetPin()),
  );

  yield* waitFor(1);

  const sendNumbers = PIN.map(() => createRef<Txt>());
  const sendSuccess = createRef<Node>();
  const sendSuccessImg = createRef<Img>();

  view.add(
    <>
      {sendNumbers.map((ref, i) => (
        <Txt
          fontFamily={FONT_FAMILY}
          fontSize={70}
          fontWeight={700}
          position={line().points()[1].add(new Vector2(-50, -50))}
          ref={ref}
          fill={Solarized.cyan}
          text={`${PIN[i]}`}
          zIndex={-1}
        />
      ))}
      <Node
        ref={sendSuccess}
        cache
        position={line().points()[0].add(new Vector2(100, -60))}
        zIndex={-1}
      >
        <Img ref={sendSuccessImg} width={70} src={thumbs_up} />
        <Rect
          size={() => Math.max(sendSuccessImg().width(), sendSuccessImg().height()) * 5}
          rotation={image().rotation}
          fill={Solarized.cyan}
          compositeOperation={'source-in'}
        />
      </Node>
    </>,
  );

  yield* all(
    delay(
      0.15,
      all(
        ...sendNumbers.map((ref, i) =>
          delay(
            i * 0.11,
            ref().position(line().points()[0].add(new Vector2(100, -50)), 1, linear),
          ),
        ),
      ),
    ),
    delay(
      1.75,
      sendSuccess().position(line().points()[1].add(new Vector2(-50, -60)), 1, linear),
    ),
    mobile().inputPin(PIN, 0.11, 0.7),
  );

  yield* waitFor(1);

  // yield* mobile().swipeLeft();
});
