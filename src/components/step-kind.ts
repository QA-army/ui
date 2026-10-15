// Display identity for the seven step types. Outcomes stay separate.

export type StepMark = {
  readonly fills?: readonly { readonly d: string; readonly rule?: "evenodd" }[];
  readonly strokes?: readonly string[];
  readonly fit: { readonly s: number; readonly x: number; readonly y: number };
};

type StepKindDefinition = {
  readonly label: string;
  readonly description: string;
  readonly mark: StepMark;
};

function kind(definition: StepKindDefinition): StepKindDefinition {
  return definition;
}

export const stepKinds = {
  ACT: kind({
    label: "Act",
    description: "Perform an action",
    mark: { fit: { s: 1.161, x: -1.45, y: -1.45 }, fills: [{ d: "M3.4 6.1h5.2V3.4L14.6 9l-6 5.6V11.9H3.4V6.1z" }] },
  }),
  ASSERT: kind({
    label: "Verify",
    description: "Check an expected outcome",
    mark: {
      fit: { s: 1.016, x: -0.14, y: -0.14 },
      fills: [
        { d: "M2.6 2.6h12.8v12.8H2.6V2.6zm2.2 2.2v8.4h8.4V4.8H4.8z", rule: "evenodd" as const },
        { d: "M6.1 8.7 8.1 10.8 12.2 6.2 13.3 7.3 8.1 12.8 5 9.8z" },
      ],
    },
  }),
  LOGIN: kind({
    label: "Login",
    description: "Use an authorized credential",
    mark: {
      fit: { s: 1, x: -0.5, y: 0.1 },
      fills: [
        { d: "M3 5.2h7v7H3V5.2zm2.2 2.2h2.6v2.6H5.2V7.4z", rule: "evenodd" as const },
        { d: "M10 7.8h5.5v2H10v-2zM12.2 9.8h1.4v2.8h-1.4V9.8zm2.4 0H16v1.8h-1.4V9.8z" },
      ],
    },
  }),
  FILES: kind({
    label: "Files",
    description: "Supply authorized files",
    mark: {
      fit: { s: 0.963, x: 0.33, y: 0.57 },
      fills: [
        { d: "M7 2h8v10H7V2z" },
        { d: "M3 5.5h8v10H3v-10zm1.4 2.2h5.2v1.1H4.4v-1.1zm0 2.3h5.2v1.1H4.4V10zm0 2.3h5.2V13.4H4.4v-1.1z", rule: "evenodd" as const },
      ],
    },
  }),
  SCREENSHOT: kind({
    label: "Screenshot",
    description: "Capture visual evidence",
    mark: {
      fit: { s: 0.878, x: 1.09, y: 0.39 },
      fills: [
        { d: "M1.6 6.6h14.8V15.6H1.6V6.6zM8.2 11.1a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0z", rule: "evenodd" as const },
        { d: "M3 4h5.2v2.6H3V4z" },
      ],
    },
  }),
  JAVASCRIPT: kind({
    label: "JavaScript",
    description: "Run a web JavaScript check",
    mark: {
      fit: { s: 0.985, x: 0.14, y: 0.53 },
      fills: [{
        d: "M7.6 2.3H6.3C4.6 2.3 3.8 3.4 3.8 4.8V7C3.8 7.7 3.3 8.1 2.4 8.5 3.3 8.9 3.8 9.3 3.8 10v2.4c0 1.4.8 2.5 2.5 2.5h1.3V13.4H6.6C5.7 13.4 5.3 12.9 5.3 12.1V10.2C5.3 9.3 4.7 8.8 3.6 8.4 4.7 8 5.3 7.5 5.3 6.6V4.9C5.3 4.1 5.7 3.8 6.6 3.8h1V2.3zM10.4 2.3h1.3c1.7 0 2.5 1.1 2.5 2.5V7c0 .7.5 1.1 1.4 1.5-.9.4-1.4.8-1.4 1.5v2.4c0 1.4-.8 2.5-2.5 2.5h-1.3V13.4h1c.9 0 1.3-.5 1.3-1.3V10.2c0-.9.6-1.4 1.7-1.8-1.1-.4-1.7-.9-1.7-1.8V4.9c0-.8-.4-1.1-1.3-1.1h-1V2.3z",
      }],
    },
  }),
  MICROPHONE: kind({
    label: "Microphone",
    description: "Play an authorized audio asset",
    mark: {
      fit: { s: 0.878, x: 1.09, y: 0.92 },
      fills: [{ d: "M6.3 1.8h5.4v6.6H6.3V1.8z" }, { d: "M8.2 12.8h1.6V15.2H8.2z" }, { d: "M6.4 15.2h5.2V16.6H6.4z" }],
      strokes: ["M4.6 7.2v2.1a4.4 4.4 0 0 0 8.8 0V7.2"],
    },
  }),
};

export type StepKind = keyof typeof stepKinds;

export function stepKind(type: string): StepKind | null {
  const normalized = type.toUpperCase() === "VERIFY" ? "ASSERT" : type.toUpperCase();
  return Object.prototype.hasOwnProperty.call(stepKinds, normalized) ? normalized as StepKind : null;
}
