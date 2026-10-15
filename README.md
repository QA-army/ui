# QA.army UI

The QA.army web UI. Open source under the MIT License.

This repository is the standalone interface for the QA workspace. It is separate from the hosted execution service. The samples below are the workbench components.

The full run page is [`src/run/RunDetail.svelte`](src/run/RunDetail.svelte). The hosted service supplies the Run, its events, and evidence. This package does not call that service.

## Desktop

The run page at desktop width, light theme.

### Passed

![Passed](docs/gallery/desktop-passed.png)

### Running

![Running](docs/gallery/desktop-running.png)

### Failed

![Failed](docs/gallery/desktop-failed.png)

### Error

![Error](docs/gallery/desktop-error.png)

### Ready

![Ready](docs/gallery/desktop-ready.png)

### Unavailable

![Unavailable](docs/gallery/desktop-unavailable.png)

## Mobile

All six Run page states, at phone width.

| Passed | Running | Failed | Error | Ready | Unavailable |
| --- | --- | --- | --- | --- | --- |
| ![Passed](docs/gallery/state-passed.png) | ![Running](docs/gallery/state-running.png) | ![Failed](docs/gallery/state-failed.png) | ![Error](docs/gallery/state-error.png) | ![Ready](docs/gallery/state-ready.png) | ![Unavailable](docs/gallery/state-unavailable.png) |

## State buttons

Mock states. Flaky is a finished run with some steps passed. Ready, Queued, and Provisioning are one grey that gets darker. Running is blue. Flaky is teal. Cancelled is one grey for the square and the word. Error is bright yellow. Mocked is amber.

| State | Color |
| --- | --- |
| Ready | `#8B93A0` |
| Queued | `#59616E` |
| Provisioning | `#3A4250` |
| Running | `#2563EB` |
| Flaky | `#4EADA3` |
| Passed | `#079447` |
| Failed | `#C4372D` |
| Error | `#FFE500` |
| Cancelled | `#737373` |
| Mocked | `#E09B14` |

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

## Develop

Requires Node.js 22 or newer.

```sh
npm run dev
```

## License

[MIT](LICENSE) © 2026 QA.army
