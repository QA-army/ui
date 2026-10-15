import { mount } from "svelte";
import { recordAdoption } from "./adoption.ts";
import Showcase from "./showcase/Showcase.svelte";
import "./showcase/tokens.css";

const version = "0.0.1";
void recordAdoption({
  version,
  storage: localStorage,
  doNotTrack: navigator.doNotTrack === "1",
});

mount(Showcase, { target: document.getElementById("app")! });
