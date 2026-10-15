# QA.army UI

The QA.army web UI. Open source under the MIT License.

This repository is the standalone interface for the QA workspace. It is separate from the hosted execution service. The samples below are the workbench components.

## Mobile

Four states at phone width. The recording comes first, then the steps. Console, Network, Screengraph, and Metrics are not on this screen. The outcome sits beside the time.

Passed keeps the recording and Rerun. Running is a live view: the clock and Stop, with no scrubber. Failed is a check that did not hold, and the recording is still there. Error means the result could not be trusted, so the recording is absent.

### Passed

![Passed on a phone. Every step has a green check, the recording can be replayed, and Rerun is the action.](docs/gallery/mobile-passed.png)

### Running

![Running on a phone. Live View, the clock, and Stop. The current step says Running. Later steps have not started.](docs/gallery/mobile-running.png)

### Failed

![Failed on a phone. The price check is a red square. Later steps have not run. The recording remains.](docs/gallery/mobile-failed.png)

### Error

![Error on a phone. The header says Error, the recording is unavailable, and the summary counts one error.](docs/gallery/mobile-error.png)

## Component gallery

### Status

| Passed | Failed | Error | Ready | Cancelled |
| --- | --- | --- | --- | --- |
| ![Passed](docs/gallery/status-passed.png) | ![Failed](docs/gallery/status-failed.png) | ![Error](docs/gallery/status-error.png) | ![Ready](docs/gallery/status-ready.png) | ![Cancelled](docs/gallery/status-cancelled.png) |

### Step types

| Act | Verify | Login | Files |
| --- | --- | --- | --- |
| ![Act](docs/gallery/step-act.png) | ![Verify](docs/gallery/step-verify.png) | ![Login](docs/gallery/step-login.png) | ![Files](docs/gallery/step-files.png) |

| Screenshot | JavaScript | Microphone |
| --- | --- | --- |
| ![Screenshot](docs/gallery/step-screenshot.png) | ![JavaScript](docs/gallery/step-javascript.png) | ![Microphone](docs/gallery/step-microphone.png) |

### Outcomes

| Passed | Failed | Running | Not started |
| --- | --- | --- | --- |
| ![Passed mark](docs/gallery/outcome-passed.png) | ![Failed mark](docs/gallery/outcome-failed.png) | ![Running](docs/gallery/outcome-running.png) | ![Not started](docs/gallery/outcome-queued.png) |

### Header

| Passed | Settled time | Rerun |
| --- | --- | --- |
| ![Passed](docs/gallery/header-passed.png) | ![Settled time](docs/gallery/header-time.png) | ![Rerun](docs/gallery/header-rerun.png) |

| Running | Live time | Stop |
| --- | --- | --- |
| ![Running mark](docs/gallery/header-running.png) | ![Live time](docs/gallery/header-live.png) | ![Stop](docs/gallery/header-stop.png) |

### Transcript rows

![Passed step](docs/gallery/row-passed.png)

![Failed step](docs/gallery/row-failed.png)

![Running step](docs/gallery/row-running.png)

![Step that has not started](docs/gallery/row-queued.png)

### Playback

| Play | Previous | Next | Time |
| --- | --- | --- | --- |
| ![Play](docs/gallery/playback-play.png) | ![Previous](docs/gallery/playback-prev.png) | ![Next](docs/gallery/playback-next.png) | ![Elapsed time](docs/gallery/playback-time.png) |

| Seek | Speed | Fullscreen |
| --- | --- | --- |
| ![Seek](docs/gallery/playback-seek.png) | ![Speed](docs/gallery/playback-speed.png) | ![Fullscreen](docs/gallery/playback-full.png) |

### Instruction

![Instruction field](docs/gallery/field-instruction.png)

| Save test | Cancel |
| --- | --- |
| ![Save test](docs/gallery/button-save.png) | ![Cancel](docs/gallery/button-cancel.png) |

## Adoption

The UI can report that it started, so QA.army can see whether the open interface is being used. A report contains only:

- `event`: `ui_started`
- `version`: the UI version
- `install_id`: a random id created on the first start and kept in local storage
- `surface`: `web`

It does not include an account, Workspace, Test, Run, URL, or anything typed into the product. The browser's Do Not Track setting turns reporting off. Choosing off also deletes the stored install id.

```ts
import { recordAdoption, setTelemetry } from "qa-army-ui";

await recordAdoption({ version: "0.0.1", storage: localStorage });
setTelemetry(localStorage, "off");
```

Reports go to `https://qa.army/api/ui-adoption`. A network failure is ignored and does not affect the interface.

## Develop

Requires Node.js 22 or newer.

```sh
npm test
```

## License

[MIT](LICENSE) © 2026 QA.army
