# Zero-knowledge proofs

Animations for our video, "[I can prove I’ve solved this Sudoku without revealing it](https://www.youtube.com/watch?v=Otvcbw6k4eo)".

## Motion Canvas

To run the animations, run

```
npm install
```

to install dependencies and 

```
npm start
```

to launch the Motion Canvas editor.

## Code formatter

We use Prettier to format code. If you use VSCode, you can install the Prettier extension (`esbenp.prettier-vscode`) and then the correct formatting should get applied on save automatically. The formatting style is defined in `.prettierrc`, which is respected by the VSCode extension.

If you use a different editor, set up Prettier manually there.

If you need to run Prettier manually, you can do so using
```
npx prettier --write src/
```

## Sources

Facebook dataset (used as an example graph): https://snap.stanford.edu/data/egonets-Facebook.html

Pointing hand: https://www.rawpixel.com/image/6261834/png-sticker-vintage
