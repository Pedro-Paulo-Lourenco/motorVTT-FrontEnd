<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {
  Application,
  Assets,
  Circle,
  Container,
  Graphics,
  Point,
  Rectangle,
  Sprite,
  Text,
  type FederatedPointerEvent,
  type Texture,
} from 'pixi.js';

import { DEMO_GRID_DEFAULTS, type GridConfig, type TabletopToken } from '@/tabletop/protocol';

const MAP_URL = '/tabletop-demo-map.svg';
const MAP_WIDTH = 1600;
const MAP_HEIGHT = 1000;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;

const props = defineProps<{
  tokens: TabletopToken[];
  gridConfig?: GridConfig;
  canEdit: boolean;
  selectedTokenId: string | null;
}>();

const canvasHost = ref<HTMLElement | null>(null);
const emit = defineEmits<{
  selectToken: [tokenId: string | null];
  moveToken: [move: { tokenId: string; x: number; y: number }];
  canvasError: [message: string];
}>();

let application: Application | undefined;
let camera: Container | undefined;
let tokenLayer: Container | undefined;
let gridLayer: Graphics | undefined;
let hostElement: HTMLElement | undefined;
let disposed = false;
let cameraHasBeenInitialized = false;
let panOrigin: { pointerX: number; pointerY: number; cameraX: number; cameraY: number } | undefined;
let draggingToken: { id: string; originX: number; originY: number; moved: boolean } | undefined;
let wheelListener: ((event: WheelEvent) => void) | undefined;
let resizeObserver: ResizeObserver | undefined;

function gridOptions(): GridConfig {
  return { ...DEMO_GRID_DEFAULTS, ...props.gridConfig };
}

function redrawGrid(): void {
  if (!gridLayer) return;
  gridLayer.clear();
  const config = gridOptions();
  if (!config.enabled) return;

  const size = config.size;
  const color = config.color ?? DEMO_GRID_DEFAULTS.color ?? '#e5d2a3';
  const opacity = config.opacity ?? DEMO_GRID_DEFAULTS.opacity ?? 0.28;
  for (let x = 0; x <= MAP_WIDTH; x += size) {
    gridLayer.moveTo(x, 0).lineTo(x, MAP_HEIGHT).stroke({ color, alpha: opacity, width: 1 });
  }
  for (let y = 0; y <= MAP_HEIGHT; y += size) {
    gridLayer.moveTo(0, y).lineTo(MAP_WIDTH, y).stroke({ color, alpha: opacity, width: 1 });
  }
}

function fitCamera(): void {
  if (!application || !camera) return;
  const scale = Math.min(application.screen.width / MAP_WIDTH, application.screen.height / MAP_HEIGHT, 1);
  camera.scale.set(scale);
  camera.position.set(
    (application.screen.width - MAP_WIDTH * scale) / 2,
    (application.screen.height - MAP_HEIGHT * scale) / 2,
  );
  cameraHasBeenInitialized = true;
}

function createStaticObjects(layer: Container): void {
  const objects = [
    { x: 1000, y: 360, radius: 5, color: 0xe1c387, label: 'RUÍNAS' },
    { x: 631, y: 611, radius: 8, color: 0xc0a779, label: '' },
    { x: 1198, y: 551, radius: 8, color: 0xc0a779, label: '' },
    { x: 909, y: 785, radius: 8, color: 0xc0a779, label: '' },
    { x: 254, y: 732, radius: 8, color: 0xc0a779, label: '' },
  ];

  for (const object of objects) {
    const marker = new Graphics()
      .circle(0, 0, object.radius)
      .fill({ color: object.color, alpha: 0.85 })
      .stroke({ color: 0xd5c59d, alpha: 0.85, width: 3 });
    marker.position.set(object.x, object.y);
    layer.addChild(marker);
    if (object.label) {
      const label = new Text({
        text: object.label,
        style: { fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 'bold', fill: 0xf1e8cf },
      });
      label.anchor.set(0.5);
      label.position.set(object.x, object.y - object.radius - 14);
      layer.addChild(label);
    }
  }
}

function renderTokens(): void {
  if (!tokenLayer) return;
  tokenLayer.removeChildren().forEach((child) => child.destroy({ children: true }));

  for (const token of props.tokens) {
    const selected = token.id === props.selectedTokenId;
    const item = new Container();
    item.label = token.id;
    item.position.set(token.x, token.y);
    item.scale.set(Math.min(Math.max(token.escala, 0.5), 2));
    item.eventMode = 'static';
    item.cursor = props.canEdit ? 'grab' : 'default';
    item.hitArea = new Circle(0, 0, 28);

    const shadow = new Graphics().ellipse(0, 11, 23, 9).fill({ color: 0x14201b, alpha: 0.55 });
    const tokenShape = new Graphics()
      .circle(0, 0, 22)
      .fill({ color: selected ? 0xe8b86d : 0x425a48 })
      .stroke({ color: selected ? 0xffe3a1 : 0xe2d3ac, alpha: 0.95, width: selected ? 4 : 2 });
    const initial = new Text({
      text: token.nome.trim().slice(0, 1).toUpperCase(),
      style: { fontFamily: 'Georgia, serif', fontSize: 19, fontWeight: 'bold', fill: 0xfff6df },
    });
    initial.anchor.set(0.5);
    const name = new Text({
      text: token.nome,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 13,
        fontWeight: 'bold',
        fill: 0xffffff,
        stroke: { color: 0x1e2a23, width: 3 },
      },
    });
    name.anchor.set(0.5);
    name.position.set(0, 35);
    item.addChild(shadow, tokenShape, initial, name);

    if (props.canEdit) {
      item.on('pointerdown', (event: FederatedPointerEvent) => {
        event.stopPropagation();
        emit('selectToken', token.id);
        if (props.canEdit && event.button === 0) {
          draggingToken = { id: token.id, originX: token.x, originY: token.y, moved: false };
        }
      });
    } else {
      item.on('pointerdown', (event: FederatedPointerEvent) => {
        event.stopPropagation();
        emit('selectToken', token.id);
      });
    }
    tokenLayer.addChild(item);
  }
}

function onPointerDown(event: FederatedPointerEvent): void {
  if (draggingToken) return;
  emit('selectToken', null);
  panOrigin = {
    pointerX: event.global.x,
    pointerY: event.global.y,
    cameraX: camera?.x ?? 0,
    cameraY: camera?.y ?? 0,
  };
}

function onPointerMove(event: FederatedPointerEvent): void {
  if (draggingToken && camera) {
    const token = props.tokens.find((entry) => entry.id === draggingToken?.id);
    if (!token) return;
    const position = camera.toLocal(event.global);
    const size = gridOptions().enabled ? gridOptions().size : 1;
    const dragged = tokenLayer?.children.find((child) => {
      return child instanceof Container && child.label === draggingToken?.id;
    });
    if (dragged) {
      if (Math.hypot(position.x - draggingToken.originX, position.y - draggingToken.originY) > 2) {
        draggingToken.moved = true;
      }
      dragged.position.set(
        Math.round(position.x / size) * size,
        Math.round(position.y / size) * size,
      );
    }
    return;
  }

  if (panOrigin && camera) {
    camera.position.set(
      panOrigin.cameraX + event.global.x - panOrigin.pointerX,
      panOrigin.cameraY + event.global.y - panOrigin.pointerY,
    );
  }
}

function onPointerUp(event: FederatedPointerEvent): void {
  if (draggingToken && camera) {
    const dragging = draggingToken;
    if (dragging.moved) {
      const position = camera.toLocal(event.global);
      const size = gridOptions().enabled ? gridOptions().size : 1;
      emit('moveToken', {
        tokenId: dragging.id,
        x: Math.round(position.x / size) * size,
        y: Math.round(position.y / size) * size,
      });
    }
    draggingToken = undefined;
  }
  panOrigin = undefined;
  renderTokens();
}

function onWheel(event: WheelEvent): void {
  if (!application || !camera) return;
  event.preventDefault();
  const bounds = application.canvas.getBoundingClientRect();
  const pointer = new Point(event.clientX - bounds.left, event.clientY - bounds.top);
  const worldPoint = camera.toLocal(pointer);
  const nextScale = Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, camera.scale.x * (event.deltaY < 0 ? 1.12 : 1 / 1.12)),
  );
  camera.scale.set(nextScale);
  camera.position.set(
    pointer.x - worldPoint.x * nextScale,
    pointer.y - worldPoint.y * nextScale,
  );
}

async function initializeCanvas(): Promise<void> {
  if (!hostElement) return;
  const app = new Application();
  try {
    await app.init({
      backgroundColor: 0x27362e,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      resizeTo: hostElement,
      preference: 'webgl',
    });
    if (disposed) {
      app.destroy({ removeView: true }, { children: true });
      return;
    }
    application = app;
    hostElement.appendChild(app.canvas);

    const viewport = new Container();
    const backgroundLayer = new Container();
    gridLayer = new Graphics();
    const objectLayer = new Container();
    tokenLayer = new Container();
    viewport.addChild(backgroundLayer, gridLayer, objectLayer, tokenLayer);
    app.stage.addChild(viewport);
    camera = viewport;

    const texture = await Assets.load<Texture>(MAP_URL);
    if (disposed) return;
    const background = new Sprite(texture);
    background.width = MAP_WIDTH;
    background.height = MAP_HEIGHT;
    backgroundLayer.addChild(background);
    createStaticObjects(objectLayer);
    redrawGrid();
    renderTokens();

    app.stage.eventMode = 'static';
    app.stage.hitArea = new Rectangle(0, 0, app.screen.width, app.screen.height);
    app.stage.on('pointerdown', onPointerDown);
    app.stage.on('pointermove', onPointerMove);
    app.stage.on('pointerup', onPointerUp);
    app.stage.on('pointerupoutside', onPointerUp);

    wheelListener = onWheel;
    app.canvas.addEventListener('wheel', wheelListener, { passive: false });
    resizeObserver = new ResizeObserver(() => {
      if (app.stage.hitArea instanceof Rectangle) {
        app.stage.hitArea.width = app.screen.width;
        app.stage.hitArea.height = app.screen.height;
      }
      if (!cameraHasBeenInitialized) fitCamera();
    });
    resizeObserver.observe(hostElement);
    fitCamera();
  } catch {
    if (!disposed) emit('canvasError', 'Não foi possível carregar o mapa da demonstração.');
    if (application === app) {
      app.destroy({ removeView: true }, { children: true });
      application = undefined;
    } else if (!disposed && app.renderer) {
      app.destroy({ removeView: true }, { children: true });
    }
  }
}

watch(
  () => props.tokens,
  renderTokens,
  { deep: true },
);
watch(() => props.selectedTokenId, renderTokens);
watch(() => props.canEdit, renderTokens);
watch(() => props.gridConfig, redrawGrid, { deep: true });

onMounted(() => {
  hostElement = canvasHost.value ?? undefined;
  void initializeCanvas();
});

onBeforeUnmount(() => {
  disposed = true;
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  if (application) {
    if (wheelListener) application.canvas.removeEventListener('wheel', wheelListener);
    application.stage.off('pointerdown', onPointerDown);
    application.stage.off('pointermove', onPointerMove);
    application.stage.off('pointerup', onPointerUp);
    application.stage.off('pointerupoutside', onPointerUp);
    application.destroy({ removeView: true }, { children: true });
  }
  wheelListener = undefined;
  application = undefined;
  camera = undefined;
  cameraHasBeenInitialized = false;
  tokenLayer = undefined;
  gridLayer = undefined;
});
</script>

<template>
  <div ref="canvasHost" class="tabletop-canvas-host" aria-label="Mapa tabletop com grid e tokens" />
</template>

<style scoped>
.tabletop-canvas-host {
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: grab;
}
.tabletop-canvas-host :deep(canvas) {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
