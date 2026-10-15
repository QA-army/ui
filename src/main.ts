import { mount } from "svelte";
import Showcase from "./showcase/Showcase.svelte";
import "./showcase/tokens.css";

mount(Showcase, { target: document.getElementById("app")! });
