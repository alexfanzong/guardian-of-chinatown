# Guardian of Chinatown

English · [简体中文](README.zh-CN.md)

A two-button arcade fighter against a monster that learns your habits.

**Version 2.0** adds an animated comic opening, palm guards, timed pounces, and advice drawn from your fight.

**[Play in your browser](https://alexfanzong.github.io/guardian-of-chinatown/)** · [Vercel mirror](https://guardian-of-chinatown-alexfanzong.vercel.app/) · [Download for offline play](https://alexfanzong.github.io/guardian-of-chinatown/downloads/Guardian-of-Chinatown-offline.zip)

[![Guardian of Chinatown: a martial-arts heroine facing a purple monster on a lantern-lit street](docs/media/cover.png)](https://alexfanzong.github.io/guardian-of-chinatown/)

Chinatown's lanterns are going out. Choose left or right, break the monster's reads, and get the street back.

## How to play

| Action | Keyboard | Touch |
| --- | --- | --- |
| Left punch | **A** or **←** | Tap the left half |
| Right punch | **D** or **→** | Tap the right half |
| Pause | **Esc** | Tap the pause button |

After the four-panel comic, the monster commits to a guess before each punch. A raised palm gives away the hand it guards. Strike with your other hand. When the creature crouches for a pounce, wait until its third eye opens, then tap either side to dodge. The first lesson is free. After learning the dodge, an early press or a miss costs one heart. Fool it three times in a row for a **Mind Break** bonus hit. At half health, choose guaranteed healing from tea or take a chance with the elixir. Both fighters start with 12 HP. A rematch clears the monster's memory.

Play at your own pace. Sound is optional; the pause menu also has a reduced-motion setting.

## Try a different rhythm

Alternate hands. Repeat a short loop. Change your pattern halfway through. After a fight the innkeeper offers one tip based on what you did. Select **Fight log** to see each exchange and the monster's confidence before your punch. The opening and game start in English; switch to Chinese from the pause menu after entering the street. **Patient dodge** holds the dodge cue open until you press.

The first palm guard teaches you to hit the open side. Later guards leave you to read the pose and fist mark. Guards appear at punches 4, 16, 28, and so on; pounces come after every six punches.

No account, download, or API key is needed to play. The game runs in your browser, with all game assets bundled locally. There is no gameplay telemetry or saved player history.

## Run locally

Use Node.js **22.12 or newer** and npm.

```sh
npm ci --ignore-scripts
npm run dev
```

Open the local address printed by Vite. Other commands:

```sh
npm test         # Game rules and fight-code checks
npm run build    # Static site in dist/
npm run preview  # Preview the built site locally
```

The static build works on Vercel and other static hosts. No backend or environment variables are required. The development server binds to your own computer by default.

## Under the hood

React and Vite power the game. The monster learns from recent punches. The [technical note](docs/research.md) preserves measurements from the 1.0 ruleset.

## Contributing

Found a bug? Open an issue with your browser, device, and the steps that produced it. Ideas for improving the game are welcome in issues too.

## Credits and license

Created by [Alex Fan](https://github.com/alexfanzong), with AI assistance in implementation and artwork.

Source is available for personal, non-commercial use and learning. Commercial use and publishing modified versions require the author’s written permission. See the [license](LICENSE) and [asset notes](docs/credits.md).
