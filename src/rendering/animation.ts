/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { easeInOutCubic, easeOutQuad } from "./animation-helpers.js";
import { roundedRectangle } from "./canvas-helper.js";
import { cacheTextureGenerator } from "./texture-cache.js";
import {
  revealAnimationTextureGeneratorFactory,
  TextureGenerator,
  unrevealedAnimationTextureGeneratorFactory
} from "./texture-generators.js";

// Enum of all the available animations
export const enum AnimationName {
  IDLE,
  FLASH_IN,
  FLASH_OUT,
  NUMBER,
  FLAGGED
}

export interface AnimationDesc {
  name: AnimationName;
  start: number;
  done?: () => void;
}

export interface Context {
  ts: number;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  animation: AnimationDesc;
}

// Calls and unsets the `done` callback if available.
function processDoneCallback(animation: AnimationDesc) {
  if (!animation.done) {
    return;
  }
  animation.done();
  delete animation.done;
}

export function idleAnimation({ ts, ctx, animation }: Context) {
  const animationLength = 5000;
  const normalized = ((ts - animation.start) / animationLength) % 1;
  const idx = Math.floor(normalized * 300);
  ctx.save();
  ctx.translate(5, 5);
  unrevealedAnimationTextureGenerator!(idx, ctx);
  ctx.restore();
}

export function flaggedAnimation({
  ts,
  ctx,
  width,
  height,
  animation
}: Context) {
  const animationLength = 5000;
  const normalized = ((ts - animation.start) / animationLength) % 1;
  const idx = Math.floor(normalized * 300);

  ctx.save();
  ctx.translate(5, 5);
  unrevealedAnimationTextureGenerator!(idx, ctx);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = "red";
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function numberAnimation(
  touching: number,
  canDoSurroundingReveal: boolean,
  { ts, ctx, width, height, animation }: Context
) {
  const animationLength = 2000;
  let normalized = (ts - animation.start) / animationLength;
  if (normalized < 0) {
    return;
  }
  if (normalized > 1) {
    normalized = 1;
  }

  ctx.save();
  ctx.translate(5, 5);
  const idx = Math.floor(normalized * 119);
  revealAnimationTextureGenerator!(idx, ctx);
  ctx.translate(-5, -5);
  ctx.fillStyle = "#fff";
  if (canDoSurroundingReveal) {
    ctx.fillStyle = "#5f5";
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${height / 3}px sans-serif`;
  ctx.fillText(`${touching}`, width / 2, height / 2);
  ctx.restore();
}

export function flashInAnimation({
  ts,
  ctx,
  width,
  height,
  animation
}: Context) {
  const animationLength = 100;
  let normalized = (ts - animation.start) / animationLength;
  if (normalized < 0) {
    return;
  }
  if (normalized > 1) {
    processDoneCallback(animation);
    normalized = 1;
  }
  ctx.save();
  // A litte buffer on each size for the border
  const size = (width - 10) * 0.97;
  roundedRectangle(ctx, 5, 5, size, size, (size * 76) / 650);
  ctx.clip();
  ctx.fillStyle = `rgba(255, 255, 255, ${easeOutQuad(normalized)}`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function flashOutAnimation({
  ts,
  ctx,
  width,
  height,
  animation
}: Context) {
  const animationLength = 700;
  let normalized = (ts - animation.start) / animationLength;
  if (normalized < 0) {
    return;
  }
  if (normalized > 1) {
    processDoneCallback(animation);
    normalized = 1;
  }
  ctx.save();
  // A litte buffer on each size for the border
  const size = (width - 10) * 0.97;
  roundedRectangle(ctx, 5, 5, size, size, (size * 76) / 650);
  ctx.clip();
  ctx.fillStyle = `rgba(255, 255, 255, ${1 - easeInOutCubic(normalized)}`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

let unrevealedAnimationTextureGenerator: TextureGenerator | null = null;
let revealAnimationTextureGenerator: TextureGenerator | null = null;

export function initTextureCaches(textureSize: number) {
  if (unrevealedAnimationTextureGenerator) {
    // If we have one, we have them all.
    return;
  }

  const tileSize = textureSize - 10;
  const uncachedUATG = unrevealedAnimationTextureGeneratorFactory(
    tileSize,
    300
  );
  unrevealedAnimationTextureGenerator = cacheTextureGenerator(
    uncachedUATG,
    tileSize,
    300
  );
  const uncachedRATG = revealAnimationTextureGeneratorFactory(tileSize, 120);
  revealAnimationTextureGenerator = cacheTextureGenerator(
    uncachedRATG,
    tileSize,
    120
  );
}
