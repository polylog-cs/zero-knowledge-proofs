import { makeScene2D, Layout, Img, Line } from '@motion-canvas/2d';
import { all, createRef, Vector2, waitFor } from '@motion-canvas/core';
import { MyTxt } from '../utilities_text';
import { Solarized } from '../utilities';

export default makeScene2D(function* (view) {
  // ------------------------------------------------
  // 1. Setup background and timeline container
  // ------------------------------------------------
  view.fill(Solarized.base2);

  // Provide an empty props object so TypeScript is happy
  const timelineGroup = new Layout({});
  view.add(timelineGroup);

  // ------------------------------------------------
  // 2. Timeline parameters and mapping from year -> x coordinate
  // ------------------------------------------------
  const startYear = 1970;
  const endYear = 2000;
  const spacing = 150; // pixels per year difference
  const timelineLength = (endYear - startYear) * spacing;
  const margin = 100; // extra margin at both ends

  function getXForYear(year: number): number {
    return (year - startYear) * spacing;
  }

  // ------------------------------------------------
  // 3. Draw the timeline line
  // ------------------------------------------------
  const timelineLine = (
    <Line
      lineWidth={4}
      stroke={Solarized.base01}
      points={[
        new Vector2(-margin, 0),
        new Vector2(timelineLength + margin, 0)
      ]}
    />
  );
  timelineGroup.add(timelineLine);

  // ------------------------------------------------
  // 4. Add year markers (text labels above the line)
  // ------------------------------------------------
  const yearLabels = [1970, 1975, 1980, 1985, 1990, 1995, 2000];
  for (const year of yearLabels) {
    const x = getXForYear(year);
    const yearText = (
      <MyTxt text={year.toString()} fontSize={30} fill={Solarized.base01} />
    );
    // Position above the line (e.g. y = 50)
    yearText.position.x(x);
    yearText.position.y(50);
    timelineGroup.add(yearText);
  }

  // ------------------------------------------------
  // 5. Create paper representations
  // ------------------------------------------------
  type Paper = {
    year: number;
    images: string[];
    description: string;
  };

  const papers: Paper[] = [
    {
      year: 1971,
      images: ["path1.jpg", "path2.jpg"],
      description: "My favorite paper"
    },
    {
      year: 1978,
      images: ["path3.jpg"],
      description: "Another influential paper"
    },
    // Add more papers as needed
  ];

  const paperImageHeight = 80;
  const imageGap = 10;

  for (const paper of papers) {
    // Provide an empty props object here as well
    const paperGroup = new Layout({});
    const paperX = getXForYear(paper.year);

    // Description text above the timeline
    const descTextRef = createRef<MyTxt>();
    const descText = (
      <MyTxt
        ref={descTextRef}
        text={paper.description}
        fontSize={24}
        fill={Solarized.base01}
      />
    );
    descTextRef().position.x(0);
    descTextRef().position.y(60);
    paperGroup.add(descText);

    // Author images below the timeline
    let currentX = 0;
    for (const imgPath of paper.images) {
      const authorImg = (
        <Img src={imgPath} height={paperImageHeight} smoothing={true} />
      );
      authorImg.position.x(currentX);
      authorImg.position.y(-60);
      paperGroup.add(authorImg);
      currentX += paperImageHeight + imageGap;
    }

    // Position the paperGroup at the timeline
    paperGroup.position.x(paperX);
    paperGroup.position.y(0);

    timelineGroup.add(paperGroup);
  }

  // ------------------------------------------------
  // 6. Animate the timeline scrolling from right to left
  // ------------------------------------------------
  timelineGroup.position.x(800);
  const targetX = - (timelineLength + margin);
  yield* timelineGroup.position.x(targetX, 20);

  yield* waitFor(2);
});
