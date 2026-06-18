import { SparkRenderer, SplatFileType, SplatMesh } from "@sparkjsdev/spark";
import { Group, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from "three";
import {
  estimateFocalLength,
  type ViewerMetadata,
} from "../utils/viewerMetadata";
import {
  attachVortex,
  VORTEX_DEFAULTS,
  type VortexController,
  type VortexSettings,
} from "./vortexModifier";

const SPLAT_RENDER_DEFAULTS = {
  falloff: 1,
  maxStdDev: Math.sqrt(8),
  minPixelRadius: 0,
  maxPixelRadius: 512,
} as const;

const POINT_CLOUD_RENDER = {
  falloff: 0,
  maxStdDev: Math.sqrt(1),
  minPixelRadius: 1,
  maxPixelRadius: 2,
} as const;

const POINTER_MAX_ROTATION_X = 0.035;
const POINTER_MAX_ROTATION_Y = 0.05;
const POINTER_SMOOTHING = 0.1;

export interface ViewerOptions {
  container: HTMLElement;
  viewport?: HTMLElement | null;
  frame?: HTMLElement | null;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export class GaussianViewer {
  private container: HTMLElement;
  private viewport: HTMLElement;
  private frame: HTMLElement | null;
  private scene: Scene;
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private spark: SparkRenderer;
  private splatPivot: Group;
  private splatMesh: SplatMesh | null = null;
  private isDisposed = false;
  private animationFrameId: number | null = null;
  private lookAtTarget = new Vector3(0, 0, 0);
  private depthFocus = 2.0;
  private pivotDepth = 1.0;
  private options: ViewerOptions;
  private resizeObserver: ResizeObserver | null = null;
  private pointCloudMode = false;
  private pointerTarget = { x: 0, y: 0 };
  private pointerCurrent = { x: 0, y: 0 };
  private pointerElement: HTMLElement | null = null;
  private vortex: VortexController | null = null;
  private vortexSettings: VortexSettings = { ...VORTEX_DEFAULTS };
  private vortexRevealStarted = false;

  constructor(options: ViewerOptions) {
    this.options = options;
    this.container = options.container;
    this.viewport = options.viewport ?? options.container;
    this.frame = options.frame ?? this.viewport.parentElement;

    this.scene = new Scene();

    this.camera = new PerspectiveCamera(45, 1, 0.01, 500);
    this.camera.position.set(0, 0, 0);
    this.camera.up.set(0, -1, 0);

    this.renderer = new WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.appendChild(this.renderer.domElement);

    this.spark = new SparkRenderer({ renderer: this.renderer });
    this.scene.add(this.spark);

    this.splatPivot = new Group();
    this.scene.add(this.splatPivot);

    window.addEventListener("resize", this.handleResize);

    const resizeTarget = this.frame ?? this.viewport;
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.fitViewport());
      this.resizeObserver.observe(resizeTarget);
    }

    this.pointerElement = this.frame ?? this.viewport;
    this.pointerElement.addEventListener("pointermove", this.handlePointerMove);

    requestAnimationFrame(() => this.fitViewport());
    this.animate();
  }

  private handlePointerMove = (event: PointerEvent): void => {
    const bounds = this.pointerElement;
    if (!bounds) return;

    const rect = bounds.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    this.pointerTarget.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerTarget.y = -(
      ((event.clientY - rect.top) / rect.height) * 2 -
      1
    );
  };

  private updatePointerRotation(): void {
    this.pointerCurrent.x +=
      (this.pointerTarget.x - this.pointerCurrent.x) * POINTER_SMOOTHING;
    this.pointerCurrent.y +=
      (this.pointerTarget.y - this.pointerCurrent.y) * POINTER_SMOOTHING;

    if (!this.splatMesh) return;

    this.splatPivot.rotation.y = this.pointerCurrent.x * POINTER_MAX_ROTATION_Y;
    this.splatPivot.rotation.x = this.pointerCurrent.y * POINTER_MAX_ROTATION_X;
  }

  private handleResize = (): void => {
    if (this.isDisposed) return;
    this.fitViewport();
  };

  private fitViewport(): void {
    const bounds = this.frame ?? this.viewport.parentElement;
    if (!bounds) return;

    const width = bounds.clientWidth;
    const height = bounds.clientHeight;

    if (width <= 0 || height <= 0) return;

    this.viewport.style.width = `${width}px`;
    this.viewport.style.height = `${height}px`;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, true);
  }

  private animate = (): void => {
    if (this.isDisposed) return;

    this.animationFrameId = requestAnimationFrame(this.animate);
    this.updatePointerRotation();
    this.vortex?.tick();
    this.updateVortexReveal();
    this.renderer.render(this.scene, this.camera);
  };

  private updateVortexReveal(): void {
    if (!this.vortexRevealStarted || !this.vortex) return;

    const clockTime = this.spark.clock.getElapsedTime();
    if (this.vortex.isRevealComplete(clockTime)) {
      this.vortexRevealStarted = false;
    }
  }

  private startVortex(): void {
    if (!this.splatMesh) return;

    this.vortex = attachVortex(this.splatMesh, {
      camera: this.camera,
      ...this.vortexSettings,
    });
    this.vortex.startReveal(this.spark.clock.getElapsedTime());
    this.vortexRevealStarted = true;
    this.splatMesh.visible = true;
  }

  private stopVortex(): void {
    this.vortex?.detach();
    this.vortex = null;
    this.vortexRevealStarted = false;
  }

  private clearSplatMesh(): void {
    if (!this.splatMesh) return;

    this.stopVortex();
    this.splatPivot.remove(this.splatMesh);
    this.splatMesh.dispose();
    this.splatMesh = null;
    this.splatPivot.rotation.set(0, 0, 0);
  }

  private async fetchViewerMetadata(
    metadataUrl?: string,
  ): Promise<ViewerMetadata | null> {
    if (!metadataUrl) return null;

    try {
      const response = await fetch(metadataUrl);
      if (!response.ok) return null;
      return (await response.json()) as ViewerMetadata;
    } catch {
      return null;
    }
  }

  async loadSogUrl(
    url: string,
    fileName: string,
    metadataUrl?: string,
  ): Promise<void> {
    try {
      this.clearSplatMesh();

      const viewerMetadata = await this.fetchViewerMetadata(metadataUrl);

      this.splatMesh = new SplatMesh({
        url,
        fileName,
        fileType: SplatFileType.PCSOGSZIP,
      });
      this.splatMesh.visible = false;
      this.splatPivot.add(this.splatMesh);

      await this.splatMesh.initialized;

      if (this.isDisposed) return;

      this.applyRenderMode();
      this.setupCameraForScene(viewerMetadata);
      this.startVortex();
      requestAnimationFrame(() => this.fitViewport());
      this.options.onLoad?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.options.onError?.(err);
      throw err;
    }
  }

  private setupCameraForScene(viewerMetadata?: ViewerMetadata | null): void {
    if (!this.splatMesh) return;

    const box = this.splatMesh.getBoundingBox(true);
    const minZ = box.min.z;
    const maxZ = box.max.z;
    this.depthFocus = Math.max(2.0, minZ + 0.1 * (maxZ - minZ));
    this.pivotDepth = minZ + 1 * (maxZ - minZ);

    this.splatPivot.position.set(0, 0, this.pivotDepth);
    this.splatMesh.position.set(0, 0, -this.pivotDepth);
    this.splatMesh.rotation.set(0, 0, 0);
    this.splatPivot.rotation.set(0, 0, 0);

    if (viewerMetadata?.hasMetadata) {
      const [, imageHeight] = viewerMetadata.imageSize;
      const focalLength =
        viewerMetadata.focalLength > 0
          ? viewerMetadata.focalLength
          : estimateFocalLength(viewerMetadata.imageSize);

      this.camera.fov =
        2 * Math.atan(imageHeight / (2 * focalLength)) * (180 / Math.PI);
    }

    this.fitViewport();

    this.camera.position.set(0, 0, 0);
    this.lookAtTarget.set(0, 0, this.depthFocus);
    this.camera.lookAt(this.lookAtTarget);
  }

  isLoaded(): boolean {
    return this.splatMesh !== null;
  }

  setPointCloudMode(enabled: boolean): void {
    if (this.pointCloudMode === enabled) return;

    this.pointCloudMode = enabled;
    this.applyRenderMode();
  }

  setVortexSettings(settings: Partial<VortexSettings>): void {
    this.vortexSettings = { ...this.vortexSettings, ...settings };
    this.vortex?.setSettings(settings);
  }

  private applyRenderMode(): void {
    const settings = this.pointCloudMode
      ? POINT_CLOUD_RENDER
      : SPLAT_RENDER_DEFAULTS;

    this.spark.falloff = settings.falloff;
    this.spark.maxStdDev = settings.maxStdDev;
    this.spark.minPixelRadius = settings.minPixelRadius;
    this.spark.maxPixelRadius = settings.maxPixelRadius;
  }

  dispose(): void {
    this.isDisposed = true;
    this.stopVortex();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener("resize", this.handleResize);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    if (this.pointerElement) {
      this.pointerElement.removeEventListener(
        "pointermove",
        this.handlePointerMove,
      );
      this.pointerElement = null;
    }

    if (this.splatMesh) {
      this.splatPivot.remove(this.splatMesh);
      this.splatMesh.dispose();
    }

    this.renderer.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
